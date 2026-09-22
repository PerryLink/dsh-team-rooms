<div align="center">

# 🏠 dsh-team-rooms
- **Canal da loja 1024**: rode `npm i -g dsh1024` uma vez e então `dsh1024 plugin --profile web add dsh-team-rooms` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Salas de equipe multiagente persistentes e entre sessões para o DeepSeek Harness — membros, um barramento de mensagens, um quadro de tarefas compartilhado e uma linha do tempo compartilhada que sobrevivem a reinícios.**

*Cada membro é uma sessão DSH independente; a sala é o objeto durável compartilhado entre elas.*

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

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

> **Extraído do [`dsh-background-agents`](https://github.com/PerryLink/dsh-background-agents) 0.9.6.** A metade de agentes em segundo plano daquele plugin (`background_agent` e as cinco ferramentas `bg_*`) foi substituída pelos subagentes continuáveis nativos do DSH; a metade de salas de equipe não tinha equivalente nativo e segue viva aqui como pacote próprio. Domínios de armazenamento, logs de sessão e configurações escritos pela 0.9.6 continuam funcionando sem mudanças — veja *Compatibilidade*.

## Compatibilidade

O host `0.1.2-alpha.2` e posteriores falham fechado no vocabulário de eventos de sessão, então este plugin não escreve mais ali seus eventos de fato apenas-log (`team-room/fact`): os fatos vão para o canal de logger/painel e a projeção `teamRoom` degrada para um fold vazio. Linhas rc anteriores (até `0.1.1-rc.2`) mantêm a disciplina do marcador `ignorable`. A metade cliente usa os pacotes cliente atuais (`dsh-api-session-controller`, `dsh-client-ui-slots`, `dsh-client-ui-settings`, `dsh-client-locale`, `dsh-client-web`).

**A compatibilidade de dados com o `dsh-background-agents` 0.9.6 é regra dura.** Estas strings são idênticas byte a byte às da 0.9.6 e nunca devem ser renomeadas: o domínio de armazenamento `team_rooms`, a chave de projeção `teamRoom`, o tipo de evento de sessão `team-room/fact` e o id de slot de configurações `team-rooms`. Por isso um perfil existente mantém suas salas, os logs de seus membros e sua página de configurações ao trocar o plugin.

| Superfície | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.6-alpha.2` (verificado em 2026-09-18; dev e runtime fixam `0.1.5-rc.2`, peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Todas (ferramentas de host; a página de configurações precisa da metade cliente Web e da capacidade de domínio de armazenamento) |
| Modelo | Qualquer (salas não carregam rota de modelo — membros são sessões comuns) |

## O que você recebe

O `dsh-team-rooms` transforma várias sessões independentes em uma equipe coordenada:

1. **A família de comandos `/room`** — `create`, `join`, `leave`, `list`, `send`, `tasks`, `task add|assign|claim|done|delete`. Salas têm nome, dono e são endereçadas por um id estável que você pode colar em outra sessão.
2. **Oito ferramentas `room_*`** — `room_list_rooms`, `room_post`, `room_read`, `room_list_tasks`, `room_create_task`, `room_claim_task`, `room_transfer_task`, `room_complete_task`. O modelo trabalha o quadro compartilhado e o barramento de dentro da própria sessão; `room_transfer_task` pede aprovação antes de uma transferência entre membros.
3. **Um armazenamento de salas durável** — membros, o barramento de mensagens (direcionado ou broadcast), o quadro de tarefas e a linha do tempo vivem no domínio de armazenamento `team_rooms` (backend SQLite ou JSONL — a implantação escolhe; o plugin não adiciona serviço próprio) e se recuperam após reiniciar o DSH.
4. **Uma página de configurações Web** — a seção Team Rooms mostra o estado dos membros, o quadro de tarefas e a linha do tempo de cada sala da sessão atual, lidos da projeção de sessão `teamRoom` e escritos de volta pelo comando `/room` do host.

## Início rápido

```sh
# 1. instale o bundle no seu perfil
dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"

# ou pelo npm (versões publicadas)
dsh plugin --profile web add dsh-team-rooms

# 2. reinicie e verifique a linha
dsh --profile web --dump-config | grep -A4 'id: team-rooms'
```

O patch do bundle traz a linha do plugin; nenhuma chave de Config é obrigatória. O repositório versiona sua saída de build (`lib/`), então instalações por git não precisam compilar. As salas montam onde o domínio de armazenamento é composto (`@deepseek-ai/dsh-storage-domain`, presente em todo perfil `@deepseek-ai/dsh-base`); sem ele, o comando `/room` e as ferramentas `room_*` ficam dormentes e o resto continua carregando.

Depois, dentro de qualquer sessão:

```
/room create release-prep
/room send <roomId> kickoff: I own the changelog, who takes the docs?
/room task add <roomId> draft the migration note
/room task claim <roomId> <taskId>
```

Cole o id de sala impresso em outra sessão e rode `/room join <roomId>`: essa sessão passa a ser membro, recebe as entregas da sala como mensagens comuns e vê o mesmo quadro.

## Instalar e desinstalar

- **canal git** (último `main`): `dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"` — `lib/` versionado, sem passos `prepare` ou `allowBuilds`.
- **canal npm** (versões publicadas): `dsh plugin --profile web add dsh-team-rooms`.
- **canal tarball**: `pnpm pack` neste repositório e depois `dsh plugin --profile web add ./dsh-team-rooms-<version>.tgz`.
- **desinstalar**: `dsh plugin --profile web remove dsh-team-rooms` (ou remova a linha do patch do perfil). Suas salas permanecem no domínio de armazenamento `team_rooms` e voltam se você reinstalar.
- ⚠️ **Não monte este pacote e o `dsh-background-agents` ao mesmo tempo.** Durante a janela de depreciação ambos estão publicados, e os dois registram as mesmas oito ferramentas `room_*`, o mesmo id de slot `settings.section` (`team-rooms`) e o mesmo domínio de armazenamento `team_rooms`, então as duas metades de salas colidem. Se você já usa `dsh-background-agents`, remova-o primeiro (`dsh plugin --profile web remove dsh-background-agents`). Suas salas sobrevivem de qualquer forma: elas vivem no domínio de armazenamento, não no plugin.

## Configuração

Cada ajuste é um campo `Config` validado por Schemastery — mude no cordis.yml, nunca no código. Nenhum é obrigatório.

| Chave | Padrão | Significado |
|---|---|---|
| `maxRooms` | `16` | Teto de salas de equipe em todo o perfil |
| `maxMembersPerRoom` | `8` | Teto de membros por sala (`>= 2`) |
| `maxRoomsPerMember` | `4` | Teto de salas que uma sessão membro pode entrar |
| `busRetention` | `200` | Mensagens do barramento mantidas por sala |
| `timelineRetention` | `500` | Eventos de linha do tempo mantidos por sala |
| `taskRetention` | `50` | Tarefas concluídas mantidas por sala |
| `maxMessageChars` | `4000` | Teto do texto de uma mensagem de sala (acima disso é rejeitada, nunca truncada) |
| `injectRoomBrief` | `true` | Injetar o breve resumo da sala nas sessões membro (entrada + retomada) |
| `roomOpenTimeoutMs` | `15000` | Quanto a abertura do domínio `team_rooms` pode demorar antes de toda operação de sala falhar alto (`store-unavailable`) em vez de travar |
| `allowUnmarkedFacts` | `false` | Forçar os eventos `team-room/fact` apenas-log em hosts que descartam o marcador `ignorable` (perigoso: fatos sem marca tornam sessões irrecuperáveis em outros hosts); o padrão detecta e pula |
| `inbound.enabled` | `false` | Habilita a ponte de entrada stdio JSON-RPC para runtimes de agentes externos (OpenAI Agents SDK / CrewAI). Desabilitada por padrão (fail-closed). |
| `inbound.command` | *(nenhum)* | Comando de lançamento do runtime externo; quando habilitado e presente, o plugin o inicia e escuta notificações JSON-RPC delimitadas por quebra de linha. Ausente/não iniciável = a ponte fica dormente (registrado em log). |

## Ferramentas e superfícies

| Superfície | Tipo | Notas |
|---|---|---|
| `/room` | command | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` | tool | Cada sala desta sessão: ids, nomes, elencos, contagens de tarefas |
| `room_post` | tool | Publicar no barramento (broadcast, ou direcionado com `to`) |
| `room_read` | tool | Ler o histórico do barramento de uma sala, a partir de um cursor de seq |
| `room_list_tasks` | tool | O quadro de tarefas compartilhado de uma sala |
| `room_create_task` | tool | Adicionar uma linha ao quadro (opcionalmente atribuída) |
| `room_claim_task` | tool | Reivindicar uma linha para esta sessão (responsável + em andamento) |
| `room_transfer_task` | tool | Passar uma linha a outro membro — **com aprovação**, falha fechado |
| `room_complete_task` | tool | Marcar uma linha como `done` |
| projeção `teamRoom` | session projection | A visão da sala dobrada a partir dos eventos `team-room/fact` no log do próprio membro |
| página de configurações Web | client | Estado dos membros, quadro de tarefas, linha do tempo e ações da sala; id de slot `team-rooms` |

São **oito** ferramentas `room_*`, todas registradas quando o domínio de armazenamento está composto.

## Como funciona — e por que sobrevive a reinícios

O armazenamento de salas é a autoridade entre sessões; a projeção de sessão é a cópia reconstruída de cada membro. Duas escritas acontecem ao mesmo tempo e permanecem consistentes:

- **Toda mutação de sala** (create, join, leave, post, transições de tarefa) entra em UMA cadeia de escrita do hub — a cadeia única do domínio `team_rooms` é a autoridade de ordenação, então publicadores concorrentes nunca intercalam um ler-modificar-escrever e os seq do barramento são cunhados estritamente na ordem de commit.
- **Visível ao modelo ⟺ registrado**: uma mensagem de sala entregue é uma entrega oficial na caixa de entrada (`agent.followup` acorda um membro vivo; `agent.inject` entrega o acumulado a um membro offline no próximo início), então ela cai como um `user/message` durável no log do próprio membro.
- **A linha do tempo compartilhada** se espelha no log de cada membro como eventos `team-room/fact` apenas-log que carregam o `timelineSeq` canônico do armazenamento; a projeção `teamRoom` dobra o log de cada membro, então a visão se reconstrói a cada reabertura sem ler o armazenamento.
- **A entrega é ao-menos-uma-vez e ordenada**: os cursores por membro (`lastDeliveredSeq`, `lastFactSeq`) avançam só depois que uma entrega chega, então uma queda entre commit e entrega reentrega na recuperação em vez de perder a mensagem.

Hosts cujo `Session.append` precede o marcador `ignorable` (todas as linhas rc publicadas até `0.1.0-rc.8`, a linha `0.1.1-rc.2` e a linha `0.1.2-rc`, que mantém o campo do envelope apenas para compatibilidade de leitura de logs já gravados) são detectados antes da primeira escrita (pré-checagem de versão do peer e então uma sondagem do envelope devolvido) e as escritas de fato são puladas com um aviso único: o armazenamento durável, as superfícies de API e as entregas visíveis ao modelo continuam funcionando, e o `teamRoom` degrada para um fold vazio. `allowUnmarkedFacts: true` reativa a escrita — deliberadamente perigoso.

## Não é este plugin

| Projeto | O que faz | A fronteira |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | Tarefas de codificação agendadas em sessões de agente novas | Ele é dono de **quando** as tarefas rodam (agendamento). Este plugin é dono do **objeto compartilhado** sobre o qual várias sessões trabalham — sem costura de agendador, sem cron. |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | Skill de painel multiagente | Voltado a exibição e majoritariamente leitura. As salas deste plugin são **estado de coordenação gravável**: um barramento, um quadro e transferências com aprovação, persistidos no armazenamento do próprio harness. |
| `dsh-background-agents` | Agentes em segundo plano e (antes) salas de equipe | A metade `bg_*` daquele pacote foi substituída pelos subagentes continuáveis nativos do DSH; sua metade de salas é este pacote. Não monte as duas metades de salas ao mesmo tempo. |

## Permissões e dados

- **Permissões**: o manifesto do workshop declara `session:append` e `tools:register`. Salas nunca iniciam um subagente, então o plugin não pede nenhuma permissão `subagent:*` nem declara dependência de subagente.
- **Dados**: as salas vivem no domínio de armazenamento `team_rooms` (SQLite ou JSONL — zero serviços extras). Sem banco separado, sem rede.
- **Log de sessão**: eventos `team-room/fact` são gravados com o marcador `ignorable: true` do envelope nos hosts que o respeitam (hosts anteriores ao marcador são detectados e as escritas são puladas — veja `allowUnmarkedFacts`); as entregas de sala visíveis ao modelo são registros `user/message` reais.

## Limites de segurança

- **Transferências com aprovação.** `room_transfer_task` passa pela costura oficial de aprovação e falha fechado quando não há serviço de aprovação composto ou ninguém concede — nada muda em uma recusa.
- **Visível ao modelo ⟺ registrado.** Cada mensagem de sala entregue é um `user/message` durável no log do próprio membro; a linha do tempo compartilhada se espelha como eventos `team-room/fact` apenas-log. Uma mensagem de sala nunca pode chegar a um modelo sem ser registrada.
- **A participação é a fronteira de autorização.** Cada ferramenta `room_*` autoriza contra a participação da própria sessão chamadora; quem não é membro recebe uma rejeição estável, não uma escrita parcial.
- **A retenção é limitada.** As janelas do barramento, da linha do tempo e das tarefas concluídas são aplicadas a cada escrita, então uma sala longeva não cresce sem limite.
- **Sem agendamento e sem membros entre máquinas.** Um membro é uma sessão local ao processo desta implantação.

## Entrada entre ecossistemas (P2)

Runtimes de agentes externos — OpenAI Agents SDK, CrewAI e similares — podem publicar em uma sala de equipe por meio de uma **ponte stdio JSON-RPC 2.0 delimitada por quebra de linha**. É um conjunto mínimo de conexão direta JSON-RPC, não o protocolo oficial de fio ACP: a compatibilidade ACP completa espera a costura upstream.

Habilite com dois campos de Config e aponte `inbound.command` para um lançador que emita uma notificação JSON por linha no stdout:

```yaml
# cordis.yml (linha do plugin)
inbound:
  enabled: true
  command: "python external_runtime.py --room <room-id>"
```

O runtime emite três tipos de notificação; `method` é o nome do evento e `params.name` é o nome de exibição do agente externo:

```json
{"jsonrpc":"2.0","method":"agent_started","params":{"name":"researcher","room":"<room-id>","traceId":"t-1"}}
{"jsonrpc":"2.0","method":"agent_message","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","message":"found the failing test"}}
{"jsonrpc":"2.0","method":"agent_finished","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","status":"ok","usage":{"inputTokens":100,"outputTokens":40}}}
```

Cada uma mapeia para as superfícies já existentes da sala: `agent_started` abre um cartão no quadro, `agent_message` publica no barramento e `agent_finished` fecha o cartão e publica o resultado. Mensagens inválidas falham fechado — são descartadas e um erro JSON-RPC é escrito de volta. Runtimes externos não são sessões DSH, então a sessão membro dona da sala atua como remetente; uma sala sem membro dono descarta o evento. Início e parada pertencem à fibra do plugin por meio de um disposer; um `inbound.command` não iniciável degrada para um aviso em log (a ponte fica dormente, nada mais é afetado).

## Limitações conhecidas

- Salas exigem o domínio de armazenamento composto; sem `@deepseek-ai/dsh-storage-domain`, o comando `/room` e as ferramentas `room_*` ficam desabilitados.
- Uma sala precisa de ao menos dois membros para ser interessante, e o elenco é limitado por `maxMembersPerRoom`; a participação é por sessão, não por usuário.
- Não há participação entre máquinas: cada membro é uma sessão local ao processo desta implantação.
- `room_transfer_task` precisa de um respondedor de aprovação. Sem ele falha fechado por design, então perfis automatizados que queiram transferências precisam compor um serviço de aprovação.
- Contabilidade de custo/uso está fora de escopo aqui (isso vivia na metade de agentes em segundo plano); as superfícies de sala informam estrutura, não gasto.

## Desenvolvimento

```sh
pnpm install        # só ferramentas; pacotes do harness resolvem contra um checkout irmão
pnpm run typecheck  # TS estrito, programas node + cliente
pnpm test           # vitest: testes unitários, de hub de salas, de projeção e de painel jsdom
pnpm run build      # lib/index.js (metade node) + lib/client.js (bundle cliente web)
pnpm run verify:artifacts && pnpm run check:readmes
pnpm run gen-aliases  # remapeia os caminhos do harness depois que o checkout se move
```

`pnpm run pack:smoke` compila, empacota e (com `DSH_HARNESS_ROOT` definido) instala o tarball em um perfil descartável para verificar a linha composta.

## Tópicos

`dsh`, `dsh-plugin`, `deepseek-harness`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`, `cross-session`

