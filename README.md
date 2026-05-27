<div align="center">

# Aurora Stack

### Transforme qualquer Linux em uma infraestrutura inteligente.

CLI brasileiro de provisionamento de servidores com **Docker Swarm + Traefik + 95 stacks pré-configuradas + IA conversacional opcional**.

<p>
  <a href="https://www.npmjs.com/package/@aurorabr/stack"><img alt="npm" src="https://img.shields.io/npm/v/@aurorabr/stack?color=21958F&label=npm&logo=npm&logoColor=white"></a>
  <a href="https://github.com/adeiltonpessini/aurora-stack/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-Elastic_v2-21958F.svg"></a>
  <a href="#status"><img alt="status" src="https://img.shields.io/badge/status-alpha-f59e0b.svg"></a>
  <a href="https://github.com/adeiltonpessini/aurora-stack/actions"><img alt="ci" src="https://img.shields.io/github/actions/workflow/status/adeiltonpessini/aurora-stack/ci.yml?branch=main&label=CI&logo=github"></a>
  <img alt="node" src="https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white">
</p>

<p>
  <a href="#instalação-rápida">Instalação</a> ·
  <a href="#comandos">Comandos</a> ·
  <a href="#catálogo-de-stacks">Catálogo</a> ·
  <a href="#diferenciais">Diferenciais</a> ·
  <a href="#roadmap">Roadmap</a> ·
  <a href="#contribuindo">Contribuindo</a>
</p>

</div>

---

## ✨ O que é

Aurora Stack é uma **CLI feita no Brasil** que transforma um servidor Linux limpo em infraestrutura production-ready em poucos minutos. Combina o melhor de **SetupOrion**, **Coolify** e **Dokploy** com diferenciais únicos:

- 🇧🇷 **Foco no mercado brasileiro** — pensado pra devs/empresas BR, documentação em PT
- 🤖 **IA conversacional opcional** — descreva em pt-BR o que precisa e a Aurora monta a stack
- 🎨 **TUI bonito e responsivo** — interface terminal com identidade visual própria (paleta teal/navy)
- 🔒 **Local-first, privacy-first** — toda orquestração é local, backend só pra IA (opt-in)
- 📦 **95 stacks** no v0.1 (paridade SetupOrion + extras Aurora)
- ⚡ **Idempotente** — rodar duas vezes não quebra, só pula etapas já feitas

## 🚀 Instalação rápida

Em um servidor **Debian 12 (Bookworm)** ou **Debian 13 (Trixie)** limpo:

```bash
bash <(curl -sSL https://setup.aurora-mcp.com)
```

Isso prepara o servidor automaticamente em ~3 minutos:

- Atualiza pacotes do sistema
- Instala Node.js 20+, Docker Engine, Docker Swarm
- Cria a rede overlay `aurora-net`
- Cria estrutura de diretórios em `/opt/aurora/`
- Instala a CLI `aurora` globalmente

Após terminar:

```bash
aurora init       # configura o servidor (idempotente)
aurora            # menu interativo
```

### Requisitos mínimos

| Requisito | Mínimo | Recomendado |
|---|---|---|
| Sistema operacional | Debian 12 ou 13 | Debian 13 (Trixie) |
| RAM | 1 GB | 4 GB |
| Disco | 10 GB livres | 40 GB SSD |
| CPU | 1 vCPU | 2 vCPUs |
| Acesso | root (sudo) | root |

---

## 🧭 Comandos

| Comando | Descrição |
|---|---|
| `aurora` | Abre o menu interativo (TUI) |
| `aurora init` | Prepara o servidor (Docker + Swarm + diretórios + estado) |
| `aurora deploy <stack>` | Instala uma stack do catálogo |
| `aurora list` | Lista stacks instaladas |
| `aurora status` | Snapshot do servidor (CPU, RAM, disco, containers) |
| `aurora logs <stack>` | Tail dos logs da stack |
| `aurora doctor` | Health check do ambiente |
| `aurora remove <stack>` | Desinstala uma stack |
| `aurora upgrade` | Atualiza a CLI para a última versão |
| `aurora ai "<frase>"` | Modo conversacional (precisa API key Aurora) |
| `aurora --version` | Exibe a versão instalada |
| `aurora --help` | Mostra ajuda completa |

---

## 📦 Catálogo de stacks

Aurora Stack v0.1 entrega **95 stacks pré-configuradas** em 14 categorias:

<details>
<summary><b>🏗️ Infra & Reverse Proxy</b> (4)</summary>

- Traefik · Portainer · Gotenberg · Hoppscotch

</details>

<details>
<summary><b>💬 Chat & Comunicação</b> (5)</summary>

