/**
 * dsh-team-rooms: persistent, cross-session team rooms for DeepSeek Harness.
 *
 * A room is `{members (each an independent session), message bus
 * (directed/broadcast), task board, shared timeline}` persisted in the
 * harness's own storage layer — the `team_rooms` storage domain (SQLite or
 * JSONL backend; the deployment chooses, the plugin adds no service of its
 * own) — and it recovers across DSH restarts. The `/room` command family
 * drives rooms from the user; the model gets eight `room_*` tools;
 * cross-member task handoffs route through the official approval seam; and
 * member sessions receive a one-line role-statement brief (Minimal persona
 * style) on join and resume.
 *
 * Model-visible ⟺ recorded: every delivered room message is a durable
 * `user/message` in the member's own session log, and the shared timeline
 * mirrors as log-only `team-room/fact` events folded by the `teamRoom`
 * projection the settings panel renders. The storage domain stays the
 * cross-session authority; the projection is each member's own reconstructed
 * copy.
 *
 * Extracted verbatim from `dsh-background-agents` 0.9.6, whose background-agent
 * half is superseded by native DSH continuable subagents. Three identity
 * strings must stay byte-identical to that version so existing profiles keep
 * working: the storage domain `team_rooms`, the projection key `teamRoom`,
 * and the session event type `team-room/fact` (plus the client slot id
 * `team-rooms`).
 *
 * This half never touches `ctx.subagents`: no room operation spawns or steers
 * a child agent, so the package carries no subagent dependency at all.
 *
 * @module dsh-team-rooms
 */

import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { SessionId } from '@deepseek-ai/dsh-session'
import { FactAppender } from './facts.ts'
import { deliveriesFor, InboundCoordinator, StdioJsonRpcInbound } from './inbound.ts'
import type { InboundLogger, InboundSink } from './inbound.ts'
import { RoomHub } from './room/hub.ts'
import type { RoomConfig } from './room/hub.ts'
import { registerRoomCommand } from './room/commands.ts'
import { registerRoomTools } from './room/tools.ts'
import { teamRoomProjectionDefinition } from './room/projection.ts'

/** The cordis row name; the mounted graph id and the logger channel share it. */
export const name = 'team-rooms'

// Consumer — this plugin consumes the tool registry, the agent registry, and
// the session store (declared in `inject`), plus optional services
// (storageDomain, sessionProjections, systemPrompt, approval) via ctx.inject/get.
/** Hard service dependencies: the tool registry, the agent registry, and the session store. */
export const inject = ['tools', 'agents', 'sessions']

/**
 * Lifecycle policy. Every tunable is a validated Config field: thresholds and
 * retentions belong in cordis.yml, never in code. Nothing is required (rooms
 * mount wherever the storage domain is composed); the Schemastery schema
 * materializes the documented defaults from {@link DEFAULTS}, and direct
 * apply() callers keep the same defaults.
 */
// Service Definition — the plugin's public contract: the Config interface and the
// Schemastery schema below declare the entire tunable surface.
export interface Config {
  /** Hard cap on team rooms across the profile. */
  maxRooms?: number
  /** Hard cap on members per room. */
  maxMembersPerRoom?: number
  /** Hard cap on rooms one member session may join. */
  maxRoomsPerMember?: number
  /** Bus messages kept per room (the message retention window). */
  busRetention?: number
  /** Timeline events kept per room. */
  timelineRetention?: number
  /** Completed tasks kept per room; older `done` rows are pruned. */
  taskRetention?: number
  /** Hard cap on one room message's text (rejected above, never truncated). */
  maxMessageChars?: number
  /** Inject the short room brief into member sessions (join + resume). */
  injectRoomBrief?: boolean
  /**
   * How long the `team_rooms` storage-domain open may take before every
   * room operation fails loud (`store-unavailable`) instead of hanging.
   */
  roomOpenTimeoutMs?: number
  /**
   * Force the log-only `team-room/fact` events even on hosts that drop the
   * `ignorable` envelope marker (every released rc line through
   * `0.1.0-rc.8`). Deliberately dangerous: unmarked fact events make
   * sessions unresumable on stricter harness builds. Default `false` — the
   * runtime detects such hosts and skips fact appends (the `teamRoom`
   * projection degrades to an empty fold; the durable store and the
   * model-visible deliveries keep working).
   */
  allowUnmarkedFacts?: boolean
  /** Cross-ecosystem inbound bridge (P2) policy; absent = disabled. */
  inbound?: InboundConfig
}

/** Cross-ecosystem inbound bridge (P2) policy. */
export interface InboundConfig {
  /**
   * Enable the newline-delimited JSON-RPC 2.0 stdio inbound bridge that lets
   * external agent runtimes (OpenAI Agents SDK / CrewAI) publish into team
   * rooms. Default `false` (fail-closed — the bridge never spawns unless
   * explicitly enabled).
   */
  enabled?: boolean
  /**
   * External runtime launch command. When `enabled` and present, the plugin
   * spawns it and listens for notifications on its stdout. Absent or
   * unspawnable = the bridge stays dormant with a logged warning.
   */
  command?: string
}

