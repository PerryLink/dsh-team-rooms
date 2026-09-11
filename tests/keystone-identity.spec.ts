/**
 * The must-keep gate: build a `team_rooms` storage domain with the
 * `dsh-background-agents` 0.9.6 definitions, then swap in this package and
 * assert the old data is still readable and the `teamRoom` projection still
 * folds it.
 *
 * The fixture is deliberately built from the 0.9.6 **source tree** (imported
 * read-only), exactly the bytes the 0.9.6 release was built from, not from
 * this repository's copies. Three things are proved here:
 *
 * 1. **Domain identity** — the storage domain name, version, and table set
 *    this package opens are identical to 0.9.6, so a real SQLite/JSONL profile
 *    keeps its rooms, bus, tasks, and cursors.
 * 2. **Behavioural identity** — `/room list` and `room_list_rooms` serve the
 *    rooms 0.9.6 wrote when this package mounts over the same storage root.
 * 3. **Fold identity** — the `teamRoom` projection produces the *same value*
 *    as the 0.9.6 fold from a raw `team-room/fact` log.
 *
 * If this suite needs editing to pass, a keystone string moved and every
 * existing user profile silently loses its rooms. See `README.md` →
 * *Compatibility* and `ARCHITECTURE.md` → *Frozen identity*.
 * @module dsh-team-rooms/tests/keystone-identity.spec
 */

import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import { SessionId, type SessionEvent } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'

import * as plugin from '../src/index.ts'
import { factEventPolicyForVersion, peerSessionVersion } from '../src/audit.ts'
import { teamRoomsDomainSpec } from '../src/room/domain.ts'
import { teamRoomProjectionDefinition } from '../src/room/projection.ts'
import { TEAM_ROOM_FACT } from '../src/room/events.ts'
import type { TeamRoomFact } from '../src/room/events.ts'
import type { BusMessage, RoomRecord, TaskRecord, TimelineEvent } from '../src/room/schema.ts'

// ── the 0.9.6 fixture source (read-only, never written) ──────────────────────
const OLD_ROOT = 'D:/Projects/dsh/plugins/dsh-background-agents'
const oldDomain = await import(`${OLD_ROOT}/src/room/domain.ts`) as {
  teamRoomsDomainSpec: typeof teamRoomsDomainSpec
}
const oldProjection = await import(`${OLD_ROOT}/src/room/projection.ts`) as {
  teamRoomProjectionDefinition: typeof teamRoomProjectionDefinition
}

const MEMBER = 'member-1'
const ROOM_ID = 'room-legacy'
/** Timestamp base so the fixture is deterministic. */
const T0 = 1_700_000_000_000

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
})

/** A room record exactly as the 0.9.6 hub wrote one. */
function legacyRoom(): RoomRecord {
  return {
    roomId: ROOM_ID,
    name: 'legacy ops room',
    createdAt: T0,
    members: [{ sessionId: MEMBER, role: 'owner', joinedAt: T0, lastDeliveredSeq: 1, lastFactSeq: 2 }],
    busNext: 2,
    timelineNext: 3,
  }
}

const legacyBus: BusMessage[] = [
  { roomId: ROOM_ID, seq: 0, senderSessionId: MEMBER, text: 'kickoff', createdAt: T0 + 1 },
]

const legacyTasks: TaskRecord[] = [
  {
    roomId: ROOM_ID, taskId: 'task-legacy', title: 'draft the migration note', description: '',
    status: 'todo', assigneeSessionId: null, createdBy: MEMBER, createdAt: T0 + 2, updatedAt: T0 + 2,
  },
]

const legacyTimeline: TimelineEvent[] = [
  { roomId: ROOM_ID, seq: 0, kind: 'room-created', at: T0, data: { sessionId: MEMBER } },
  { roomId: ROOM_ID, seq: 1, kind: 'message-posted', at: T0 + 1, data: { seq: 0, senderSessionId: MEMBER, text: 'kickoff' } },
  { roomId: ROOM_ID, seq: 2, kind: 'task-created', at: T0 + 2, data: { taskId: 'task-legacy', title: 'draft the migration note' } },
]