- Chatwoot · Botpress · Chatwoot Mega · Mattermost · Outline

</details>

<details>
<summary><b>🔌 APIs & Data Services</b> (6)</summary>

- Evolution API · MinIO · Uno API · Quepasa API · Wuzapi · WppConnect

</details>

<details>
<summary><b>⚙️ Automação & Workflow</b> (9)</summary>

- Typebot · n8n · Flowise · RabbitMQ · n8n + Nodes Quepasa · LangFlow · Anything LLM · ToolJet · Bolt

</details>

<details>
<summary><b>🗄️ Bancos & Management</b> (9)</summary>

- PgAdmin 4 · Nocobase · Baserow · MongoDB · NocoDB · Directus · PhpMyAdmin · ClickHouse · RedisInsight

</details>

<details>
<summary><b>🤖 IA & LLM</b> (6 + 3 extras Aurora)</summary>

- Qdrant · Langfuse · Dify AI · Ollama · ZEP · Evo AI
- **Extras Aurora:** OpenWebUI · LocalAI · ChromaDB

</details>

<details>
<summary><b>🧩 Low-Code / No-Code</b> (5)</summary>

- Appsmith · LowCoder · Supabase · Frappe

</details>

<details>
<summary><b>📝 Conteúdo & Documentos</b> (9)</summary>

- WordPress · Docuseal · Affine · NextCloud · Strapi · Documenso · Stirling PDF · WiseMapping · Wiki.js

</details>

<details>
<summary><b>💼 Business & CRM</b> (4)</summary>

- Mautic · Odoo · TwentyCRM · Krayin CRM

</details>

<details>
<summary><b>📊 Monitoring & Analytics</b> (3 + 1 extra)</summary>

- Uptime Kuma · Metabase · Grafana + Prometheus + cAdvisor
- **Extra Aurora:** Plausible Analytics (LGPD-friendly)

</details>

<details>
<summary><b>📅 Scheduling & Produtividade</b> (5)</summary>

- Cal.com · OpenProject · Focalboard · Easy!Appointments · Planka

</details>

<details>
<summary><b>📋 Forms & Surveys</b> (1)</summary>

- Formbricks

</details>

<details>
<summary><b>🔐 Security & Access</b> (4 + 2 extras)</summary>

- VaultWarden · GLPI · Keycloak · Passbolt
- **Extras Aurora:** Vaultwarden CLI · Crowdsec (substituto fail2ban moderno)

</details>

<details>
<summary><b>🛠️ Ferramentas Especializadas</b> (11 + extras)</summary>

- Ntfy · HumHub · Yourls · Excalidraw · Moodle · Traccar · Firecrawl · Browserless · AzuraCast · Shlink · RustDesk
- **Extras Aurora:** Cloudflared Tunnel · Watchtower · Backrest · Listmonk · Searxng · Node-RED · EMQX · InfluxDB · Coolify · Dokploy

</details>