/**
 * The single source of truth for every optional policy default: the schema
 * materializes from it and apply() falls back to it, so the two can never
 * drift apart.
 */
export const DEFAULTS = {
  maxRooms: 16,
  maxMembersPerRoom: 8,
  maxRoomsPerMember: 4,
  busRetention: 200,
  timelineRetention: 500,
  taskRetention: 50,
  maxMessageChars: 4_000,
  injectRoomBrief: true,
  roomOpenTimeoutMs: 15_000,
  allowUnmarkedFacts: false,
  inbound: { enabled: false },
} as const

export const Config: Schema<Config> = Schema.object({
  maxRooms: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxRooms),
  maxMembersPerRoom: Schema.natural().min(2).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxMembersPerRoom),
  maxRoomsPerMember: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxRoomsPerMember),
  // 0 retention would erase every message as it lands; the schema forbids it.
  busRetention: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.busRetention),
  timelineRetention: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.timelineRetention),
  taskRetention: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.taskRetention),
  maxMessageChars: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxMessageChars),
  injectRoomBrief: Schema.boolean().default(DEFAULTS.injectRoomBrief),
  roomOpenTimeoutMs: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.roomOpenTimeoutMs),
  allowUnmarkedFacts: Schema.boolean().default(DEFAULTS.allowUnmarkedFacts),
  inbound: Schema.object({
    enabled: Schema.boolean().default(DEFAULTS.inbound.enabled),
    command: Schema.string(),
  }),
})

/**
 * Mount the room hub, the eight `room_*` tools, the `/room` command family,
 * the `teamRoom` projection unit, and the room prompt section.
 * @param ctx - context carrying the tool registry, the agent registry, and the session store.
 * @param config - room policy (Schemastery-validated).
 */
export function apply(ctx: Context, config: Config): void {
  // Service Provider — everything mounted below registers into ctx: the eight
  // room_* tools, the /room command, the teamRoom session projection, the prompt
  // section, and the optional stdio inbound bridge.
  // Read one declared service up front so a mount without the inject set (or
  // through a wrapper that drops `inject`, e.g. a default export) fails with
  // Cordis's missing-inject reason instead of a bare property error.
  const agents = ctx.agents
  // Direct apply() bypasses Schemastery's constraints; every loader-omitted
  // field keeps its documented default from the shared DEFAULTS constant.
  const roomPolicy: RoomConfig = {
    maxRooms: config.maxRooms ?? DEFAULTS.maxRooms,
    maxMembersPerRoom: config.maxMembersPerRoom ?? DEFAULTS.maxMembersPerRoom,
    maxRoomsPerMember: config.maxRoomsPerMember ?? DEFAULTS.maxRoomsPerMember,
    busRetention: config.busRetention ?? DEFAULTS.busRetention,
    timelineRetention: config.timelineRetention ?? DEFAULTS.timelineRetention,
    taskRetention: config.taskRetention ?? DEFAULTS.taskRetention,
    maxMessageChars: config.maxMessageChars ?? DEFAULTS.maxMessageChars,
    injectRoomBrief: config.injectRoomBrief ?? DEFAULTS.injectRoomBrief,
    roomOpenTimeoutMs: config.roomOpenTimeoutMs ?? DEFAULTS.roomOpenTimeoutMs,
  }

  // One host-gated appender for the `team-room/fact` channel: on hosts whose
  // Session.append drops the ignorable marker (the rc.8 line) fact appends
  // are skipped so session logs stay loadable everywhere (see facts.ts).
  const facts = new FactAppender(
    config.allowUnmarkedFacts ?? DEFAULTS.allowUnmarkedFacts,
    message => ctx.logger('team-rooms').warn(message),
    type => ctx.logger('team-rooms').info('fact %s recorded (log-only fact events are disabled on this host)', type),
  )

  // Team rooms mount only where the storage domain exists (the same optional
  // seam as sessionProjections): the plugin loads everywhere, but without the
  // durable store the /room command and the room_* tools stay dormant. The hub
  // opens the `team_rooms` storage domain (the domain's single write chain is
  // the ordering authority) and closes it with this fiber; an open failure
  // fails every room operation loud at its first call.
  if (ctx.get('storageDomain') === undefined) {
    ctx.logger('team-rooms').info('team rooms disabled: no storage domain composed (add @deepseek-ai/dsh-storage-domain to enable the /room command and the room_* tools)')
    if (config.inbound?.enabled) {
      ctx.logger('team-rooms').warn('cross-ecosystem inbound disabled: enabled but no storage domain composed (team rooms are required)')
    }
  }
  ctx.inject(['storageDomain'], (roomCtx) => {
    const hub = new RoomHub(roomCtx, roomPolicy, agents, roomCtx.sessions, facts)
    void hub.open().catch((error: unknown) => {
      roomCtx.logger('team-rooms').error(`team room store failed to open: ${String(error)}`)
    })
    registerRoomTools(roomCtx, hub)
    roomCtx.effect(() => registerRoomCommand(roomCtx, hub) ?? (() => {}), 'dsh-team-rooms: /room command')

    // Offline catch-up: whenever a member session starts (fresh or resume),
    // replay the facts and bus messages it missed, in store order.
    roomCtx.on('agent/created', async ({ agent }) => {
      await hub.catchUp(agent.id).catch((error: unknown) => {
        roomCtx.logger('team-rooms').warn(`room catch-up failed for ${agent.id}: ${String(error)}`)
      })
    })

    // Cross-ecosystem inbound (P2): spawn the external runtime and map its
    // notifications onto the room's bus/board. Gated by inbound.enabled and
    // mounted only where the room hub exists; start/stop ride the disposer.
    if (config.inbound?.enabled) {
      const command = config.inbound.command?.trim()
      if (command === undefined || command === '') {
        roomCtx.logger('team-rooms').warn('inbound.enabled is true but inbound.command is empty; the stdio bridge stays dormant')
      } else {
        const coordinator = new InboundCoordinator()
        const logger = roomCtx.logger('team-rooms')
        roomCtx.effect(() => coordinator.registerInboundAdapter(
          new StdioJsonRpcInbound(command, logger),
          inboundRoomSink(hub, logger),
        ), 'dsh-team-rooms: stdio JSON-RPC inbound bridge')
      }
    }
  })

  // The projection unit mounts only where the registry exists, so headless
  // assemblies without session projections still load the tools.
  ctx.inject(['sessionProjections'], (projectionCtx) => {
    projectionCtx.sessionProjections.register(teamRoomProjectionDefinition)
  })

  // Cross-call guidance so the model treats room deliveries as push, not pull.
  ctx.inject(['systemPrompt'], (promptCtx) => {
    // order 108 is the slot this section occupied inside dsh-background-agents,
    // so prompt ordering is unchanged for profiles that still mount both rows.
    promptCtx.systemPrompt.section({
      name: 'tool:team-rooms',
      order: 108,
      text:
        'When this session is a member of a team room, room messages are delivered into this conversation '
        + 'automatically — do not busy-poll room_read. Keep room turns brief: room_post sends messages, '
        + 'room_list_tasks/room_claim_task work the shared board, and room_transfer_task asks approval before '
        + 'handing a task to another member.',
    })
  })
}