/** The exact `team-room/fact` records the 0.9.6 hub appended to the member log. */
const legacyFacts: TeamRoomFact[] = [
  {
    kind: 'room-joined', roomId: ROOM_ID, name: 'legacy ops room', createdAt: T0,
    members: [{ sessionId: MEMBER, role: 'owner', joinedAt: T0, lastDeliveredSeq: 1, lastFactSeq: 2 }],
    tasks: legacyTasks,
    timeline: legacyTimeline,
  },
  { kind: 'message-posted', roomId: ROOM_ID, seq: 0, timelineSeq: 1, senderSessionId: MEMBER, text: 'kickoff', createdAt: T0 + 1 },
  {
    kind: 'task-created', roomId: ROOM_ID, taskId: 'task-legacy', title: 'draft the migration note',
    description: '', assigneeSessionId: null, createdBy: MEMBER, createdAt: T0 + 2, timelineSeq: 2,
  },
]

/** The fixture facts wrapped exactly as the harness stores them. */
function legacyEvents(): SessionEvent[] {
  return legacyFacts.map((data, index) => ({
    type: TEAM_ROOM_FACT, seq: index + 1, time: T0 + index, data,
  })) as unknown as SessionEvent[]
}

/** Mount the persistence + storage stack under one root. */
async function mountStack(root: string): Promise<Context> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(JsonlSessionPersistence, { root })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root: join(root, 'storages') })
  await ctx.plugin(StorageDomain, { backend: 'json' })
  return ctx
}

/**
 * Seed the `team_rooms` domain through the 0.9.6 spec and close it again.
 * `lastFactSeq` is seeded at `-1` so the member log holds NO room facts yet:
 * the timeline 0.9.6 wrote is replayed by this package's catch-up, which is
 * what the last case asserts.
 */
async function seedLegacyDomain(root: string): Promise<void> {
  const ctx = await mountStack(root)
  try {
    const domain = await ctx.storageDomain.open(oldDomain.teamRoomsDomainSpec)
    await domain.table('rooms').put(ROOM_ID, { ...legacyRoom(), members: [{ sessionId: MEMBER, role: 'owner', joinedAt: T0, lastDeliveredSeq: 0, lastFactSeq: -1 }] })
    for (const message of legacyBus) await domain.table('bus').put(`${ROOM_ID}/${message.seq}`, message)
    for (const task of legacyTasks) await domain.table('tasks').put(`${ROOM_ID}/${task.taskId}`, task)
    for (const event of legacyTimeline) await domain.table('timeline').put(`${ROOM_ID}/${event.seq}`, event)
    await domain.close()
  } finally {
    await ctx.fiber.dispose()
  }
}

describe('keystone identity — the four strings that may never move', () => {
  it('opens the same storage domain name, version, and tables as dsh-background-agents 0.9.6', () => {
    expect(teamRoomsDomainSpec.name).toBe('team_rooms')
    expect(teamRoomsDomainSpec.version).toBe(1)
    expect(oldDomain.teamRoomsDomainSpec.name).toBe(teamRoomsDomainSpec.name)
    expect(oldDomain.teamRoomsDomainSpec.version).toBe(teamRoomsDomainSpec.version)
    expect(Object.keys(oldDomain.teamRoomsDomainSpec.tables).sort())
      .toEqual(Object.keys(teamRoomsDomainSpec.tables).sort())
  })

  it('keeps the projection key `teamRoom`, its stateVersion, and the event type `team-room/fact`', () => {
    expect(teamRoomProjectionDefinition.key).toBe('teamRoom')
    expect(oldProjection.teamRoomProjectionDefinition.key).toBe('teamRoom')
    expect(teamRoomProjectionDefinition.stateVersion).toBe(1)
    expect(TEAM_ROOM_FACT).toBe('team-room/fact')
  })

  it('keeps the client settings-slot id `team-rooms` byte-identical', () => {
    const source = readFileSync(new URL('../src/client/index.ts', import.meta.url), 'utf8')
    expect(source).toContain("id: 'team-rooms'")
  })
})