> ⚠️ **Status:** Templates serão entregues no **Plano B** (próxima sprint). Veja o [Roadmap](#roadmap).

---

## 🎯 Diferenciais

### vs SetupOrion

| | SetupOrion | Aurora Stack |
|---|---|---|
| **Linguagem** | Bash | TypeScript + bash bootstrap |
| **UX** | Menu numérico | TUI moderno (setas, busca, validação) |
| **IA** | ❌ | ✅ `aurora ai "instala n8n com postgres"` |
| **Identidade visual** | Genérica | Aurora Glass (teal/navy) |
| **Testes automatizados** | ❌ | ✅ vitest + GitHub Actions |
| **Tipagem** | Strings em shell | TypeScript strict |
| **Distribuição** | curl + bash | npm (`@aurorabr/stack`) + curl |
| **Estado declarativo** | ❌ | ✅ `/etc/aurora/server.yml` |

### vs Coolify / Dokploy

Aurora Stack **não é PaaS** — é **provisionador de infraestrutura**. Você pode até usar Aurora pra subir o próprio Coolify ou Dokploy 😄 (eles estão no catálogo).

| | Coolify/Dokploy | Aurora Stack |
|---|---|---|
| **Filosofia** | "Heroku self-hosted" | "Provisionador inteligente" |
| **Foco** | Deploy de apps | Setup de infra completa |
| **Catálogo** | Apps Git-based | Stacks Docker pré-configuradas |
| **IA conversacional** | ❌ | ✅ |
| **Mercado-alvo** | Devs solo | Devs + sysadmins + empresas BR |

---

## 🤖 IA conversacional (preview)

Em vez de decorar 95 comandos, você descreve em português o que precisa:

```bash
aurora ai "instala n8n com postgres e backup diário"
```

A Aurora analisa o contexto do seu servidor (RAM disponível, stacks já instaladas, recursos), monta um plano e **pergunta confirmação antes de executar**:

```
╭─ Plano sugerido ────────────────────────────────╮
│ 1. Deploy PostgreSQL (DB do n8n)                 │
│ 2. Deploy n8n (conectado ao Postgres)            │
│ 3. Agendar backup diário 02:00 UTC               │
│                                                  │
│ Estimativa: 3 minutos                            │
│ Recursos: ~600MB RAM, ~2GB disco                 │
│                                                  │
│ Confirma? [s/N]                                  │
╰──────────────────────────────────────────────────╯
```

> 🔒 **Privacy by design**: a IA roda no backend `aurora-mcp.com` mas **nenhum dado do servidor** (logs, env vars, IPs internos) é enviado sem consentimento explícito. A execução do plano é 100% local.

**Status:** funcionalidade do Plano C (próximas sprints).

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│  Servidor Linux Debian 12/13 (do usuário final)             │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │ Aurora Stack CLI (@aurorabr/stack)             │         │
│  └─────────────┬──────────────────────────────────┘         │
│                │                                              │
│                ├──► docker swarm/stack (LOCAL)               │
│                ├──► /opt/aurora/* (file system LOCAL)        │
│                ├──► /etc/aurora/server.yml (estado)          │
│                └──► HTTPS pra IA (opcional, opt-in)          │
│                                                              │
│  Docker Swarm (single-node manager)                          │
│   └─ AuroraNet (overlay network)                             │
│       ├─ traefik ─ portainer ─ postgres ─ n8n ...           │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ HTTPS (apenas IA + telemetria opt-in)
                          ▼
                ┌────────────────────────┐
                │  aurora-mcp.com        │
                │  (backend Aurora MCP)  │
                └────────────────────────┘
```

**Princípios:**

1. **CLI 100% local-first** — deploys, comandos docker, file system: tudo no servidor do dono final
2. **Privacidade by default** — nenhum dado sai sem opt-in explícito
3. **Offline-friendly** — sem internet, deploys funcionam normalmente; só IA precisa de rede
4. **Docker Swarm desde o início** — mesmo single-node, escalável depois sem refazer setup
5. **Templates em TypeScript** — type-safe, validação em build, autocomplete
6. **Estado em YAML versionável** — `/etc/aurora/server.yml` permite backup por copiar 1 arquivo

---

## 📁 Estrutura do projeto

```
aurora-stack/
├── src/
│   ├── commands/     # 10 comandos da CLI
│   ├── lib/          # paths, exec, os, docker, state, config, api, version
│   ├── tui/          # theme Aurora + Clack helpers + spinner
│   ├── types.ts      # schemas zod compartilhados
│   └── index.ts      # entry point (commander.js)
├── tests/            # vitest (25+ testes, integração + mocks)
├── setup/
│   └── setup.sh      # bootstrap bash para servidor cru
├── bin/
│   └── aurora.js     # entry npm install -g
└── .github/workflows/
    ├── ci.yml        # lint + test + build em PR
    └── release.yml   # npm publish em tag v*
```

---

## 🛠️ Stack tecnológico

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20+ |
| Linguagem | TypeScript 5 (strict + noUncheckedIndexedAccess) |
| TUI | [@clack/prompts](https://github.com/natemoo-re/clack) |
| Cores | [chalk](https://github.com/chalk/chalk) |
| Spinner | [ora](https://github.com/sindresorhus/ora) |
| CLI parsing | [commander](https://github.com/tj/commander.js) |
| YAML | [js-yaml](https://github.com/nodeca/js-yaml) |
| Validação | [zod](https://zod.dev/) |
| Testes | [vitest](https://vitest.dev/) |
| Build | [tsup](https://tsup.egoist.dev/) |
| CI/CD | GitHub Actions |

---

## 📊 Status

**v0.1.0-alpha.3** — Plano A (CLI core) executado, em validação em VPS reais.

### Roadmap

| Versão | Entrega | Status |
|---|---|---|
| **v0.1 (Plano A)** | CLI core — init, status, doctor, list, etc | ✅ Concluído |
| **v0.1 (Plano B)** | 95 templates de stacks funcionais | ⏳ Próxima sprint |
| **v0.1 (Plano C)** | IA conversacional + telemetria opt-in | ⏳ Próxima sprint |
| **v0.2** | Painel web em `stack.aurora-mcp.com/dashboard` | ⏳ Futuro |
| **v0.3** | Marketplace de templates community | ⏳ Futuro |
| **v0.4** | Módulo industrial (Node-RED, MQTT, OPC-UA) | ⏳ Futuro |
| **v1.0** | Estabilização, SemVer estrito, docs PT+EN | ⏳ Futuro |

---

## 🧪 Desenvolvimento local

```bash
git clone https://github.com/adeiltonpessini/aurora-stack.git
cd aurora-stack
npm install
npm test              # 25+ testes
npm run lint          # tsc --noEmit
npm run build         # tsup → dist/
node bin/aurora.js --help
```

### Estrutura de testes

```bash
npm test                      # roda todos
npm test -- os.test           # roda só os testes do OS detector
npm run test:watch            # modo watch durante dev
```

### Build local + smoke test

```bash
npm run build
node bin/aurora.js --version  # deve mostrar versão atual
node bin/aurora.js --help     # lista 9 subcomandos
```

---

## 🤝 Contribuindo

Aurora Stack é **código aberto sob Elastic License v2** — você pode usar, modificar, redistribuir, **exceto oferecer como SaaS gerenciado**. Veja [LICENSE](./LICENSE).

### Como ajudar

1. **Bug report**: abra uma [issue](https://github.com/adeiltonpessini/aurora-stack/issues) com:
   - Versão do Aurora (`aurora --version`)
   - Versão do Debian (`cat /etc/os-release`)
   - Output do `aurora doctor`
   - Comando que falhou + erro completo
2. **Feature request**: também via [issues](https://github.com/adeiltonpessini/aurora-stack/issues), tag `enhancement`
3. **Pull request**: fork → branch → PR. Antes de abrir, rode `npm run lint && npm test`
4. **Suporte/dúvidas**: [Discussions](https://github.com/adeiltonpessini/aurora-stack/discussions)

### Padrões de código

- TypeScript strict + `noUncheckedIndexedAccess`
- Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`)
- 1 responsabilidade por arquivo (cada `lib/*.ts` é uma função coesa)
- Cada lib com lógica deve ter teste em `tests/`

---

## 🔒 Segurança

### Reportando vulnerabilidades

**Não** abra issue pública. Envie e-mail para `security@aurora-mcp.com` com:

- Descrição da vulnerabilidade
- Steps to reproduce
- Impacto estimado

Resposta em até 48h. Crédito público se desejado.

### Modelo de ameaça

| Ameaça | Mitigação |
|---|---|
| MITM no `curl \| bash` | HTTPS obrigatório; setup.sh será versionado com SHA |
| API key Aurora vazada | Permissões `0600` em `~/.aurora/config.json`, rotação via dashboard |
| Templates community maliciosos | v0.1 só catálogo first-party; v0.3 review + sandbox |
| Container escape | Containers rodam como non-root, FS read-only quando possível |
| Logs vazam segredos | `aurora logs` filtra `*PASSWORD*`, `*SECRET*`, `*TOKEN*` |

### LGPD

Aurora Stack **não coleta PII** por design — é ferramenta de servidor. Telemetria opt-in coleta apenas:

- `cli_version`, `stack_name`, `success/failure`, `os_version`, `region` (anonimizado)

Desligar telemetria: `aurora config set telemetry false`. Política completa em [stack.aurora-mcp.com/privacidade](https://stack.aurora-mcp.com/privacidade) (em construção).

---

## 📜 Licença

**Elastic License v2 (ELv2)** — veja [LICENSE](./LICENSE).

### Resumo prático

✅ **Você pode**:
- Usar Aurora Stack no seu servidor (pessoal ou comercial)
- Modificar, fazer fork, redistribuir
- Usar em produtos internos da sua empresa

❌ **Você NÃO pode**:
- Oferecer Aurora Stack como **SaaS gerenciado** (não pode criar "aurora-cloud.com" cobrando)
- Burlar/desativar features pagas (proteção pra tier paid futuro)
- Remover avisos de copyright e licença

> 💡 Em dúvida? Abra uma [discussion](https://github.com/adeiltonpessini/aurora-stack/discussions) ou consulte um advogado de tecnologia.

---

## 🔗 Links

- **Site oficial**: [stack.aurora-mcp.com](https://stack.aurora-mcp.com) (em construção)
- **Aurora MCP** (produto irmão): [aurora-mcp.com](https://aurora-mcp.com)
- **npm**: [npmjs.com/package/@aurorabr/stack](https://www.npmjs.com/package/@aurorabr/stack)
- **GitHub**: [github.com/adeiltonpessini/aurora-stack](https://github.com/adeiltonpessini/aurora-stack)

---

<div align="center">

**Construído no Brasil 🇧🇷 com TypeScript, café e muito Docker.**

</div>
