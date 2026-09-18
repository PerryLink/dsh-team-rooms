/**
 * A1 regression lock for the `agent/created` activation listener.
 *
 * The event is a SERIAL waterfall: the agent registry awaits every listener
 * before it finishes registering the agent, so a listener that returns a
 * promise bound to room-store I/O blocks agent creation behind a slow or stuck
 * store. The lock pins three properties:
 *  1. the listener settles agent creation even while the store open never
 *     settles (it decides synchronously and bypasses with a microtask);
 *  2. `clear`/`compact` starts and non-member sessions dispatch no catch-up at
 *     all (the in-memory membership pre-filter), while a member resume does;
 *  3. a rejected catch-up is swallowed and reported — it never fails agent
 *     creation.
 * @module dsh-team-rooms/tests/activation-listener.spec
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import { SessionId } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as plugin from '../src/index.ts'
import { RoomHub } from '../src/room/hub.ts'

const roots: string[] = []
afterEach(() => {
  vi.restoreAllMocks()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

/** Mount the full stack over a fresh temp root; the domain is supplied by the caller. */
async function mount(config: Partial<plugin.Config>, provideDomain: (ctx: Context, root: string) => void) {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  const root = mkdtempSync(join(tmpdir(), 'dsh-team-rooms-activation-'))
  roots.push(root)
  await ctx.plugin(JsonlSessionPersistence, { root })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root: join(root, 'storages') })
  provideDomain(ctx, root)
  await ctx.plugin(CommandRuntime)
  await ctx.plugin(plugin, { allowUnmarkedFacts: true, ...config })
  const parent = await ctx.agentLoop.create(SessionId('parent'), { provider: 'mock', model: 'mock' })
  return { ctx, parent }
}

/** The real storage domain: the room half activates and rooms can be created. */
function setupWorking(config: Partial<plugin.Config> = {}) {
  return mount(config, (ctx) => { void ctx.plugin(StorageDomain, { backend: 'json' }) })
}

/** A provider whose open() never settles: any awaited store call would hang. */
function setupStuck() {
  return mount({ roomOpenTimeoutMs: 60_000 }, (ctx) => {
    ctx.provide('storageDomain', { open: () => new Promise<never>(() => {}) } as never)
  })
}

/** Let the listener's microtask and the catch-up chain run. */
async function flush(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) await new Promise(resolve => setTimeout(resolve, 0))
}

/** Create one room through the real `/room create` command and return its id. */
async function createRoom(ctx: Context, agent: unknown, name: string): Promise<string> {
  const execution = await ctx.commands.execute(agent as never, `/room create ${name}`, [], new AbortController().signal)
  const text = execution?.result.kind === 'success' ? execution.result.text : undefined
  const roomId = text?.match(/Room created: (\S+)/u)?.[1]
  if (roomId === undefined) throw new Error(`/room create failed: ${JSON.stringify(execution?.result)}`)
  return roomId
}

describe('agent/created activation listener (A1)', () => {
  it('settles agent creation while the store open never settles', async () => {
    const { ctx, parent } = await setupStuck()
    const outcome = await Promise.race([
      ctx.parallel('agent/created', { agent: parent, source: 'startup' } as never).then(() => 'settled'),
      new Promise(resolve => setTimeout(() => resolve('hung'), 300)),
    ])
    expect(outcome).toBe('settled')
  })

  it('dispatches catch-up once for a member session on resume', async () => {
    const { ctx, parent } = await setupWorking()
    await createRoom(ctx, parent, 'alpha')
    const spy = vi.spyOn(RoomHub.prototype, 'catchUp')
    await ctx.parallel('agent/created', { agent: parent, source: 'resume' } as never)
    await flush()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0]?.[0])).toBe('parent')
  })

  it('dispatches no catch-up for clear and compact sources', async () => {
    const { ctx, parent } = await setupWorking()
    await createRoom(ctx, parent, 'alpha')
    const spy = vi.spyOn(RoomHub.prototype, 'catchUp')
    await ctx.parallel('agent/created', { agent: parent, source: 'clear' } as never)
    await ctx.parallel('agent/created', { agent: parent, source: 'compact' } as never)
    await flush()
    expect(spy).not.toHaveBeenCalled()
  })

  it('dispatches no catch-up for a session that is not a member of any room', async () => {
    const { ctx } = await setupWorking()
    const stranger = await ctx.agentLoop.create(SessionId('stranger'), { provider: 'mock', model: 'mock' })
    const spy = vi.spyOn(RoomHub.prototype, 'catchUp')
    await ctx.parallel('agent/created', { agent: stranger, source: 'startup' } as never)
    await flush()
    expect(spy).not.toHaveBeenCalled()
  })

  it('swallows a rejected catch-up instead of failing agent creation', async () => {
    const { ctx, parent } = await setupWorking()
    await createRoom(ctx, parent, 'alpha')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(RoomHub.prototype, 'catchUp').mockRejectedValue(new Error('store exploded'))
    await expect(ctx.parallel('agent/created', { agent: parent, source: 'startup' } as never)).resolves.toBeUndefined()
    await flush()
    warn.mockRestore()
  })

  it('returns undefined synchronously from an aborted activation signal', async () => {
    const { ctx, parent } = await setupWorking()
    await createRoom(ctx, parent, 'alpha')
    const spy = vi.spyOn(RoomHub.prototype, 'catchUp')
    const controller = new AbortController()
    controller.abort()
    await ctx.parallel('agent/created', { agent: parent, source: 'startup', signal: controller.signal } as never)
    await flush()
    // The listener still returns synchronously; the aborted signal cancels the
    // deferred work before it touches the store.
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('member brief idempotency (P1-2)', () => {
  it('injects the brief once across a join and a later activation catch-up', async () => {
    const { ctx, parent } = await setupWorking()
    const inject = vi.spyOn(parent as unknown as { inject: (message: unknown) => void }, 'inject')
    await createRoom(ctx, parent, 'alpha')
    expect(inject).toHaveBeenCalledTimes(1)
    // A resume activation re-runs the catch-up for the same live session; the
    // brief must not land twice in one conversation.
    await ctx.parallel('agent/created', { agent: parent, source: 'resume' } as never)
    await flush()
    expect(inject).toHaveBeenCalledTimes(1)
    inject.mockRestore()
  })

  it('injects the brief again after the member leaves and re-joins', async () => {
    const { ctx, parent } = await setupWorking()
    const roomId = await createRoom(ctx, parent, 'alpha')
    // A second member exercises the real leave path (an owner leaving the last
    // slot deletes the room instead).
    const peer = await ctx.agentLoop.create(SessionId('peer'), { provider: 'mock', model: 'mock' })
    const inject = vi.spyOn(peer as unknown as { inject: (message: unknown) => void }, 'inject')
    const join = await ctx.commands.execute(peer as never, `/room join ${roomId}`, [], new AbortController().signal)
    expect(join?.result.kind).toBe('success')
    expect(inject).toHaveBeenCalledTimes(1)
    const leave = await ctx.commands.execute(peer as never, `/room leave ${roomId}`, [], new AbortController().signal)
    expect(leave?.result.kind).toBe('success')
    const rejoin = await ctx.commands.execute(peer as never, `/room join ${roomId}`, [], new AbortController().signal)
    expect(rejoin?.result.kind).toBe('success')
    expect(inject).toHaveBeenCalledTimes(2)
    inject.mockRestore()
  })
})
