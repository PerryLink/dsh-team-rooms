/**
 * The single append seam for the log-only `team-room/fact` event that carries
 * the shared room timeline into every member session.
 *
 * Two host lines gate the appender:
 * - rc lines through `0.1.1-rc.2`: `Session.append` predates the
 *   `ignorable` envelope marker, so a fact event lands unmarked and
 *   stricter harness builds refuse to resume the session. The appender
 *   detects such hosts before the first append and disables fact appends
 *   with a one-time warning.
 * - `0.1.2-alpha.1` and later: the host fails closed on the session event
 *   vocabulary - `team-room/fact` is not in KNOWN_SESSION_EVENT_TYPES, so
 *   writing one makes the session unreadable there. On those hosts fact
 *   events are never appended; each fact is routed to the injected fallback
 *   sink (logger/panel channel) instead.
 * `allowUnmarkedFacts: true` opts back into unmarked appends - deliberately
 * dangerous - and already-polluted logs can be repaired with
 * `scripts/repair-session-logs.mjs` from `dsh-permission-rules`.
 *
 * Copied from `dsh-background-agents` 0.9.6 with exactly two changes: the
 * header docstring names only the room fact channel, and {@link FactEventType}
 * is narrowed to `'team-room/fact'`. The host gating itself is unchanged, so a
 * profile holding `team_rooms` facts written by 0.9.6 replays them here
 * identically. (The source carried five mojibake sequences - U+9205 where an
 * em dash was intended - which are written as plain hyphens here.)
 * @module dsh-team-rooms/facts
 */
import type { Session } from '@deepseek-ai/dsh-session';
/** The log-only fact event type this appender owns. */
export type FactEventType = 'team-room/fact';
/**
 * Host-gated fact appender. One instance per plugin mount, shared by the
 * room hub and the room tools.
 */
export declare class FactAppender {
    private readonly allowUnmarked;
    private readonly warn;
    private readonly fallback?;
    private support;
    private policy;
    private warned;
    private warnedForbidden;
    constructor(allowUnmarked: boolean, warn: (message: string) => void, fallback?: ((type: FactEventType, data: unknown) => void) | undefined);
    /**
     * Append one log-only fact, requesting the envelope's `ignorable: true`
     * marker. On hosts whose event vocabulary forbids the fact events
     * (`0.1.2-alpha.1+`) the record is routed to the fallback sink instead
     * of the session log; on pre-marker rc hosts (and after a failed probe)
     * the append is skipped so the session log stays loadable everywhere. On 0.1.2-alpha.3 the envelope field is retained for stored-log read compatibility only - its Session.append still cannot stamp the marker, so the gate behavior is unchanged.
     * Append failures are contained: a fact hiccup never disturbs the
     * caller's operation.
     * @param session - the session whose log carries the fact.
     * @param type - the fact event type.
     * @param data - the fact payload.
     */
    append(session: Session, type: FactEventType, data: unknown): void;
    /** Whether the host's event vocabulary still accepts the log-only fact events; the pre-check runs once. */
    private factEventsAllowed;
    /** Whether the host stamps the marker (or the dangerous opt-in is set); the pre-check runs once. */
    private mayAppend;
    /** After the first append on an unversioned host, probe the returned envelope for the marker. */
    private probe;
    /** One-time warning that fact appends were disabled to keep session logs loadable. */
    private warnOnce;
}
//# sourceMappingURL=facts.d.ts.map