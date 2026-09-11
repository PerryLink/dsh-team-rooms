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
import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
/** The cordis row name; the mounted graph id and the logger channel share it. */
export declare const name = "team-rooms";
/** Hard service dependencies: the tool registry, the agent registry, and the session store. */
export declare const inject: string[];
/**
 * Lifecycle policy. Every tunable is a validated Config field: thresholds and
 * retentions belong in cordis.yml, never in code. Nothing is required (rooms
 * mount wherever the storage domain is composed); the Schemastery schema
 * materializes the documented defaults from {@link DEFAULTS}, and direct
 * apply() callers keep the same defaults.
 */
export interface Config {
    /** Hard cap on team rooms across the profile. */
    maxRooms?: number;
    /** Hard cap on members per room. */
    maxMembersPerRoom?: number;
    /** Hard cap on rooms one member session may join. */
    maxRoomsPerMember?: number;
    /** Bus messages kept per room (the message retention window). */
    busRetention?: number;
    /** Timeline events kept per room. */
    timelineRetention?: number;
    /** Completed tasks kept per room; older `done` rows are pruned. */
    taskRetention?: number;
    /** Hard cap on one room message's text (rejected above, never truncated). */
    maxMessageChars?: number;
    /** Inject the short room brief into member sessions (join + resume). */
    injectRoomBrief?: boolean;
    /**
     * How long the `team_rooms` storage-domain open may take before every
     * room operation fails loud (`store-unavailable`) instead of hanging.
     */
    roomOpenTimeoutMs?: number;
    /**
     * Force the log-only `team-room/fact` events even on hosts that drop the
     * `ignorable` envelope marker (every released rc line through
     * `0.1.0-rc.8`). Deliberately dangerous: unmarked fact events make
     * sessions unresumable on stricter harness builds. Default `false` — the
     * runtime detects such hosts and skips fact appends (the `teamRoom`
     * projection degrades to an empty fold; the durable store and the
     * model-visible deliveries keep working).
     */
    allowUnmarkedFacts?: boolean;
    /** Cross-ecosystem inbound bridge (P2) policy; absent = disabled. */
    inbound?: InboundConfig;
}
/** Cross-ecosystem inbound bridge (P2) policy. */
export interface InboundConfig {
    /**
     * Enable the newline-delimited JSON-RPC 2.0 stdio inbound bridge that lets
     * external agent runtimes (OpenAI Agents SDK / CrewAI) publish into team
     * rooms. Default `false` (fail-closed — the bridge never spawns unless
     * explicitly enabled).
     */
    enabled?: boolean;
    /**
     * External runtime launch command. When `enabled` and present, the plugin
     * spawns it and listens for notifications on its stdout. Absent or
     * unspawnable = the bridge stays dormant with a logged warning.
     */
    command?: string;
}
/**
 * The single source of truth for every optional policy default: the schema
 * materializes from it and apply() falls back to it, so the two can never
 * drift apart.
 */
export declare const DEFAULTS: {
    readonly maxRooms: 16;
    readonly maxMembersPerRoom: 8;
    readonly maxRoomsPerMember: 4;
    readonly busRetention: 200;
    readonly timelineRetention: 500;
    readonly taskRetention: 50;
    readonly maxMessageChars: 4000;
    readonly injectRoomBrief: true;
    readonly roomOpenTimeoutMs: 15000;
    readonly allowUnmarkedFacts: false;
    readonly inbound: {
        readonly enabled: false;
    };
};
export declare const Config: Schema<Config>;
/**
 * Mount the room hub, the eight `room_*` tools, the `/room` command family,
 * the `teamRoom` projection unit, and the room prompt section.
 * @param ctx - context carrying the tool registry, the agent registry, and the session store.
 * @param config - room policy (Schemastery-validated).
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map