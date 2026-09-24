<div align="center">

# 🏠 dsh-team-rooms
- **1024 商店渠道**：先执行一次 `npm i -g dsh1024`，然后 `dsh1024 plugin --profile web add dsh-team-rooms`（计入 [deepseek1024.com](https://deepseek1024.com) 的安装榜）。

**面向 DeepSeek Harness 的持久化跨会话多 agent 团队房间 —— 成员、消息总线、共享任务板与共享时间线，重启后依然存活。**

*每个成员都是一个独立的 DSH 会话；房间是它们之间共享的持久对象。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-team-rooms.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-team-rooms)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-team-rooms/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-team-rooms/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-team-rooms?label=version)](https://github.com/PerryLink/dsh-team-rooms/releases)
[![npm version](https://img.shields.io/npm/v/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)
[![npm downloads](https://img.shields.io/npm/dm/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-team-rooms?metric=downloads&lang=zh)](https://dshfind.com/zh/plugins/PerryLink/dsh-team-rooms?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

> **自 [`dsh-background-agents`](https://github.com/PerryLink/dsh-background-agents) 0.9.6 拆分而来。** 该插件的后台代理部分（`background_agent` 与五个 `bg_*` 工具）已被 DSH 原生的可续聊子代理取代；团队房间部分没有原生等价物，因此作为独立包继续存在。0.9.6 写入的存储域、会话日志与设置项全部继续可用 —— 见「兼容性」。

## 兼容性

宿主 `0.1.2-alpha.2` 及之后版本对会话事件词表 fail-closed，因此本插件不再在那里写入仅日志的事实事件（`team-room/fact`）：事实改走 logger/面板通道，`teamRoom` 投影退化为空折叠。较早的 rc 线（直至 `0.1.1-rc.2`）仍保持 `ignorable` 标记纪律。客户端半部使用当前客户端包（`dsh-api-session-controller`、`dsh-client-ui-slots`、`dsh-client-ui-settings`、`dsh-client-locale`、`dsh-client-web`）。

**与 `dsh-background-agents` 0.9.6 的数据兼容是硬性规则。** 以下字符串与 0.9.6 逐字节一致，永不改名：存储域 `team_rooms`、`teamRoom` 投影键、`team-room/fact` 会话事件类型、以及 `team-rooms` 设置槽 id。因此替换插件后，既有 profile 的房间、成员日志与设置页都会原样保留。

| 界面 | 状态 |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-rc.2`（2026-09-24 验证；dev 与运行时钉 `0.1.7-rc.2`，peer 为 `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`） |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 平台 | 全平台（宿主工具；设置页需要 Web 客户端半部与存储域能力） |
| 模型 | 任意（房间不携带模型路由 —— 成员就是普通会话） |

## 你能获得什么

`dsh-team-rooms` 把多个独立会话变成一个协同的团队：

1. **`/room` 命令族** —— `create`、`join`、`leave`、`list`、`send`、`tasks`、`task add|assign|claim|done|delete`。房间有名字、有属主，并用稳定的房间 id 寻址，可以直接粘贴到另一个会话。
2. **八个 `room_*` 工具** —— `room_list_rooms`、`room_post`、`room_read`、`room_list_tasks`、`room_create_task`、`room_claim_task`、`room_transfer_task`、`room_complete_task`。模型在自己的会话内操作共享任务板与总线；跨成员交接（`room_transfer_task`）会先请求审批。
3. **持久房间存储** —— 成员、消息总线（定向或广播）、任务板与时间线存放在 `team_rooms` 存储域（SQLite 或 JSONL 后端，由部署决定；插件不新增任何服务），并在 DSH 重启后恢复。
4. **Web 设置页** —— Team Rooms 设置区显示当前会话所属每个房间的成员状态、任务板与时间线：读取自 `teamRoom` 会话投影，写回则通过宿主 `/room` 命令。

## 快速开始

```sh
# 1. 将 bundle 安装到你的 profile
dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"

# 或从 npm 安装（已发布版本）
dsh plugin --profile web add dsh-team-rooms

# 2. 重启并验证该行
dsh --profile web --dump-config | grep -A4 'id: team-rooms'
```

bundle 补丁带有插件行；没有任何必填 Config 键。仓库提交了构建产物（`lib/`），因此 git 安装无需构建步骤。只要组合了存储域（`@deepseek-ai/dsh-storage-domain`，每个 `@deepseek-ai/dsh-base` profile 都有），房间就会挂载；没有它时 `/room` 命令与 `room_*` 工具保持休眠，其余功能照常加载。

然后，在任意会话中：

```
/room create release-prep
/room send <roomId> kickoff: I own the changelog, who takes the docs?
/room task add <roomId> draft the migration note
/room task claim <roomId> <taskId>
```

把打印出的房间 id 粘贴到另一个会话并 `/room join <roomId>` —— 该会话即成为成员，会像普通消息一样收到房间投递，并看到同一块任务板。

## 安装与卸载

- **git 渠道**（最新 `main`）：`dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"` —— 已提交 `lib/`，无需 `prepare` 或 `allowBuilds` 步骤。
- **npm 渠道**（已发布版本）：`dsh plugin --profile web add dsh-team-rooms`。
- **tarball 渠道**：在本仓库执行 `pnpm pack`，然后 `dsh plugin --profile web add ./dsh-team-rooms-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-team-rooms`（或从 profile 补丁中删除该行）。你的房间仍留在 `team_rooms` 存储域中，重新安装即可回来。
- ⚠️ **不要与 `dsh-background-agents` 同时挂载。** 废弃窗口期内两个包都在发布，而它们注册的是同样的八个 `room_*` 工具、同一个 `settings.section` 槽位 id（`team-rooms`）与同一个 `team_rooms` 存储域 —— 两个 room 半边会互相冲突。若你已在运行 `dsh-background-agents`，请先卸载它（`dsh plugin --profile web remove dsh-background-agents`）。无论哪种情况房间都不会丢：它们存在存储域里，不在插件里。

## 配置

每个可调项都是经过校验的 Schemastery `Config` 字段 —— 在 cordis.yml 中修改，绝不在代码中修改。没有任何必填项。

| 键 | 默认值 | 含义 |
|---|---|---|
| `maxRooms` | `16` | 整个 profile 内团队房间的硬上限 |
| `maxMembersPerRoom` | `8` | 每个房间成员的硬上限（`>= 2`） |
| `maxRoomsPerMember` | `4` | 一个成员会话可加入的房间数上限 |
| `busRetention` | `200` | 每个房间保留的总线消息数 |
| `timelineRetention` | `500` | 每个房间保留的时间线事件数 |
| `taskRetention` | `50` | 每个房间保留的已完成任务数 |
| `maxMessageChars` | `4000` | 单条房间消息文本的硬上限（超限直接拒绝，绝不截断） |
| `injectRoomBrief` | `true` | 向成员会话注入简短房间简介（加入 + 恢复时） |
| `roomOpenTimeoutMs` | `15000` | `team_rooms` 存储域打开的最长等待时间；超时后所有房间操作以 `store-unavailable` 明确失败，而不是永久挂起 |
| `allowUnmarkedFacts` | `false` | 强制在丢弃 `ignorable` 标记的宿主上写入仅日志的 `team-room/fact` 事件（危险：未标记事件会让会话在其他宿主上无法恢复）；默认自动探测并跳过 |
| `inbound.enabled` | `false` | 开启面向外部代理运行时（OpenAI Agents SDK / CrewAI）的 stdio JSON-RPC 入站桥接；默认关闭（fail-closed） |
| `inbound.command` | *(无)* | 外部运行时启动命令；开启且存在时插件会 spawn 它并监听换行分隔的 JSON-RPC 通知；缺失/无法 spawn = 桥接保持休眠（记日志） |

## 工具与界面

| 界面 | 类型 | 说明 |
|---|---|---|
| `/room` | command | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` | tool | 本会话所属的每个房间：id、名称、成员名册、任务计数 |
| `room_post` | tool | 向总线发帖（广播，或用 `to` 定向） |
| `room_read` | tool | 从某个 seq 游标读取一个房间的总线历史 |
| `room_list_tasks` | tool | 某个房间的共享任务板 |
| `room_create_task` | tool | 新增一行任务（可选直接指派） |
| `room_claim_task` | tool | 由本会话认领一行（指派者 + 进行中） |
| `room_transfer_task` | tool | 把一行交给其他成员 —— **需审批**，未获批即 fail-closed |
| `room_complete_task` | tool | 把一行标为 `done` |
| `teamRoom` 投影 | session projection | 从本成员自己日志中的 `team-room/fact` 事件折叠出的房间视图 |
| Web 设置页 | client | 成员状态、任务板、时间线与房间操作；槽 id 为 `team-rooms` |

以上是 **八个** `room_*` 工具，在存储域组合后全部注册。

## 工作原理 —— 以及它为何能在重启后存活

房间存储是跨会话的权威；会话投影是每个成员自己重建的副本。两类写入同时进行且保持一致：

- **每次房间变更**（create、join、leave、post、任务流转）都排在唯一的 hub 写链上 —— `team_rooms` 域的唯一写链就是排序权威，因此并发发帖绝不会交错读-改-写，总线 seq 严格按提交顺序铸造。
- **模型可见 ⟺ 已记录**：投递的房间消息走官方收件箱（`agent.followup` 唤醒在线成员；`agent.inject` 在该成员下次启动时交付其积压），因此它会作为持久的 `user/message` 落在该成员自己的会话日志中。
- **共享时间线**以仅日志的 `team-room/fact` 事件镜像到每个成员的日志，携带规范的存储 `timelineSeq`；`teamRoom` 投影折叠每个成员自己的日志，因此视图在每次重开后无需读取存储即可重建。
- **投递至少一次且有序**：每成员游标（`lastDeliveredSeq`、`lastFactSeq`）只在投递落地后才推进，因此提交与投递之间崩溃会在追赶时重投，而不是丢消息。

`Session.append` 早于 `ignorable` 标记的宿主（直至 `0.1.0-rc.8` 的每条已发布 rc 线、`0.1.1-rc.2` 线，以及仅为已存日志读兼容保留该信封字段的 `0.1.2-rc` 线）会在首次追加前被探测出来（先做 peer 版本预检，再对返回信封做一次探测），随后跳过事实追加并给出一次性警告：持久存储、API 界面与模型可见投递照常工作，`teamRoom` 退化为空折叠。`allowUnmarkedFacts: true` 可选回写 —— 故意危险。

## 这不是本插件

| 项目 | 它做什么 | 边界 |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | 在全新 agent 会话中执行定时编码任务 | 它负责任务**何时**运行（调度）。本插件负责多个会话共同操作的**共享对象** —— 没有调度接缝，没有 cron。 |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | 多 agent 仪表盘技能 | 面向展示、以读为主。本插件的房间是**可写的协同状态**：一条总线、一块任务板、需审批的交接，并持久化在 harness 自己的存储中。 |
| `dsh-background-agents` | 后台代理（此前还带团队房间） | 该包的 `bg_*` 部分已被 DSH 原生可续聊子代理取代；它的房间部分就是本包。不要同时挂载两个房间半部。 |

## 权限与数据

- **权限**：workshop 清单声明 `session:append` 与 `tools:register`。房间从不 spawn 子代理，因此本插件不申请任何 `subagent:*` 权限，也不声明子代理依赖。
- **数据**：房间存放在 `team_rooms` 存储域（SQLite 或 JSONL —— 零额外服务）。没有独立数据库，没有网络。
- **会话日志**：`team-room/fact` 事件在尊重该标记的宿主上以信封的 `ignorable: true` 标记追加（早于标记的宿主会被探测并跳过事实追加 —— 见 `allowUnmarkedFacts`）；模型可见的房间投递是真实的 `user/message` 记录。

## 安全边界

- **需审批的交接。** `room_transfer_task` 走官方审批接缝；未组合审批服务或无人批准时 fail-closed —— 被拒时什么都不变。
- **模型可见 ⟺ 已记录。** 每条投递的房间消息都是成员自己日志中的持久 `user/message`；共享时间线以仅日志的 `team-room/fact` 事件镜像。房间消息绝不可能不记录就到达模型。
- **成员身份即授权边界。** 每个 `room_*` 工具都按调用会话自身的成员身份授权；非成员会收到稳定的拒绝，而不是部分写入。
- **保留窗口有界。** 总线、时间线与已完成任务的窗口在每次写入时强制执行，因此长期存活的房间不会无限增长。
- **无调度、无跨机器成员。** 成员是本部署的进程内会话。

## 跨生态入站（P2）

外部代理运行时 —— OpenAI Agents SDK、CrewAI 等 —— 可以通过一个极简的 **stdio 换行分隔 JSON-RPC 2.0 桥接** 发布到团队房间。这是 JSON-RPC 直连最小集，不是官方 ACP 线协议：完整 ACP 兼容要等上游接缝。

用两个 Config 字段启用，并把 `inbound.command` 指向一个在 stdout 上每行输出一条 JSON 通知的启动器：

```yaml
# cordis.yml（插件行）
inbound:
  enabled: true
  command: "python external_runtime.py --room <room-id>"
```

运行时会发出三类通知；`method` 是事件名，`params.name` 是外部 agent 的显示名：

```json
{"jsonrpc":"2.0","method":"agent_started","params":{"name":"researcher","room":"<room-id>","traceId":"t-1"}}
{"jsonrpc":"2.0","method":"agent_message","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","message":"found the failing test"}}
{"jsonrpc":"2.0","method":"agent_finished","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","status":"ok","usage":{"inputTokens":100,"outputTokens":40}}}
```

每条都映射到房间已有的界面：`agent_started` 开一张任务板卡片，`agent_message` 往消息总线发帖，`agent_finished` 关闭卡片并发布结果。非法消息 fail-closed —— 直接丢弃并向 stdin 写回 JSON-RPC 错误。外部运行时不是 DSH 会话，因此由房间属主的成员会话充当发送者；没有属主成员的房间会丢弃该事件。启动与停止由插件 fiber 通过 disposer 持有；无法 spawn 的 `inbound.command` 退化为一条日志警告（桥接保持休眠，其余不受影响）。

## 已知限制

- 房间需要组合存储域；没有 `@deepseek-ai/dsh-storage-domain` 时，`/room` 命令与 `room_*` 工具不可用。
- 房间至少需要两个成员才有意义，成员名册受 `maxMembersPerRoom` 限制；成员身份按会话计，而不是按用户计。
- 没有跨机器成员：每个成员都是本部署的进程内会话。
- `room_transfer_task` 需要审批应答者。没有时会按设计 fail-closed，因此想要自动化交接的 profile 必须组合一个审批服务。
- 成本/用量核算不在这里（那属于后台代理半部）；房间界面报告的是结构，不是开销。

## 开发

```sh
pnpm install        # 仅工具链；harness 包解析到同级 checkout
pnpm run typecheck  # 严格 TS，node + client 两个程序
pnpm test           # vitest：单元、房间 hub、投影与 jsdom 面板测试
pnpm run build      # lib/index.js（node 半部）+ lib/client.js（Web 客户端包）
pnpm run verify:artifacts && pnpm run check:readmes
pnpm run gen-aliases  # checkout 移动后重新映射 harness 包路径
```

`pnpm run pack:smoke` 会构建、打包，并在设置了 `DSH_HARNESS_ROOT` 时把 tarball 安装进一次性 profile，断言组合后的行。

## 主题

`dsh`、`dsh-plugin`、`deepseek-harness`、`team-rooms`、`multi-agent`、`message-bus`、`task-board`、`collaboration`、`cross-session`

## 贡献者

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：团队房间 hub 及其写链、投递游标、`teamRoom` 投影、Web 设置页、文档、CI/CD 与发布。

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


### 从 DSH Desktop 市场安装

所有 PerryLink 插件都能在内置的 DSH Desktop 市场中浏览：**Market → Sources → add source → 粘贴** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ 选中它**。安装仍会经过市场的 npm 身份校验与你的确认。

## 许可证

[Apache License 2.0](LICENSE) © 2026 dsh-team-rooms contributors