/**
 * The room half of the inbound bridge: execute {@link deliveriesFor} against
 * the team room's task board and message bus. External runtimes are not DSH
 * sessions, so the room owner's member session stands in as the sender; a
 * room with no owner member drops the event (fail-closed). The `traceId →
 * taskId` map lets `agent_finished` close the card `agent_started` opened.
 * @param hub - the room service owning the durable state.
 * @param logger - where bridge rejection lines are logged.
 * @returns the sink the stdio adapter emits normalized events into.
 */
function inboundRoomSink(hub: RoomHub, logger: InboundLogger): InboundSink {
  const openTasks = new Map<string, string>()
  return async (event) => {
    const sender = await ownerSessionOf(hub, event.roomId)
    if (sender === undefined) {
      logger.warn(`inbound: room ${event.roomId} has no owner member; dropped ${event.method} (fail-closed)`)
      return
    }
    try {
      for (const delivery of deliveriesFor(event)) {
        switch (delivery.kind) {
          case 'task-open': {
            const task = await hub.createTask({ roomId: delivery.roomId, bySessionId: sender, title: delivery.title })
            openTasks.set(delivery.traceId, task.taskId)
            break
          }
          case 'bus-post':
            await hub.postMessage({ roomId: delivery.roomId, senderSessionId: sender, text: delivery.text })
            break
          case 'task-close': {
            const taskId = openTasks.get(delivery.traceId)
            if (taskId !== undefined) {
              await hub.completeTask({ roomId: delivery.roomId, bySessionId: sender, taskId })
              openTasks.delete(delivery.traceId)
            }
            break
          }
        }
      }
    } catch (error) {
      logger.warn(`inbound: delivery for ${event.method} failed: ${String(error)}`)
    }
  }
}

/** Resolve the room's owner member session id (the bridge sender), or undefined. */
async function ownerSessionOf(hub: RoomHub, roomId: string): Promise<SessionId | undefined> {
  const room = await hub.room(roomId)
  const owner = room?.members.find(member => member.role === 'owner')
  return owner === undefined ? undefined : SessionId(owner.sessionId)
}
