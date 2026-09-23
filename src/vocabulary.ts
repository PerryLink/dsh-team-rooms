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

import type { ContextFormed } from '@deepseek-ai/dsh-llm'

/**
 * Producer-owned message attribution.
 *
 * The harness's `MessageSourceMap` is a merge-extensible sum type: each
 * producer declares its own `kind` in its own module, and the retired
 * catch-all `{ kind: 'plugin', plugin }` shape no longer exists. It is gone
 * from BOTH layers that used to accept it — the type layer
 * (`packages/llm/llm/src/message.ts`, whose map carries only
 * `user | model | tool | 'system-prompt'`) and the persistence layer
 * (`session-format-v3-to-v4/src/message-sources.ts`, which refuses a physical
 * row whose source `kind` is `'plugin'`, so `as any` cannot smuggle one past
 * admission). The declaration below is byte-identical to the one
 * `dsh-background-agents` makes, because the room half writes under the same
 * historical producer tag (see {@link PLUGIN}).
 */
declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    /** This plugin's model-visible room injections: the room brief and the relayed room messages. */
    'dsh-background-agents': { kind: 'dsh-background-agents' } & ContextFormed
  }
}

/** The producer tag stamped on the room tools' `tool/result` replay metadata. */
export const PLUGIN = 'dsh-background-agents' as const

/**
 * This plugin's message-source kind, used for the model-visible room
 * injections. Kept equal to {@link PLUGIN} on purpose: one logical producer
 * must not be split across two strings in stored logs.
 */
export const SOURCE_KIND = PLUGIN
