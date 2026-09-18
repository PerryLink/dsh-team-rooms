/**
 * dsh-team-rooms, browser half: the Team Rooms `settings.section` page.
 * Member status, the shared task board, and the timeline of every room the
 * current session belongs to, read from the current session's `teamRoom`
 * projection (live `faceOf` snapshots) and written back through the HOST
 * `/room` command (`remote.commands.execute`) so every action keeps the
 * durable command lifecycle. Zero custom RPC: the page rides the sanctioned
 * plugin channels only.
 *
 * Extracted from the single client entry of `dsh-background-agents` 0.9.6,
 * which served two slots from one bundle (`sidebar.footer.action`
 * id `background-agents` for the background-agent panel, and this
 * `settings.section` id `team-rooms`). Only the room half is shipped here;
 * the slot id stays byte-identical so an installed settings page keeps
 * resolving to this plugin.
 *
 * The client half reads no subagent surface at all: it needs `sessions`
 * (list + bindings), `slots`, `locale`, and the remote command executor.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId } from '@deepseek-ai/dsh-client-connection/client'
import type { ISessions } from '@deepseek-ai/dsh-api-session-controller/client'
import {
  TeamRoomsSection, type TeamRoomsInjected,
} from './TeamRoomsSection.tsx'
import {
  buildRoomPanels, currentSessionIdOf, emptyTeamRoomsState, type SessionListLike, type TeamRoomsState,
} from './room-presenter.ts'
import { en as roomEn, zh as roomZh, ROOM_NS, type TeamRoomsKey } from './room-locales.ts'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Team-room settings panel copy. */
    teamRooms: TeamRoomsKey
  }
}

export type {
  TeamRoomsInjected, TeamRoomsSectionProps,
} from './TeamRoomsSection.tsx'

/**
 * Required services: sessions (list + bindings), slots, locale, the wire
 * client, and the remote command executor (`remote.commands`, which carries
 * every `/room` line this page issues). `connection` is deliberately absent —
 * the room page never calls a remote namespace directly.
 */
export const inject = ['sessions', 'slots', 'locale', 'remote', 'remote.commands']

/**
 * Minimal structural contract of an observable snapshot. Declared locally
 * because the owner package of `ISessions` no longer re-exports the
 * generic; the runtime contract is structural.
 */
interface ObservableSnapshot<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/**
 * Live team-room controller: derives the settings-panel state from the
 * current session's `teamRoom` projection (via the binding's `faceOf`
 * observable) overlaid with the session-list live bits. Re-subscribes when
 * the current session changes.
 */
class TeamRoomsController implements ObservableSnapshot<TeamRoomsState> {
  private state: TeamRoomsState = emptyTeamRoomsState()
  private readonly listeners = new Set<() => void>()
  private stopList: (() => void) | undefined
  private stopFace: (() => void) | undefined
  private boundSessionId: string | undefined

  constructor(private readonly sessions: ISessions) {}

