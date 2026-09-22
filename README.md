<div align="center">

# 🏠 dsh-team-rooms
- **1024 store channel**: `npm i -g dsh1024` once, then `dsh1024 plugin --profile web add dsh-team-rooms` (counts toward the [deepseek1024.com](https://deepseek1024.com) install ranking).

**Persistent, cross-session multi-agent team rooms for DeepSeek Harness — members, a message bus, a shared task board, and a shared timeline that survive restarts.**

*Each member is an independent DSH session; the room is the shared durable object between them.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/PerryLink/dsh-team-rooms/badge)](https://api.securityscorecards.dev/projects/github.com/PerryLink/dsh-team-rooms)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-team-rooms.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-team-rooms)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-team-rooms/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-team-rooms/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-team-rooms?label=version)](https://github.com/PerryLink/dsh-team-rooms/releases)
[![npm version](https://img.shields.io/npm/v/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)
[![npm downloads](https://img.shields.io/npm/dm/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-team-rooms?metric=downloads)](https://dshfind.com/plugins/PerryLink/dsh-team-rooms?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

> **Extracted from [`dsh-background-agents`](https://github.com/PerryLink/dsh-background-agents) 0.9.6.** The background-agent half of that plugin (`background_agent` and the five `bg_*` tools) is superseded by DSH's native continuable subagents; the team-room half had no native equivalent and lives on here as its own package. Storage domains, session logs, and settings written by 0.9.6 keep working unchanged — see *Compatibility*.

## Compatibility

Host `0.1.2-alpha.2` and later fails closed on the session event vocabulary, so this plugin no longer writes its log-only fact events (`team-room/fact`) there: facts route to the logger/panel channel instead and the `teamRoom` projection degrades to an empty fold. Older rc lines (through `0.1.1-rc.2`) keep the ignorable-marker discipline. The client half rides the current client packages (`dsh-api-session-controller`, `dsh-client-ui-slots`, `dsh-client-ui-settings`, `dsh-client-locale`, `dsh-client-web`).

**Data compatibility with `dsh-background-agents` 0.9.6 is a hard rule.** These strings are byte-identical to 0.9.6 and must never be renamed: the storage domain `team_rooms`, the `teamRoom` projection key, the `team-room/fact` session event type, and the `team-rooms` settings-slot id. An existing profile therefore keeps its rooms, its member logs, and its settings page when you swap the plugin.

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-alpha.1` (verified 2026-09-18; dev and runtime pins `0.1.5-rc.2`, peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Platforms | All (host tools; the settings page needs the Web client half and the storage-domain capability) |
| Model | Any (rooms carry no model route — members are ordinary sessions) |

## What you get

`dsh-team-rooms` turns several independent sessions into one coordinated team:

1. **The `/room` command family** — `create`, `join`, `leave`, `list`, `send`, `tasks`, `task add|assign|claim|done|delete`. Rooms are named, owned, and addressed by a stable room id you can paste into another session.
2. **Eight `room_*` tools** — `room_list_rooms`, `room_post`, `room_read`, `room_list_tasks`, `room_create_task`, `room_claim_task`, `room_transfer_task`, `room_complete_task`. The model works the shared board and the bus from inside its own session; `room_transfer_task` asks for approval before a cross-member handoff.
3. **A durable room store** — members, the message bus (directed or broadcast), the task board, and the timeline live in the `team_rooms` storage domain (SQLite or JSONL backend — the deployment chooses; the plugin adds no service of its own) and recover across DSH restarts.
4. **A Web settings page** — the Team Rooms settings section shows member status, the task board, and the timeline of every room the current session belongs to, read from the `teamRoom` session projection and written back through the host `/room` command.

## Quick start

```sh
# 1. install the bundle into your profile
dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"

# or from npm (published releases)
dsh plugin --profile web add dsh-team-rooms

# 2. restart and verify the row
dsh --profile web --dump-config | grep -A4 'id: team-rooms'
```

The bundle patch carries the plugin row; no Config key is required. The repo commits its build output (`lib/`), so git installs need no build step. Rooms mount wherever the storage domain is composed (`@deepseek-ai/dsh-storage-domain`, part of every `@deepseek-ai/dsh-base` profile); without it the `/room` command and the `room_*` tools stay dormant while everything else still loads.

Then, inside any session:

```
/room create release-prep
/room send <roomId> kickoff: I own the changelog, who takes the docs?
/room task add <roomId> draft the migration note
/room task claim <roomId> <taskId>
```

Paste the printed room id into another session and `/room join <roomId>` — that session is now a member, receives room deliveries as ordinary messages, and sees the same board.

## Install & uninstall

- **git channel** (latest `main`): `dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"` — committed `lib/`, no `prepare` or `allowBuilds` step.
- **npm channel** (published releases): `dsh plugin --profile web add dsh-team-rooms`.
- **tarball channel**: `pnpm pack` in this repo, then `dsh plugin --profile web add ./dsh-team-rooms-<version>.tgz`.
- **uninstall**: `dsh plugin --profile web remove dsh-team-rooms` (or remove the row from the profile patch). Your rooms stay in the `team_rooms` storage domain and come back if you reinstall.
- ⚠️ **Do not mount this and `dsh-background-agents` at the same time.** While the deprecation window is open both packages are published, and both register the same eight `room_*` tools, the same `settings.section` slot id (`team-rooms`) and the same `team_rooms` storage domain — so the two room halves collide. If you already run `dsh-background-agents`, remove it first (`dsh plugin --profile web remove dsh-background-agents`). Your rooms survive either way: they live in the storage domain, not in the plugin.

## Configuration

Every tunable is a validated Schemastery `Config` field — change it in cordis.yml, never in code. Nothing is required.

| Key | Default | Meaning |
|---|---|---|
| `maxRooms` | `16` | Hard cap on team rooms across the profile |
| `maxMembersPerRoom` | `8` | Hard cap on members per room (`>= 2`) |
| `maxRoomsPerMember` | `4` | Hard cap on rooms one member session may join |
| `busRetention` | `200` | Bus messages kept per room |
| `timelineRetention` | `500` | Timeline events kept per room |
| `taskRetention` | `50` | Completed tasks kept per room |
| `maxMessageChars` | `4000` | Hard cap on one room message's text (rejected above, never truncated) |
| `injectRoomBrief` | `true` | Inject the short room brief into member sessions (join + resume) |
| `roomOpenTimeoutMs` | `15000` | How long the `team_rooms` storage-domain open may take before every room operation fails loud (`store-unavailable`) instead of hanging |
| `allowUnmarkedFacts` | `false` | Force log-only `team-room/fact` events on hosts that drop the `ignorable` marker (dangerous: unmarked facts make sessions unresumable elsewhere); default is detect-and-skip |
| `inbound.enabled` | `false` | Enable the stdio JSON-RPC inbound bridge for external agent runtimes (OpenAI Agents SDK / CrewAI). Disabled by default (fail-closed). |
| `inbound.command` | *(none)* | External runtime launch command; when enabled and present, the plugin spawns it and listens for newline-delimited JSON-RPC notifications. Absent/unspawnable = the bridge stays dormant (logged). |

## Tools & surfaces

| Surface | Kind | Notes |
|---|---|---|
| `/room` | command | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` | tool | Every room this session belongs to: ids, names, rosters, task counts |
| `room_post` | tool | Post to the bus (broadcast, or directed with `to`) |
| `room_read` | tool | Read the bus history of one room, from a seq cursor |
| `room_list_tasks` | tool | The shared task board of one room |
| `room_create_task` | tool | Add a board row (optionally assigned) |
| `room_claim_task` | tool | Claim a row for this session (assignee + in-progress) |
| `room_transfer_task` | tool | Hand a row to another member — **approval-gated**, fails closed |
| `room_complete_task` | tool | Mark a row `done` |
| `teamRoom` projection | session projection | The room view folded from `team-room/fact` events in this member's own log |
| Web settings page | client | Member status, the task board, the timeline, and the room actions; slot id `team-rooms` |

That is **eight** `room_*` tools, all registered once the storage domain is composed.

## How it works — and why it survives restarts

The room store is the cross-session authority; the session projection is each member's own reconstructed copy. Two writes run at once and stay consistent:

- **Every room mutation** (create, join, leave, post, task transitions) queues on ONE hub write chain — the `team_rooms` domain's single write chain is the ordering authority, so concurrent posters can never interleave a read-modify-write and bus seqs mint strictly in commit order.
- **Model-visible ⟺ recorded**: a delivered room message is an official inbox delivery (`agent.followup` wakes a live member; `agent.inject` hands an offline member its backlog on the next start), so it lands as a durable `user/message` in that member's own session log.
- **The shared timeline** mirrors into every member's log as log-only `team-room/fact` events carrying the canonical store `timelineSeq`; the `teamRoom` projection folds each member's own log, so the view reconstructs on every reopen without reading the store.
- **Delivery is at-least-once and ordered**: per-member cursors (`lastDeliveredSeq`, `lastFactSeq`) advance only after a delivery lands, so a crash between commit and delivery re-delivers on catch-up rather than losing the message.

Hosts whose `Session.append` predates the `ignorable` marker (every released rc line through `0.1.0-rc.8` and the `0.1.1-rc.2` line, and the `0.1.2-rc` line, which keeps the envelope field for stored-log read compatibility only) are detected before the first append (peer-version pre-check, then a probe of the returned envelope) and fact appends are skipped with a one-time warning: the durable store, the API surfaces, and the model-visible deliveries keep working, and `teamRoom` degrades to an empty fold. `allowUnmarkedFacts: true` opts back in — deliberately dangerous.

## Not this plugin

| Project | What it does | The boundary |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Scheduled coding tasks in fresh agent sessions | It owns **when** tasks run (scheduling). This plugin owns the **shared object** several sessions work on — no scheduler seam, no cron. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Multi-agent dashboard skill | Display-oriented and read-mostly. This plugin's rooms are **writable coordination state**: a bus, a board, and approval-gated handoffs, persisted in the harness's own storage. |
| `dsh-background-agents` | Background agents plus (previously) team rooms | That package's `bg_*` half is superseded by DSH's native continuable subagents; its room half is this package. Do not mount both room halves at once. |

## Permissions & data

- **Permissions**: the workshop manifest declares `session:append` and `tools:register`. Rooms never spawn a subagent, so the plugin asks for no `subagent:*` permission and declares no subagent dependency.
- **Data**: rooms live in the `team_rooms` storage domain (SQLite or JSONL — zero extra services). No separate database, no network.
- **Session log**: `team-room/fact` events are appended with the envelope's `ignorable: true` marker on hosts that honor it (pre-marker hosts are detected and fact appends are skipped — see `allowUnmarkedFacts`); the model-visible room deliveries are real `user/message` records.

## Security boundaries

- **Approval-gated handoffs.** `room_transfer_task` routes through the official approval seam and fails closed when no approval service is composed or no answerer grants it — nothing changes on a refusal.
- **Model-visible ⟺ logged.** Every delivered room message is a durable `user/message` in the member's own log; the shared timeline mirrors as log-only `team-room/fact` events. A room message can never reach a model without being recorded.
- **Membership is the authorization boundary.** Every `room_*` tool authorizes against the calling session's own membership; a non-member gets a stable rejection, not a partial write.
- **Retention is bounded.** Bus, timeline, and done-task windows are enforced on every write, so a long-lived room cannot grow without limit.
- **No scheduling, no cross-machine members.** A member is a process-local session of this deployment.

## Cross-ecosystem inbound (P2)

External agent runtimes — OpenAI Agents SDK, CrewAI, and similar — can publish into a team room through a minimal **newline-delimited JSON-RPC 2.0 bridge over stdio**. This is a JSON-RPC direct-connect minimal set, not the official ACP wire protocol: full ACP compatibility waits for the upstream seam.

Enable it with two Config fields and point `inbound.command` at a launcher that emits one JSON notification per line on stdout:

```yaml
# cordis.yml (plugin row)
inbound:
  enabled: true
  command: "python external_runtime.py --room <room-id>"
```

The runtime emits three notification kinds; `method` is the event name and `params.name` is the external agent's display name:

```json
{"jsonrpc":"2.0","method":"agent_started","params":{"name":"researcher","room":"<room-id>","traceId":"t-1"}}
{"jsonrpc":"2.0","method":"agent_message","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","message":"found the failing test"}}
{"jsonrpc":"2.0","method":"agent_finished","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","status":"ok","usage":{"inputTokens":100,"outputTokens":40}}}
```

Each maps onto the room's existing surfaces: `agent_started` opens a task-board card, `agent_message` posts to the message bus, and `agent_finished` completes the card and posts the outcome. Invalid messages fail closed — they are dropped and a JSON-RPC error is written back. External runtimes are not DSH sessions, so the room owner's member session stands in as the sender; a room with no owner member drops the event. Start and stop are owned by the plugin fiber through a disposer; an unspawnable `inbound.command` degrades to a logged warning (the bridge stays dormant, nothing else is affected).

## Known limitations

- Rooms require the storage domain to be composed; without `@deepseek-ai/dsh-storage-domain`, the `/room` command and the `room_*` tools are disabled.
- A room needs at least two members to be interesting, and the roster is bounded by `maxMembersPerRoom`; membership is per session, not per user.
- There is no cross-machine membership: every member is a process-local session of this deployment.
- `room_transfer_task` needs an approval answerer. Without one it fails closed by design, so automated profiles that want handoffs must compose an approval service.
- Cost/usage accounting is out of scope here (that lived in the background-agent half); the room surfaces report structure, not spend.

## Development

```sh
pnpm install        # tooling only; harness packages resolve against a sibling checkout
pnpm run typecheck  # strict TS, node + client programs
pnpm test           # vitest: unit, room-hub, projection, and jsdom panel tests
pnpm run build      # lib/index.js (node half) + lib/client.js (web client bundle)
pnpm run verify:artifacts && pnpm run check:readmes
pnpm run gen-aliases  # re-map harness package paths after the checkout moves
```

`pnpm run pack:smoke` builds, packs, and (with `DSH_HARNESS_ROOT` set) installs the tarball into a throwaway profile to assert the composed row.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`, `cross-session`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: the team-room hub and its write chain, the delivery cursors, the `teamRoom` projection, the Web settings page, docs, CI/CD and releases.

## PerryLink DSH Plugin Family

This project is one of the **45 DeepSeek Harness plugins** maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |


### Install from the DSH Desktop Market

All PerryLink plugins are browsable in the built-in DSH Desktop Market: **Market → Sources → add source → paste** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ select it**. Installation still goes through the Market's npm-identity verification and your confirmation.

## License

[Apache License 2.0](LICENSE) © 2026 dsh-team-rooms contributors
