# Architecture

`dsh-team-rooms` makes several independent DSH sessions one coordinated team. A **room** is `{members, message bus, task board, shared timeline}` persisted in the harness's own storage layer; every member is an ordinary session that keeps its own durable log. This document records the design decisions; the external contracts live in [README.md](./README.md).

The package was extracted from `dsh-background-agents` 0.9.6, whose background-agent half is superseded by DSH's native continuable subagents. Everything room-shaped moved here verbatim; the identity strings that tie stored data to the old package are frozen (see *Frozen identity* below).

## Frozen identity

Four strings are byte-identical to what `dsh-background-agents` 0.9.6 wrote, because existing profiles and session logs carry them:

| String | Declared in | Why it can never change |
|---|---|---|
| `team_rooms` | `src/room/domain.ts` (`defineDomain({ name })`) | The storage domain's on-disk identity. Renaming it orphans every existing room, member row, bus message, and task. |
| `teamRoom` | `src/room/projection.ts` (`key`) and the `SessionProjectionMap` augmentation | The projection cache key and the client's `faceOf('teamRoom')` lookup. |
| `team-room/fact` | `src/room/events.ts` (`TEAM_ROOM_FACT`) | The session-log event type. Older member logs contain records with this type. |
| `team-rooms` | `src/client/index.ts` (`settings.section` registration `id`) | The settings-slot id the shell resolves. |

The producer tag (`PLUGIN` in `src/vocabulary.ts`) deliberately also stays at the 0.9.6 literal `'dsh-background-agents'`: the room tools stamped `presentationMeta.plugin` with it, and nothing parses the value across packages, so keeping it leaves one logical producer under one string in stored logs. `tests/room-projection.spec.ts` pins the first three; the slot id is pinned by inspection and by the client registration itself.

## The room hub (`src/room/hub.ts`)

`RoomHub` is a Cordis `Service` (`roomHub`) constructed in `apply()` once the storage domain is available. It owns every room mutation and all delivery.

- **Open**: `open()` calls `ctx.storageDomain.open(teamRoomsDomainSpec)` and caches the four tables (`rooms`, `bus`, `tasks`, `timeline`). The open is raced against `roomOpenTimeoutMs`; a stuck provider rejects with `RoomError('store-unavailable')` instead of parking `/room` forever without a `command/done`. A domain that arrives *after* the timeout is closed immediately (no orphaned handle), and the close effect is registered on the owning fiber so a normal unload closes the domain too.
- **Gate**: every operation awaits `this.ready` first, so a failed open fails loudly at the first call rather than hanging or half-writing.

## One write chain

Every mutation — `createRoom`, `join`, `leave`, `postMessage`, `createTask`, `claimTask`, `assignTask`, `completeTask`, `deleteRoom` — is enqueued on a **single promise chain** (`this.tail`). The domain's single write chain is the ordering authority; running all read-modify-write sequences on one chain is what makes that authority observable:

- bus `seq` and timeline `seq` are minted inside the chain, so they are strictly commit-ordered and gap-free;
- two concurrent posters cannot interleave a read of `busNext` with a write of the same record;
- `tests/room-tools.spec.ts` exercises this directly (eight concurrent `room_create_task` calls all land).

Delivery is *outside* the mutation chain, on per-room and per-member chains, so a slow inbox never blocks a write.

## Model-visible ⟺ recorded

Every room message a member's model sees is an official inbox delivery, and therefore a durable `user/message` in that member's own session log:

- a **live** member is woken with `agent.followup(...)`;
- an **offline** member receives its backlog through `agent.inject(...)` when its session next starts (`catchUp`, mounted on `agent/session-start`).

Both directions use `createUserMessage({ source: { kind: 'plugin', plugin: PLUGIN, form: 'notice' } })`, so a room delivery is attributable and replayable. This is the same discipline the background-agent half used for its progress lines, applied to a shared object.

## Cursors: at-least-once, ordered delivery

Each member slot carries two cursors in the durable room record (`src/room/schema.ts`):