  getSnapshot(): TeamRoomsState {
    return this.state
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Attach the subscriptions; returns the disposer (owned by the caller's effect). */
  start(): () => void {
    this.stopList = this.sessions.list.subscribe(() => { this.refresh() })
    this.refresh()
    return () => {
      this.stopList?.()
      this.stopFace?.()
    }
  }

  /** The current session id, for command execution. */
  currentSessionId(): string | undefined {
    return this.state.sessionId
  }

  private set(next: TeamRoomsState): void {
    this.state = next
    for (const listener of [...this.listeners]) listener()
  }

  private refresh(): void {
    // `SessionListState.current` was removed on the 0.1.6 line; the current
    // conversation is the session the main view retains (the upstream
    // ui-session derivation). Guard: no retained session ⇒ the panel keeps its
    // explicit "no active session" state instead of an empty room list.
    const list = this.sessions.list.getSnapshot() as unknown as SessionListLike
    const current = currentSessionIdOf(list)
    // Re-bind the projection face when the current session changes.
    if (current !== this.boundSessionId) {
      this.stopFace?.()
      this.stopFace = undefined
      this.boundSessionId = current
      if (current !== undefined) {
        const face = this.sessions.binding(current as SessionId)?.session.projections.faceOf('teamRoom')
        if (face !== undefined) {
          this.stopFace = face.subscribe(() => { this.refresh() })
        }
      }
    }
    if (current === undefined) {
      this.set(emptyTeamRoomsState())
      return
    }
    const face = this.sessions.binding(current as SessionId)?.session.projections.faceOf('teamRoom')
    const panels = face === undefined
      ? undefined
      : buildRoomPanels(face.getSnapshot() as Parameters<typeof buildRoomPanels>[0], list)
    this.set({ status: 'ready', sessionId: current, rooms: panels ?? [] })
  }
}

/**
 * The structural shape of the api-remotes `commands` Remote namespace the
 * team-room panel needs. Declared locally because the ambient namespace
 * merge onto the client remote is assembled from several generated
 * modules and can resolve to a different physical copy under strict
 * package managers — the runtime contract is what this client depends on.
 */
interface CommandsRemote {
  readonly execute: (
    agent: SessionId,
    line: string,
    images?: readonly { mediaType: string; data: string; name?: string }[],
    signal?: AbortSignal,
  ) => Promise<
    | { ok: false; error: { code: string; message: string } }
    | { ok: true; value?: { commandId: string; result: { kind: string; text: string } } }
  >
}

/**
 * Register the Team Rooms settings page.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(ROOM_NS, { zh: roomZh, en: roomEn }), 'dsh-team-rooms: room dictionaries')
  // The client sessions face is the runtime's ISessions; the host merge can
  // shadow it in mixed programs, so the cast reads the runtime contract.
  const sessions = ctx.get('sessions') as ISessions
  const remote = ctx.remote as unknown as { commands: CommandsRemote }
  // The owning package declares the slots service with a different arity;
  // read it through this structural contract instead.
  const slots = ctx.get('slots') as unknown as {
    inject(slot: string, callback: () => unknown): void
    register(options: unknown, component: unknown): unknown
  }

  const controller = new TeamRoomsController(sessions)
  ctx.effect(() => controller.start(), 'dsh-team-rooms: team rooms store')

  /** Execute one `/room` line against the current session; undefined on success. */
  const executeRoom = async (line: string): Promise<string | undefined> => {
    const sessionId = controller.currentSessionId()
    if (sessionId === undefined) return 'no active session'
    try {
      const result = await remote.commands.execute(sessionId as SessionId, line, [])
      if (!result.ok) return `${result.error.code}: ${result.error.message}`
      if (result.value === undefined || result.value.result === undefined) return `unknown or malformed command: ${line}`
      return result.value.result.kind === 'error' ? result.value.result.text : undefined
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  const injected = (): TeamRoomsInjected => ({
    hooks: { teamRooms: controller },
    getSessionId: () => controller.currentSessionId(),
    create: name => executeRoom(`/room create ${name}`),
    join: roomId => executeRoom(`/room join ${roomId}`),
    leave: roomId => executeRoom(`/room leave ${roomId}`),
    post: (roomId, text) => executeRoom(`/room send ${roomId} ${text}`),
    addTask: (roomId, title) => executeRoom(`/room task add ${roomId} ${title}`),
    claimTask: (roomId, taskId) => executeRoom(`/room task claim ${roomId} ${taskId}`),
    completeTask: (roomId, taskId) => executeRoom(`/room task done ${roomId} ${taskId}`),
    assignTask: (roomId, taskId, member) => executeRoom(`/room task assign ${roomId} ${taskId} ${member}`),
  })

  slots.inject('settings.section', () => slots.register({
    name: 'settings.section',
    // D3 keystone: the slot id must stay byte-identical to the id
    // dsh-background-agents 0.9.6 registered, or an installed settings page
    // stops resolving.
    id: 'team-rooms',
    // After Models/Agent Presets: rooms are a collaboration surface, not a
    // deployment-shaping one.
    order: 30,
    label: () => ctx.locale.bind(ROOM_NS)('nav'),
    locale: ROOM_NS,
    inject: injected,
  }, TeamRoomsSection))
}
