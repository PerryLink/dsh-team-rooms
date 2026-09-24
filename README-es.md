<div align="center">

# 🏠 dsh-team-rooms
- **Canal de la tienda 1024**: ejecuta `npm i -g dsh1024` una vez y luego `dsh1024 plugin --profile web add dsh-team-rooms` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Salas de equipo multiagente persistentes y entre sesiones para DeepSeek Harness — miembros, un bus de mensajes, un tablero de tareas compartido y una línea de tiempo compartida que sobreviven a los reinicios.**

*Cada miembro es una sesión DSH independiente; la sala es el objeto duradero compartido entre ellas.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-team-rooms.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-team-rooms)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-team-rooms/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-team-rooms/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-team-rooms?label=version)](https://github.com/PerryLink/dsh-team-rooms/releases)
[![npm version](https://img.shields.io/npm/v/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)
[![npm downloads](https://img.shields.io/npm/dm/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-team-rooms?metric=downloads&lang=es)](https://dshfind.com/es/plugins/PerryLink/dsh-team-rooms?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

> **Extraído de [`dsh-background-agents`](https://github.com/PerryLink/dsh-background-agents) 0.9.6.** La mitad de agentes en segundo plano de ese plugin (`background_agent` y las cinco herramientas `bg_*`) queda superada por los subagentes continuables nativos de DSH; la mitad de salas de equipo no tenía equivalente nativo y continúa aquí como paquete propio. Los dominios de almacenamiento, los registros de sesión y los ajustes escritos por 0.9.6 siguen funcionando sin cambios — ver *Compatibilidad*.

## Compatibilidad

El host `0.1.2-alpha.2` y posteriores fallan cerrado ante el vocabulario de eventos de sesión, así que este plugin ya no escribe allí sus eventos de hecho solo-registro (`team-room/fact`): los hechos van al canal de logger/panel y la proyección `teamRoom` se degrada a un pliegue vacío. Las líneas rc anteriores (hasta `0.1.1-rc.2`) mantienen la disciplina del marcador `ignorable`. La mitad cliente usa los paquetes cliente actuales (`dsh-api-session-controller`, `dsh-client-ui-slots`, `dsh-client-ui-settings`, `dsh-client-locale`, `dsh-client-web`).

**La compatibilidad de datos con `dsh-background-agents` 0.9.6 es una regla dura.** Estas cadenas son idénticas byte a byte a las de 0.9.6 y nunca deben renombrarse: el dominio de almacenamiento `team_rooms`, la clave de proyección `teamRoom`, el tipo de evento de sesión `team-room/fact` y el id de ranura de ajustes `team-rooms`. Por eso un perfil existente conserva sus salas, los registros de sus miembros y su página de ajustes al cambiar el plugin.

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-rc.1` (verificado el 2026-09-24; dev y runtime fijan `0.1.7-rc.1`, peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (herramientas de host; la página de ajustes necesita la mitad cliente Web y la capacidad de dominio de almacenamiento) |
| Modelo | Cualquiera (las salas no llevan ruta de modelo — los miembros son sesiones ordinarias) |

## Qué obtienes

`dsh-team-rooms` convierte varias sesiones independientes en un equipo coordinado:

1. **La familia de comandos `/room`** — `create`, `join`, `leave`, `list`, `send`, `tasks`, `task add|assign|claim|done|delete`. Las salas tienen nombre, dueño y se direccionan con un id estable que puedes pegar en otra sesión.
2. **Ocho herramientas `room_*`** — `room_list_rooms`, `room_post`, `room_read`, `room_list_tasks`, `room_create_task`, `room_claim_task`, `room_transfer_task`, `room_complete_task`. El modelo trabaja el tablero compartido y el bus desde su propia sesión; `room_transfer_task` pide aprobación antes de un traspaso entre miembros.
3. **Un almacén de salas duradero** — miembros, el bus de mensajes (dirigido o difundido), el tablero de tareas y la línea de tiempo viven en el dominio de almacenamiento `team_rooms` (backend SQLite o JSONL — lo elige el despliegue; el plugin no añade ningún servicio propio) y se recuperan tras reiniciar DSH.
4. **Una página de ajustes Web** — la sección Team Rooms muestra el estado de los miembros, el tablero de tareas y la línea de tiempo de cada sala a la que pertenece la sesión actual, leídos de la proyección de sesión `teamRoom` y escritos de vuelta por el comando `/room` del host.

## Inicio rápido

```sh
# 1. instala el bundle en tu perfil
dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"

# o desde npm (versiones publicadas)
dsh plugin --profile web add dsh-team-rooms

# 2. reinicia y verifica la fila
dsh --profile web --dump-config | grep -A4 'id: team-rooms'
```

El parche del bundle incluye la fila del plugin; no hay ninguna clave de Config obligatoria. El repositorio confirma su salida de compilación (`lib/`), así que las instalaciones por git no necesitan compilar. Las salas se montan donde se compone el dominio de almacenamiento (`@deepseek-ai/dsh-storage-domain`, presente en todo perfil `@deepseek-ai/dsh-base`); sin él, el comando `/room` y las herramientas `room_*` quedan inactivos mientras todo lo demás sigue cargando.

Después, dentro de cualquier sesión:

```
/room create release-prep
/room send <roomId> kickoff: I own the changelog, who takes the docs?
/room task add <roomId> draft the migration note
/room task claim <roomId> <taskId>
```

Pega el id de sala impreso en otra sesión y ejecuta `/room join <roomId>`: esa sesión pasa a ser miembro, recibe las entregas de la sala como mensajes normales y ve el mismo tablero.

## Instalación y desinstalación

- **canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"` — `lib/` confirmado, sin pasos `prepare` ni `allowBuilds`.
- **canal npm** (versiones publicadas): `dsh plugin --profile web add dsh-team-rooms`.
- **canal tarball**: `pnpm pack` en este repositorio y luego `dsh plugin --profile web add ./dsh-team-rooms-<version>.tgz`.
- **desinstalar**: `dsh plugin --profile web remove dsh-team-rooms` (o quita la fila del parche del perfil). Tus salas permanecen en el dominio de almacenamiento `team_rooms` y vuelven si reinstalas.
- ⚠️ **No montes este paquete y `dsh-background-agents` a la vez.** Durante la ventana de deprecación ambos están publicados, y los dos registran las mismas ocho herramientas `room_*`, el mismo id de slot `settings.section` (`team-rooms`) y el mismo dominio de almacenamiento `team_rooms`, así que las dos mitades de salas chocan. Si ya usas `dsh-background-agents`, quítalo primero (`dsh plugin --profile web remove dsh-background-agents`). Tus salas sobreviven en cualquier caso: viven en el dominio de almacenamiento, no en el plugin.

## Configuración

Cada ajuste es un campo `Config` validado por Schemastery — cámbialo en cordis.yml, nunca en el código. Ninguno es obligatorio.

| Clave | Predeterminado | Significado |
|---|---|---|
| `maxRooms` | `16` | Tope de salas de equipo en todo el perfil |
| `maxMembersPerRoom` | `8` | Tope de miembros por sala (`>= 2`) |
| `maxRoomsPerMember` | `4` | Tope de salas a las que puede unirse una sesión miembro |
| `busRetention` | `200` | Mensajes del bus conservados por sala |
| `timelineRetention` | `500` | Eventos de línea de tiempo conservados por sala |
| `taskRetention` | `50` | Tareas completadas conservadas por sala |
| `maxMessageChars` | `4000` | Tope del texto de un mensaje de sala (por encima se rechaza, nunca se trunca) |
| `injectRoomBrief` | `true` | Inyectar el breve resumen de la sala en las sesiones miembro (al unirse y al reanudar) |
| `roomOpenTimeoutMs` | `15000` | Cuánto puede tardar la apertura del dominio de almacenamiento `team_rooms` antes de que toda operación de sala falle en voz alta (`store-unavailable`) en lugar de colgarse |
| `allowUnmarkedFacts` | `false` | Forzar los eventos `team-room/fact` solo-registro en hosts que descartan el marcador `ignorable` (peligroso: los hechos sin marcar vuelven las sesiones irrecuperables en otros hosts); por defecto se detecta y se omite |
| `inbound.enabled` | `false` | Habilita el puente de entrada stdio JSON-RPC para runtimes de agentes externos (OpenAI Agents SDK / CrewAI). Deshabilitado por defecto (fail-closed). |
| `inbound.command` | *(ninguno)* | Comando de lanzamiento del runtime externo; cuando está habilitado y presente, el plugin lo lanza y escucha notificaciones JSON-RPC delimitadas por saltos de línea. Ausente/no lanzable = el puente queda inactivo (registrado). |

## Herramientas y superficies

| Superficie | Tipo | Notas |
|---|---|---|
| `/room` | command | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` | tool | Cada sala a la que pertenece esta sesión: ids, nombres, plantillas, conteos de tareas |
| `room_post` | tool | Publicar en el bus (difundido, o dirigido con `to`) |
| `room_read` | tool | Leer el historial del bus de una sala, desde un cursor de seq |
| `room_list_tasks` | tool | El tablero de tareas compartido de una sala |
| `room_create_task` | tool | Añadir una fila al tablero (opcionalmente asignada) |
| `room_claim_task` | tool | Reclamar una fila para esta sesión (asignado + en progreso) |
| `room_transfer_task` | tool | Pasar una fila a otro miembro — **con aprobación**, falla cerrado |
| `room_complete_task` | tool | Marcar una fila como `done` |
| proyección `teamRoom` | session projection | La vista de sala plegada desde los eventos `team-room/fact` en el registro propio de este miembro |
| página de ajustes Web | client | Estado de miembros, tablero de tareas, línea de tiempo y acciones de sala; id de ranura `team-rooms` |

Son **ocho** herramientas `room_*`, todas registradas cuando el dominio de almacenamiento está compuesto.

## Cómo funciona — y por qué sobrevive a los reinicios

El almacén de salas es la autoridad entre sesiones; la proyección de sesión es la copia reconstruida de cada miembro. Dos escrituras ocurren a la vez y se mantienen consistentes:

- **Cada mutación de sala** (create, join, leave, post, transiciones de tareas) se encola en UNA cadena de escritura del hub — la cadena única del dominio `team_rooms` es la autoridad de orden, así que dos publicadores concurrentes nunca pueden intercalar una lectura-modificación-escritura y los seq del bus se acuñan estrictamente en orden de commit.
- **Visible para el modelo ⟺ registrado**: un mensaje de sala entregado es una entrega oficial a la bandeja (`agent.followup` despierta a un miembro en vivo; `agent.inject` entrega su acumulado a un miembro desconectado en el siguiente arranque), de modo que queda como un `user/message` duradero en el registro propio de ese miembro.
- **La línea de tiempo compartida** se refleja en el registro de cada miembro como eventos `team-room/fact` solo-registro que llevan el `timelineSeq` canónico del almacén; la proyección `teamRoom` pliega el registro propio de cada miembro, así que la vista se reconstruye en cada reapertura sin leer el almacén.
- **La entrega es al-menos-una-vez y ordenada**: los cursores por miembro (`lastDeliveredSeq`, `lastFactSeq`) avanzan solo cuando una entrega aterriza, así que una caída entre commit y entrega reentrega en la recuperación en lugar de perder el mensaje.

Los hosts cuyo `Session.append` precede al marcador `ignorable` (todas las líneas rc publicadas hasta `0.1.0-rc.8`, la línea `0.1.1-rc.2` y la línea `0.1.2-rc`, que conserva el campo del sobre solo para compatibilidad de lectura de registros ya guardados) se detectan antes de la primera escritura (precomprobación de versión del peer y luego una sonda del sobre devuelto) y las escrituras de hechos se omiten con un aviso único: el almacén duradero, las superficies de API y las entregas visibles para el modelo siguen funcionando, y `teamRoom` se degrada a un pliegue vacío. `allowUnmarkedFacts: true` reactiva la escritura — deliberadamente peligroso.

## No es este plugin

| Proyecto | Qué hace | La frontera |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tareas de codificación programadas en sesiones de agente nuevas | Posee **cuándo** se ejecutan las tareas (planificación). Este plugin posee el **objeto compartido** sobre el que trabajan varias sesiones — sin costura de planificador, sin cron. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Skill de panel multiagente | Orientado a mostrar y mayormente de lectura. Las salas de este plugin son **estado de coordinación escribible**: un bus, un tablero y traspasos con aprobación, persistidos en el almacenamiento propio del harness. |
| `dsh-background-agents` | Agentes en segundo plano y (antes) salas de equipo | La mitad `bg_*` de ese paquete queda superada por los subagentes continuables nativos de DSH; su mitad de salas es este paquete. No montes las dos mitades de salas a la vez. |

## Permisos y datos

- **Permisos**: el manifiesto del workshop declara `session:append` y `tools:register`. Las salas nunca lanzan un subagente, así que el plugin no pide ningún permiso `subagent:*` ni declara dependencia de subagentes.
- **Datos**: las salas viven en el dominio de almacenamiento `team_rooms` (SQLite o JSONL — cero servicios extra). Sin base de datos aparte, sin red.
- **Registro de sesión**: los eventos `team-room/fact` se escriben con el marcador `ignorable: true` del sobre en los hosts que lo respetan (los hosts anteriores al marcador se detectan y se omiten las escrituras — ver `allowUnmarkedFacts`); las entregas de sala visibles para el modelo son registros `user/message` reales.

## Límites de seguridad

- **Traspasos con aprobación.** `room_transfer_task` pasa por la costura oficial de aprobación y falla cerrado cuando no hay servicio de aprobación compuesto o nadie concede: nada cambia ante un rechazo.
- **Visible para el modelo ⟺ registrado.** Cada mensaje de sala entregado es un `user/message` duradero en el registro propio del miembro; la línea de tiempo compartida se refleja como eventos `team-room/fact` solo-registro. Un mensaje de sala nunca puede llegar a un modelo sin quedar registrado.
- **La pertenencia es la frontera de autorización.** Cada herramienta `room_*` autoriza contra la pertenencia de la propia sesión llamante; quien no es miembro recibe un rechazo estable, no una escritura parcial.
- **La retención está acotada.** Las ventanas del bus, la línea de tiempo y las tareas hechas se aplican en cada escritura, así que una sala longeva no puede crecer sin límite.
- **Sin planificación ni miembros entre máquinas.** Un miembro es una sesión local al proceso de este despliegue.

## Entrada entre ecosistemas (P2)

Los runtimes de agentes externos — OpenAI Agents SDK, CrewAI y similares — pueden publicar en una sala de equipo mediante un **puente stdio JSON-RPC 2.0 delimitado por saltos de línea**. Es un conjunto mínimo de conexión directa JSON-RPC, no el protocolo oficial de cable ACP: la compatibilidad ACP completa espera a la costura upstream.

Actívalo con dos campos de Config y apunta `inbound.command` a un lanzador que emita una notificación JSON por línea en stdout:

```yaml
# cordis.yml (fila del plugin)
inbound:
  enabled: true
  command: "python external_runtime.py --room <room-id>"
```

El runtime emite tres tipos de notificación; `method` es el nombre del evento y `params.name` es el nombre visible del agente externo:

```json
{"jsonrpc":"2.0","method":"agent_started","params":{"name":"researcher","room":"<room-id>","traceId":"t-1"}}
{"jsonrpc":"2.0","method":"agent_message","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","message":"found the failing test"}}
{"jsonrpc":"2.0","method":"agent_finished","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","status":"ok","usage":{"inputTokens":100,"outputTokens":40}}}
```

Cada una se mapea a las superficies existentes de la sala: `agent_started` abre una tarjeta en el tablero, `agent_message` publica en el bus de mensajes y `agent_finished` cierra la tarjeta y publica el resultado. Los mensajes inválidos fallan cerrado — se descartan y se escribe un error JSON-RPC de vuelta. Los runtimes externos no son sesiones DSH, así que la sesión miembro dueña de la sala actúa como remitente; una sala sin miembro dueño descarta el evento. El arranque y la parada los posee la fibra del plugin mediante un disposer; un `inbound.command` no lanzable se degrada a un aviso registrado (el puente queda inactivo, nada más se ve afectado).

## Limitaciones conocidas

- Las salas requieren que el dominio de almacenamiento esté compuesto; sin `@deepseek-ai/dsh-storage-domain`, el comando `/room` y las herramientas `room_*` quedan deshabilitados.
- Una sala necesita al menos dos miembros para ser interesante, y la plantilla está acotada por `maxMembersPerRoom`; la pertenencia es por sesión, no por usuario.
- No hay pertenencia entre máquinas: cada miembro es una sesión local al proceso de este despliegue.
- `room_transfer_task` necesita un respondedor de aprobación. Sin él falla cerrado por diseño, así que los perfiles automatizados que quieran traspasos deben componer un servicio de aprobación.
- La contabilidad de coste/uso queda fuera de alcance aquí (eso vivía en la mitad de agentes en segundo plano); las superficies de sala informan estructura, no gasto.

## Desarrollo

```sh
pnpm install        # solo herramientas; los paquetes del harness se resuelven contra un checkout hermano
pnpm run typecheck  # TS estricto, programas node + cliente
pnpm test           # vitest: pruebas unitarias, de hub de salas, de proyección y de panel jsdom
pnpm run build      # lib/index.js (mitad node) + lib/client.js (bundle cliente web)
pnpm run verify:artifacts && pnpm run check:readmes
pnpm run gen-aliases  # vuelve a mapear las rutas del harness si el checkout se mueve
```

`pnpm run pack:smoke` compila, empaqueta y (con `DSH_HARNESS_ROOT` definido) instala el tarball en un perfil desechable para comprobar la fila compuesta.

## Temas

`dsh`, `dsh-plugin`, `deepseek-harness`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`, `cross-session`

## Contribuidores

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor: el hub de salas de equipo y su cadena de escritura, los cursores de entrega, la proyección `teamRoom`, la página de ajustes Web, documentación, CI/CD y publicaciones.

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink se pueden explorar en el mercado integrado de DSH Desktop: **Market → Sources → add source → pega** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecciónalo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.

## Licencia

[Apache License 2.0](LICENSE) © 2026 dsh-team-rooms contributors


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