| Cursor | Meaning | Advanced when |
|---|---|---|
| `lastDeliveredSeq` | bus seq up to which this member's log received the model-visible message (`0` = none) | **after** the inbox delivery returns |
| `lastFactSeq` | timeline seq up to which this member's log carries the log-only fact (`-1` = none) | **after** the fact append |

Advancing only after the delivery lands is what makes delivery at-least-once: a crash between commit and delivery replays on catch-up instead of losing the message. Per-member chains serialize live delivery against catch-up so the two can never interleave and double-advance a cursor.

## The shared timeline

The room store is the cross-session authority; the timeline is mirrored into every member's own log as log-only `team-room/fact` events (`src/room/events.ts`), each carrying the canonical store `timelineSeq`. Members offline while a fact landed receive every missed fact in store order on their next activation, so the fold always reconstructs the shared view from the member's own log.

The fact vocabulary is a closed discriminated union: `room-joined` (a full snapshot — room identity, roster, open tasks, retained timeline — so a cold member log needs no store read), `member-joined`, `member-left`, `message-posted` (with optional `toSessionId` for a directed delivery), `task-created`, `task-claimed`, `task-assigned`, `task-completed`.

`FactAppender` (`src/facts.ts`) is the single append seam and carries the host gate:

- hosts at `0.1.2-alpha.1` and later fail closed on the session event vocabulary, so `team-room/fact` is never appended there — each fact goes to the logger/panel fallback instead, and the projection degrades to an empty fold;
- hosts whose `Session.append` predates the `ignorable` marker (every released rc line through `0.1.0-rc.8`, the `0.1.1-rc.2` line, and the `0.1.2-rc` line) are detected before the first append — peer-version pre-check, then a probe of the returned envelope — and appends are skipped with a one-time warning so the session log stays loadable everywhere;
- `allowUnmarkedFacts: true` opts back into unmarked appends (deliberately dangerous).

## The `teamRoom` projection (`src/room/projection.ts`)

A pure fold over one member's own log: `apply(state, event)` consumes only events whose type is `team-room/fact` and returns the *same state object* for anything else, so the projection cache is a no-op for foreign events.

- `room-joined` inserts a room view if the room is unknown; `member-joined` / `member-left` upsert the roster; the four task facts upsert a board row; `message-posted` appends a timeline entry classified as broadcast or directed.
- Timeline entries are deduped by `seq` and kept sorted, bounded at `TIMELINE_FOLD_BOUND = 1000`.
- The fold state keeps **every** done task; the **wire** value (`wire.view`) applies `capDoneTasks` (`DONE_TASK_FOLD_BOUND = 100`) so the browser never receives an unbounded board. `stateVersion: 1` matches the persisted cache written by 0.9.6.

The value is the per-session reconstructed copy; the store remains the authority. That split is why the settings page renders instantly on reopen without a store read, and why a lost projection cache costs only a refold.

## The `/room` command family and the eight tools

- `src/room/commands.ts` registers `name: 'room'` with the subcommands `create|join|leave|list|send|tasks|task add|assign|claim|done|delete`. It is mounted through `ctx.effect(...)`, so the command disappears with the fiber.
- `src/room/tools.ts` registers the eight model-facing tools: `room_list_rooms`, `room_post`, `room_read`, `room_list_tasks`, `room_create_task`, `room_claim_task`, `room_transfer_task`, `room_complete_task`.
- **Membership is the authorization boundary**: every tool resolves the calling session's member slot first and rejects a non-member with a stable error instead of a partial write.
- **`room_transfer_task` is approval-gated**: it asks the optional `approval` service, and a missing service, a missing answerer, a rejection, or an abort all collapse to the same fail-closed `approval-unavailable` / `approval-denied` `RoomError`. Nothing changes on a refusal.

## The client half

`src/client/index.ts` registers exactly one surface: the `settings.section` entry with the frozen id `team-rooms`, order 30, locale namespace `teamRooms`.