## Contribuidores

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor: o hub de salas de equipe e sua cadeia de escrita, os cursores de entrega, a projeção `teamRoom`, a página de configurações Web, documentação, CI/CD e releases.

## Família de Plugins DSH PerryLink

Este projeto é um dos [42 plugins do DeepSeek Harness](https://github.com/PerryLink) mantidos por [PerryLink](https://github.com/PerryLink). Se este ajuda você, os outros provavelmente também:

| Plugin | Uma linha |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Auto-revisão por segundo modelo na cadeia de aprovação, fail-closed por padrão | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Governança de custos para o DeepSeek Harness: orçamentos, carbono e latência em um painel | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Equivalente ao /rewind do Claude Code: snapshots, bifurcações de sessão, restauração em um passo | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migra sessões, memória, skills e CLAUDE.md do Claude Code para o DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Controle nativo de desktop multiplataforma para o DeepSeek Harness — Windows primeiro | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Histórico de entrada estilo terminal para o compositor web: setas, busca Ctrl+R | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Verificações de qualidade de datasets e cruzamento de citações | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Defesa contra injeção de prompt, jailbreak e vazamento de segredos para o DeepSeek Harness | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Guarda de disciplina de engenharia: interrogatório de requisitos, portões de teste, revisão adversária | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Roteamento unificado de geração de imagens estáticas para o DeepSeek Harness | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Diagnóstico de desempenho somente leitura para o DeepSeek Harness | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Relatórios de pesquisa determinísticos para fundos mútuos públicos chineses | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | Integração de PR/issues do GitHub para o DSH, toda escrita com aprovação | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Orquestração de pesquisa setorial que sela seus entregáveis via `ctx.researchReport.assemble` | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Base de conhecimento de documentos locais para o DeepSeek Harness | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Integração de modelos locais (Ollama) para o DeepSeek Harness | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | Diagnósticos, formatação, completude, ações de código e renomeação LSP sobre servidores de linguagem | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | Middleware de mascaramento de PII: anonimiza na fronteira do modelo, restaura na camada de exibição | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Painel de runtime MCP somente leitura: comando /mcp + aba de configurações com estado, ferramentas e erros | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Memória entre sessões com aprovação: costura ctx.memory + SQLite + ferramenta memory | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | Exportador de observabilidade OpenTelemetry e Langfuse para o DeepSeek Harness | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Troca de estilo em runtime equivalente ao outputStyles do Claude Code | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Regras declarativas de permissão allow/deny/ask no estilo Claude Code com auditoria | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Base de conhecimento de desenvolvimento de plugins como skill sob demanda | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Ponte multicanal de aprovações/perguntas: WeChat/Telegram/Feishu, console de sessão | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Motor de relatórios de pesquisa verificáveis: livro de evidências endereçado por conteúdo e versões seladas | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Pontuação de qualidade multidimensional para plugins do DeepSeek Harness | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Fixa sessões na barra lateral Web com ordenação durável | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Sincronização de sessões entre dispositivos para o DeepSeek Harness — um espelho git dedicado do seu armazenamento de sessões | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Pacote de skills de auditoria de segurança: varredura de segredos, revisão de dependências e cadeia de suprimentos | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Loop de sessão por voz para o DeepSeek Harness: fale com ele e ouça a resposta | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Testes isolados de instalação e smoke para plugins do DeepSeek Harness | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | Ponte de tarefas TickTick/Dida365: painel no cabeçalho da sessão + 11 ferramentas | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Tradução de parâmetros de fornecedor e reparo determinístico de JSON para o DeepSeek Harness | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-kit](https://github.com/PerryLink/dsh-kit)** | One-command starter pack that installs the core family | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-portal](https://github.com/PerryLink/dsh-plugin-portal)** | Zero-dependency static portal rendering the whole plugin family as one page | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink são navegáveis no mercado embutido do DSH Desktop: **Market → Sources → add source → cole** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecione**. A instalação ainda passa pela verificação de identidade npm do mercado e pela sua confirmação.

## Licença

[Apache License 2.0](LICENSE) © 2026 dsh-team-rooms contributors
