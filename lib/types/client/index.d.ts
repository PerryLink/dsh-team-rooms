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
import type { Context } from '@deepseek-ai/cordis';
import { type TeamRoomsKey } from './room-locales.js';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Team-room settings panel copy. */
        teamRooms: TeamRoomsKey;
    }
}
export type { TeamRoomsInjected, TeamRoomsSectionProps, } from './TeamRoomsSection.js';
/**
 * Required services: sessions (list + bindings), slots, locale, the wire
 * client, and the remote command executor (`remote.commands`, which carries
 * every `/room` line this page issues). `connection` is deliberately absent —
 * the room page never calls a remote namespace directly.
 */
export declare const inject: string[];
/**
 * Register the Team Rooms settings page.
 * @param ctx - client root context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map