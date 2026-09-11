/**
 * The durable producer tag `dsh-team-rooms` stamps on every replay metadata
 * block its room tools attach to a `tool/result` event.
 *
 * The value stays byte-identical to the tag written by `dsh-background-agents`
 * 0.9.6: the room half of that plugin produced it, and existing profiles carry
 * `presentationMeta.plugin === 'dsh-background-agents'` on stored results. A
 * rename would not break a fold (nothing parses this value across packages,
 * and the room projection reads the durable store, not this tag), but it would
 * split one logical producer across two strings in stored logs — so the
 * extraction deliberately keeps the historical literal. Only the constant that
 * already belonged to the room half moved here; the Group-A notice-line and
 * meta machinery (`NOTICE_PREFIX`/`noticeLine`/`parseNotice`/
 * `isBackgroundAgentsMeta`) stays with the background-agent package.
 *
 * @module dsh-team-rooms/vocabulary
 */

/** The producer tag stamped on the room tools' `tool/result` replay metadata. */
export const PLUGIN = 'dsh-background-agents' as const