- `TeamRoomsController` is a `useSyncExternalStore`-compatible snapshot: it subscribes to the session list, re-binds `sessions.binding(current).session.projections.faceOf('teamRoom')` whenever the current session changes, and runs the snapshot through the pure presenter.
- `src/client/room-presenter.ts` turns the opaque projection cell into display rows: it validates with the shared zod guard (`isTeamRoomView`), sorts members by join time, ranks tasks `todo → in-progress → done` then by id, and serves the 100 newest timeline entries. It performs no I/O, so it is testable without a DOM.
- **Every write goes through the host**: the injected action map (`create`, `join`, `leave`, `post`, `addTask`, `claimTask`, `completeTask`, `assignTask`) builds a `/room …` line and executes it with `remote.commands.execute(sessionId, line, [])`. There is no private RPC and no client-side state mutation, so each click keeps the durable `command/run` → `command/done` lifecycle and the host's ordering guarantees.

The bundle is a single CJS face wrapped in `window.__ModuleLoader__.load({ id: 'dsh-team-rooms', factory })`, served from `/plugins/dsh-team-rooms/client.js`. `PLUGIN_ID` in `tsdown.config.ts` is the one string that must match the npm package name, the cordis row name, the stamped bundle id, the logger channel, and the `data-plugin`/`data-plugin-css` CSS tags.

## Data flow

```
/room …  ──▶ command handler ─┐
room_*   ──▶ tool execution  ─┤
                              ▼
                     RoomHub write chain  ──▶ team_rooms domain (rooms / bus / tasks / timeline)
                              │                         (single write chain = ordering authority)
                              ├─▶ team-room/fact  (ignorable, log-only) ──▶ each member's session log
                              │                                              └─▶ teamRoom projection ──▶ settings page
                              └─▶ agent.followup / agent.inject ──▶ member session log (user/message)
                                                                     (model-visible ⟺ recorded)

member session starts ──▶ hub.catchUp(sessionId) ──▶ replay missed bus messages + facts, in store order
```

## Cross-ecosystem inbound (P2)

`src/inbound.ts` adds a minimal newline-delimited JSON-RPC 2.0 bridge over stdio so external agent runtimes (OpenAI Agents SDK, CrewAI) can publish into a team room. This is a direct-connect minimal set — full ACP wire compatibility waits for the upstream seam. It moved here with the room half: every payload type carries a `roomId`, and its only consumer is `inboundRoomSink` in `src/index.ts`.

- **Wire**: one JSON notification per line on the child's stdout. `method` is the event name (`agent_started` | `agent_message` | `agent_finished`); `params` carries `name`, `room`, `traceId`, optional `status`, `message`, and `usage`. The zod `inboundParamsSchema` is `.strict()` — unknown fields fail closed.
- **Seam**: `InboundCoordinator.registerInboundAdapter(adapter, sink)` returns a disposer; `StdioJsonRpcInbound` spawns `inbound.command`, parses lines, maps them to normalized `InboundEvent`s, and emits into the sink. Invalid lines are dropped and answered with a JSON-RPC error on the child's stdin.
- **Mapping**: `deliveriesFor` translates each event onto the room's existing surfaces — `agent_started` → task-board card, `agent_message` → bus post, `agent_finished` → card close + outcome post. The `apply()` bridge (`inboundRoomSink`) executes those deliveries against the `RoomHub`; external runtimes are not DSH sessions, so the room owner's member session is the sender and a room with no owner drops the event.
- **Lifecycle & config**: `inbound.enabled` (default `false`, fail-closed) and `inbound.command` gate the bridge, which mounts only where the storage domain (and thus the room hub) exists. Start/stop ride the fiber's effect disposer; an unspawnable command degrades to a logged warning with the bridge dormant.

## Boundaries

- **No subagents.** The room half never spawns, messages, or interrupts a child agent: the package declares no `subagent:*` permission, declares no subagent dependency, and its `inject` list carries no `subagents` entry. A member is a session the user (or another seam) already has.
- **No scheduling.** Rooms own the shared object, not "when" work runs.
- **No cross-machine membership.** Every member is a process-local session of this deployment.
- **No currency accounting.** That lived in the background-agent half; room surfaces report structure, not spend.
- **Storage is the only durability dependency.** Without `@deepseek-ai/dsh-storage-domain` the `/room` command and the `room_*` tools stay dormant while the rest of the plugin loads cleanly.
