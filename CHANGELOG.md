# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Host pins move to `0.1.7-rc.1`; re-verified against that host line. Every `@deepseek-ai/dsh-*` dev/test dependency now pins `0.1.7-rc.1`, the `pnpm-lock.yaml` graph is regenerated, `dshWorkshop.compatibility.dshVersions` appends `0.1.7-rc.1`, the monthly Compat workflow and the CI probe install the `0.1.7-rc.1` host, and the compatibility baseline in every README records `dsh-v0.1.7-rc.1`. The declared host ranges (`engines.dsh` and the `peerDependencies` union) are deliberately **unchanged** — they already admit `0.1.7-rc.1`, and a range is what the manifest accepts, not what has been tested.

## [1.0.2] - 2026-09-23

### Fixed

- The team-room panel binds to the session the main view retains again. The removed `SessionListState.current` field left the client reading `undefined`, so the settings page showed its "no active session" state forever even with a conversation open; the controller now derives the open session from the main-view retention count (the upstream `ui-session` derivation). The panel keeps an explicit no-session state when nothing is retained.

- The offline catch-up listener no longer runs inside the agent-creation critical path. `agent/created` is a serial waterfall: the registry awaits every listener before it finishes registering the agent, so the previous `async` listener made every agent creation wait on room-store I/O (and a stuck store could block it indefinitely). The listener now decides synchronously — `source` filter (`clear`/`compact` skip) plus an in-memory membership pre-check — and hands the store work to a microtask; its own failures are logged, never propagated.

- The room brief notice and the relayed room message no longer fail to type-check on the `0.1.7` line: the host removed the shared `{ kind: 'plugin', plugin }` message-source catch-all from BOTH layers that used to accept it — the type layer (`MessageSourceMap`) and the persistence layer, which refuses a physical row whose source kind is `'plugin'`, so a cast cannot smuggle one past admission. The producer-owned kind is now declared by module augmentation in `src/vocabulary.ts`, the same pattern the host's own producers use, and used at both write sites. The declaration is byte-identical to the one `dsh-background-agents` makes, because the room half writes under the same historical producer tag (`SOURCE_KIND = PLUGIN = 'dsh-background-agents'`) — splitting one logical producer across two strings in stored logs would be worse than the duplication. The `presentationMeta.plugin` tag on the room tools' `tool/result` rows is untouched: that is a different vocabulary and still uses the historical literal for stored-log continuity.

### Changed

- Move the `@deepseek-ai/dsh-*` dev/test pins to `0.1.7-alpha.2` and re-verify both rulers against that line.
- Every declared host range — `engines.dsh` and the eight `peerDependencies` bands — gains the `|| >=0.1.7-0 <0.2.0` arm, so the bands now admit the `0.1.7` prerelease line. Under semver's prerelease rule a range whose only prerelease comparators sit on earlier version tuples cannot admit a later alpha, so the previous three-clause form excluded the very host this release targets. No existing arm was removed or narrowed.
- `dshWorkshop.compatibility.dshVersions` gains `0.1.7-alpha.2`, and all five READMEs name the verified line.
- The compat workflow now installs the `0.1.7-alpha.2` host instead of `0.1.6-alpha.2`, so the scheduled end-to-end run exercises the line this package declares.
- Move the room catch-up listener from the removed `agent/session-start` event to `agent/created` (the 0.1.6-alpha.1 checkout renamed the lifecycle event and added `source` to its payload). `ARCHITECTURE.md` now records the serial contract alongside the event name.
- Declare `dsh.manifestVersion: 1` and the canonical `engines.dsh` range.

## [1.0.1] - 2026-09-12

### Fixed

- Drop a stray U+FFFD replacement character from the Hindi readme's family table.

## [1.0.0] — 2026-09-11

### Added

