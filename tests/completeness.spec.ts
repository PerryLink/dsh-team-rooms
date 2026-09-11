/**
 * The completeness gate: this package ships Group B and nothing else, so the
 * packaged tree cannot register a `bg_*` tool, cannot name a subagent service,
 * and cannot serve the sidebar surface the background-agent half owned.
 *
 * The assertions run over the **packaged faces** — `lib/index.js`,
 * `lib/client.js`, `package.json`, `cordis.patch.yml` — not over `src/`, so a
 * stray Group-A import that survives the build is caught here even if the
 * source tree looks clean.
 * @module dsh-team-rooms/tests/completeness.spec
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function read(relative: string): string {
  return readFileSync(join(root, relative), 'utf8')
}

/** Every `room_*` name the model must be able to call. */
const ROOM_TOOLS = [
  'room_list_rooms', 'room_post', 'room_read', 'room_list_tasks',
  'room_create_task', 'room_claim_task', 'room_transfer_task', 'room_complete_task',
] as const

/** The Group-A tool names that must be absent from the packaged tree. */
const BG_TOOLS = ['background_agent', 'bg_message', 'bg_list', 'bg_result', 'bg_stop'] as const

describe('completeness — the room half is all that ships', () => {
  it('the host bundle registers all eight room_* tools and no bg_* tool', () => {
    const index = read('lib/index.js')
    for (const tool of ROOM_TOOLS) expect(index, `missing ${tool}`).toContain(tool)
    for (const tool of BG_TOOLS) expect(index, `Group A leaked: ${tool}`).not.toContain(tool)
  })

  it('the host bundle declares no subagent dependency and does not inject `subagents`', async () => {
    const index = await import(`${join(root, 'lib/index.js')}`) as { inject: readonly string[] }
    expect(index.inject).toEqual(['tools', 'agents', 'sessions'])
    expect(index.inject).not.toContain('subagents')
  })

  it('the client bundle serves only the team-rooms settings slot', () => {
    const client = read('lib/client.js')
    expect(client).toContain('settings.section')
    expect(client).toContain('team-rooms')
    // The removed sidebar surface must not survive in the bundle.
    expect(client).not.toContain('sidebar.footer.action')
    expect(client).not.toContain('backgroundAgents')
    expect(client).not.toContain('BackgroundAgentsAction')
  })

  it('package.json names no subagent package and no sidebar/primitives client module', () => {
    const pkg = JSON.parse(read('package.json')) as {
      name: string
      dsh: { client: { inject: string[] } }
      dependencies: Record<string, string>
      peerDependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    expect(pkg.name).toBe('dsh-team-rooms')
    for (const block of [pkg.dependencies, pkg.peerDependencies, pkg.devDependencies]) {
      for (const name of Object.keys(block)) {
        expect(name, `Group A dependency leaked: ${name}`).not.toBe('@deepseek-ai/dsh-subagent')
      }
    }
    expect(pkg.dsh.client.inject).not.toContain('@deepseek-ai/dsh-client-ui-sidebar')
    expect(pkg.dsh.client.inject).not.toContain('@deepseek-ai/dsh-client-ui-primitives')
    // The declared client-inject edge TeamRoomsSection.tsx always needed.
    expect(pkg.dsh.client.inject).toContain('@deepseek-ai/dsh-client-ui-settings')
  })

  it('cordis.patch.yml mounts the room row only, with no `provider` key', () => {
    const patch = read('cordis.patch.yml')
    expect(patch).toContain('name: dsh-team-rooms')
    // A live key sits on its own non-comment line; the header comment may
    // mention the key by name while explaining why it is absent.
    const liveLines = patch.split(/\r?\n/u).filter(line => !line.trimStart().startsWith('#'))
    expect(liveLines.some(line => /^\s*provider:/u.test(line))).toBe(false)
    for (const key of ['maxRooms', 'maxMembersPerRoom', 'roomOpenTimeoutMs']) {
      expect(patch).toContain(key)
    }
    // The storage stack comes from dsh-base; re-inserting it breaks the boot.
    for (const storage of ['@deepseek-ai/dsh-storage', '@deepseek-ai/dsh-storage-json', '@deepseek-ai/dsh-storage-domain']) {
      expect(patch).not.toContain(`name: ${storage}`)
    }
  })

  it('no source file outside tests/ mentions a Group-A symbol', () => {
    const files = [
      'src/index.ts', 'src/facts.ts', 'src/audit.ts', 'src/inbound.ts',
      'src/room/hub.ts', 'src/room/tools.ts', 'src/room/commands.ts',
      'src/room/events.ts', 'src/room/domain.ts', 'src/room/schema.ts', 'src/room/projection.ts',
      'src/client/index.ts', 'src/client/room-presenter.ts', 'src/client/room-locales.ts',
    ]
    for (const file of files) {
      const source = read(file)
      for (const tool of BG_TOOLS) {
        expect(source, `${file} references ${tool}`).not.toContain(tool)
      }
      expect(source, `${file} imports the subagent runtime`).not.toContain('@deepseek-ai/dsh-subagent')
    }
  })
})