describe('must-keep — a 0.9.6 profile survives the swap', () => {
  it('/room list still returns the room 0.9.6 wrote, through this package', async () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-team-rooms-keystone-'))
    roots.push(root)
    await seedLegacyDomain(root)

    // A fresh context over the SAME storage root: this is the swap.
    const ctx = await mountStack(root)
    try {
      await ctx.plugin(CommandRuntime)
      await ctx.plugin(plugin, { allowUnmarkedFacts: true })
      const member = await ctx.agentLoop.create(SessionId(MEMBER), { provider: 'mock', model: 'mock' })

      const execution = await ctx.commands.execute(member as never, '/room list', [], new AbortController().signal)
      expect(execution?.result.kind).toBe('success')
      const text = String((execution?.result as { text?: string } | undefined)?.text ?? '')
      expect(text).toContain(ROOM_ID)
      expect(text).toContain('legacy ops room')
      expect(text).toContain('1 members (you: owner)')
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('room_list_rooms serves the old room with its roster and board intact', async () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-team-rooms-keystone-tools-'))
    roots.push(root)
    await seedLegacyDomain(root)

    const ctx = await mountStack(root)
    try {
      await ctx.plugin(CommandRuntime)
      await ctx.plugin(plugin, { allowUnmarkedFacts: true })
      const member = await ctx.agentLoop.create(SessionId(MEMBER), { provider: 'mock', model: 'mock' })

      const result = await ctx.tools.execute({
        signal: new AbortController().signal,
        callId: 'keystone-1' as never,
        name: 'room_list_rooms',
        arguments: {},
        agent: member as never,
      })
      expect(result.isError).toBe(false)
      const value = result.value as {
        rooms: Array<{ roomId: string; name: string; memberCount: number; openTasks: number; myRole: string }>
      }
      expect(value.rooms).toHaveLength(1)
      expect(value.rooms[0]).toMatchObject({
        roomId: ROOM_ID, name: 'legacy ops room', memberCount: 1, openTasks: 1, myRole: 'owner',
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('the teamRoom fold recovers the identical value the 0.9.6 fold produced', () => {
    const events = legacyEvents()
    const oldUnit = oldProjection.teamRoomProjectionDefinition
    const oldValue = oldUnit.wire.view(
      events.reduce((state, event) => oldUnit.apply(state, event as never), oldUnit.init()),
    )
    const newValue = teamRoomProjectionDefinition.wire.view(
      events.reduce((state, event) => teamRoomProjectionDefinition.apply(state, event as never), teamRoomProjectionDefinition.init()),
    )

    expect(newValue).toEqual(oldValue)
    expect(newValue.rooms[0]).toMatchObject({
      roomId: ROOM_ID, name: 'legacy ops room',
      members: [{ sessionId: MEMBER, role: 'owner', joinedAt: T0 }],
    })
    expect(newValue.rooms[0]!.tasks.map(task => task.taskId)).toEqual(['task-legacy'])
    expect(newValue.rooms[0]!.timeline.map(entry => entry.seq)).toEqual([0, 1, 2])
  })

  it('catch-up replays the 0.9.6 timeline as this package\'s frozen fact type', async () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-team-rooms-keystone-catchup-'))
    roots.push(root)
    await seedLegacyDomain(root)

    const ctx = await mountStack(root)
    try {
      await ctx.plugin(CommandRuntime)
      await ctx.plugin(plugin, { allowUnmarkedFacts: true })
      const member = await ctx.agentLoop.create(SessionId(MEMBER), { provider: 'mock', model: 'mock' })
      const hub = (ctx as unknown as { roomHub?: { catchUp: (id: SessionId) => Promise<void> } }).roomHub
      if (hub === undefined) throw new Error('roomHub service is not mounted')
      await hub.catchUp(SessionId(MEMBER))

      const written = member.session.snapshotEvents().filter(event => event.type === TEAM_ROOM_FACT)
      // The peer line decides whether a log-only fact may be appended at all
      // (see src/facts.ts); on either line the EVENT TYPE is the frozen one,
      // and a writing host must produce the whole three-event backlog in
      // store order.
      const policy = peerSessionVersion() === null ? 'unknown' : factEventPolicyForVersion(peerSessionVersion()!)
      if (policy === 'forbidden') {
        expect(written).toHaveLength(0)
      } else {
        expect(written).toHaveLength(legacyTimeline.length)
        expect(written.map(event => (event.data as { kind: string }).kind))
          .toEqual(['room-created', 'message-posted', 'task-created'])
      }

      // Independently of the host gate, the full 0.9.6 log (snapshot +
      // timeline) folds to the same value through both definitions — this is
      // the value the settings page renders after the swap.
      const replayed = legacyEvents()
      expect(teamRoomProjectionDefinition.wire.view(
        replayed.reduce((state, event) => teamRoomProjectionDefinition.apply(state, event), teamRoomProjectionDefinition.init()),
      )).toEqual(oldProjection.teamRoomProjectionDefinition.wire.view(
        replayed.reduce((state, event) => oldProjection.teamRoomProjectionDefinition.apply(state, event as never), oldProjection.teamRoomProjectionDefinition.init()),
      ))
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