- **The plugin, extracted.** `dsh-team-rooms` is the team-room half of `dsh-background-agents` 0.9.6 as a standalone package: the `/room` command family, eight `room_*` tools, the `RoomHub` write chain, the delivery cursors, the `teamRoom` session projection, the cross-ecosystem stdio inbound bridge, and the Team Rooms Web settings page. The background-agent half (`background_agent` and the five `bg_*` tools) stays behind — DSH's native continuable subagents cover it.
- `ARCHITECTURE.md` now documents the room hub, the single write chain, the delivery cursors, the `teamRoom` fold, and the inbound bridge. In `dsh-background-agents` that design existed only in source docstrings.
- `tests/room-projection.spec.ts` covers the `teamRoom` fold (17 cases) — `src/room/projection.ts` was entirely untested in the source package.
- `tests/room-presenter.spec.ts` and `tests/team-rooms-section.spec.tsx` cover the client half (the pure presenter and a jsdom render of the settings section) — neither had any test in the source package. The component test drives React through `act()` so state updates flush before each assertion (the suite reports no un-acted updates).

### Changed

- **Package identity**: npm name, the `dsh.bundle.patch` row name, `PLUGIN_ID` in `tsdown.config.ts`, the `window.__ModuleLoader__.load({ id })` stamp, the logger channel, and the `data-plugin`/`data-plugin-css` CSS tags are all `dsh-team-rooms`. The client bundle is served from `/plugins/dsh-team-rooms/client.js`.
- **`inject`** is now `['tools', 'agents', 'sessions']` — the subagent runtime is gone. No room operation spawns a child agent, so the package declares no `dsh-subagent` dependency and drops the `subagent:spawn` workshop permission.
- **`cordis.patch.yml`** inserts one row with the room-policy keys and **no `provider`** key: that key named the subagent provider the background-agent half started children with.
- **`dsh.client.inject`** drops `@deepseek-ai/dsh-client-ui-sidebar` and `@deepseek-ai/dsh-client-ui-primitives` (both belonged to the removed sidebar panel) and now lists `@deepseek-ai/dsh-client-ui-settings` — `TeamRoomsSection.tsx` has always imported its types, but the manifest never declared the edge.
- **`@deepseek-ai/dsh-session-projection` is declared** in `peerDependencies` and `devDependencies`. `src/room/projection.ts` imports it, and `dsh-background-agents` declared it in no dependency block at all.
- The client half registers **only** the `settings.section` page; the source's single client entry served two slots from one bundle.
- `tsconfig.json` excludes the two client-side test files from the node program (they belong to `tsconfig.client.json`), and both client configs list `src/room/schema.ts` explicitly, which the source configuration relied on `tsconfig.json`'s `src` include to reach implicitly.
- The five READMEs now document **eight** `room_*` tools. The source `README.md` surface table listed seven and omitted `room_read`.
- `src/facts.ts` narrows `FactEventType` to `'team-room/fact'` and its header names only the room fact channel; the host gating itself is unchanged.

### Fixed

- Five mojibake sequences in the moved sources (U+9205 where an em dash was intended, in `src/facts.ts` and `src/room/hub.ts`) are written as plain hyphens.

### Preserved (do not change)

These strings are byte-identical to `dsh-background-agents` 0.9.6 so existing user data keeps working. Changing any of them silently orphans stored rooms, existing session logs, or the settings page:

- the storage domain name `team_rooms` (`src/room/domain.ts`)
- the projection key `teamRoom` (`src/room/projection.ts`)
- the session event type `team-room/fact` (`src/room/events.ts`)
- the client slot id `team-rooms` (`src/client/index.ts`)

`PLUGIN` (`src/vocabulary.ts`) also keeps the 0.9.6 literal `'dsh-background-agents'` even though the package is renamed: it is the producer tag already written into stored `presentationMeta` blocks, and nothing parses it across packages, so one logical producer stays under one string. Revisit only with a deliberate data-migration decision.

### Deprecated

- `dsh-background-agents` remains published and mounts as before; it is not removed by this release. Do not mount both packages' room halves at once — they would register the same tools, the same `/room` command, the same `teamRoom` projection, and the same `team-rooms` settings slot.
