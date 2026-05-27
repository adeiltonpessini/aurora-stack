# Changelog

## [0.1.0-alpha.5] - 2026-05-27

### Added — Motor de templates + 3 stacks-piloto

`aurora deploy <stack>` agora **funciona de verdade**. Saiu do esqueleto e virou wizard interativo.

**Motor (`src/lib/`):**

- **`stack-def.ts`** — `defineStack()` com validacao em runtime: slug obrigatorio, vars unicas, composeTemplate nao vazio. 5 tipos de var: `text`, `password`, `email`, `domain`, `secret-generated`.
- **`template-render.ts`** — mini renderizador sem deps (~40 LoC). Sintaxe: `{{VAR}}` e `{{#if VAR}}...{{/if}}`. Lanca erro com nome da var faltando — falha cedo melhor que YAML quebrado no docker.
- **`var-prompt.ts`** — perguntas tipadas via Clack + geracao automatica de secrets via `crypto.randomBytes(N).toString("base64url")`. **Re-deploy preserva senha** existente (nao quebra apps que cacheam credencial).
- **`stack-registry.ts`** — `listStacks()`, `findStack()`, `listByCategory()`. Catalogo central em `src/templates-index.ts` (imports estaticos pro tsup bundlar).

**Comandos:**

- **`aurora deploy <stack>`** — resolve no catalogo, valida state inicial, pergunta vars (preservando defaults do state em re-deploy), renderiza `compose.tmpl`, escreve `/opt/aurora/stacks/<name>.yml` + `/opt/aurora/configs/<name>.env` (chmod 600), executa `docker stack deploy --with-registry-auth`, atualiza state. Exibe URL primaria no `outro`.
- **`aurora remove <stack>`** — confirma explicita (sem `--yes`), executa `teardown` (default: `docker stack rm`), limpa state. **PRESERVA volumes e configs** por default — defaults conservadores.
- **`aurora list --available`** (ou `-a`) — lista catalogo completo agrupado por categoria.

**Stacks-piloto (`templates/`):**

- **Traefik 3.0** — reverse proxy + Let's Encrypt automatico (TLS challenge). Sem dashboard publico no v0.1 (precisaria de bcrypt pra basic auth).
- **Portainer CE 2.21** — painel Docker/Swarm. Admin criado na primeira tela web.
- **PostgreSQL 16** — banco base, sem porta exposta, healthcheck `pg_isready`, volume persistente.

Cada template tem `template.ts` + `compose.tmpl` + `README.md`.

### Changed — nome de rede configuravel (estilo SetupOrion)

`aurora init` agora pergunta tambem o **nome da rede Docker overlay** (default `aurora-net`). Configuravel pra coexistir com setups antigos (ex: `network_public` do SetupOrion) sem re-attachar todos os containers.

- Novo campo `server.network_name` em `ServerState`.
- `deploy.ts` injeta automaticamente `{{NETWORK_NAME}}` nas vars renderizadas — templates referenciam `{{NETWORK_NAME}}` em vez de hard-coded.
- `aurora status` exibe a rede configurada.
- Validacao no init: nome valido do Docker (1-64 chars, `[a-zA-Z0-9._-]`, comecando alfanumerico).

### Por que UMA vez no init e nao por stack (igual SetupOrion)

SetupOrion pergunta rede em cada stack porque nao tem estado central. Aurora tem (`/etc/aurora/server.yml`). Perguntar uma vez evita inconsistencia (Portainer em `network_a`, n8n em `network_b` nao se conversam) e poupa tempo do usuario.

### Stats

- 5 libs novas (`stack-def`, `template-render`, `var-prompt`, `stack-registry`, `templates-index`)
- 2 commands reescritos (`deploy`, `remove`)
- 3 templates piloto
- 62 testes verde (era 30 no alpha.4)
- tsc verde
- build verde

## [0.1.0-alpha.4] - 2026-05-27

### Added — `aurora init` interativo

Antes o `aurora init` só rodava as verificações de ambiente sem perguntar nada. Agora pergunta (padrão inspirado no SetupOrion):

- **Nome amigável do servidor** (`display_name`) — default = hostname do SO. Aparece em `aurora status`, contexto da IA, futuros alertas.
- **Email do admin** (`admin_email`) — opcional. Usado em alertas Aurora futuros (Plano C). NÃO é email do Let's Encrypt (esse vai por stack no `aurora deploy`).
- **Timezone** (`timezone`) — IANA timezone, default `America/Sao_Paulo`. Usado em cron schedules, formatação de logs, agendamento de backups.
- **Tela de confirmação** ("As respostas estão corretas? [s/N]") — se `N`, refaz as perguntas. Idêntico ao padrão SetupOrion.

Idempotente: rodar `aurora init` novamente mostra valores atuais como default (Enter pra manter).

### Changed

- **Schema `ServerState`** estendido com 3 campos novos em `server`: `display_name`, `admin_email` (opcional), `timezone`. Defaults aplicados em `initialState()`.
- **`aurora status`** agora exibe `Servidor: <display_name> (<hostname técnico>)` quando há display_name, além de `Timezone` e `Admin`.
- **Testes do state.ts** expandidos de 5 para 9 (cobertura completa dos campos novos + validação de email).

### Por que não perguntar email Let's Encrypt / domínio / senha Portainer aqui

Essas configs são **por-stack** (cada Traefik pode ter email diferente, cada Portainer domínio diferente). Vão ficar em `aurora deploy <stack>` no Plano B, igual ao escopo do template. Mantém `aurora init` enxuto e focado em config do servidor.

## [0.1.0-alpha.3] - 2026-05-27

### Added

- `setup.sh` ganhou fallback "install from source" — se `npm install -g @aurorabr/stack` falhar (pacote ainda não publicado), clona o repo, builda local e usa `npm link`. Permite testar Aurora Stack em VPS antes do publish oficial. Override via `AURORA_FROM_SOURCE=1`.
- **LICENSE** definida: **Elastic License v2 (ELv2)**. Permite uso comercial, modificação e redistribuição; proíbe oferecer como SaaS gerenciado e burlar features pagas. Compatível com a estratégia de monetização da Aurora.
- **README profissional**: reestruturado com badges, índice, seções de catálogo expansíveis, comparativos vs SetupOrion/Coolify, arquitetura, contributing guide, security policy, LGPD.

### Changed

- `package.json` license field migrado de `MIT` para `SEE LICENSE IN LICENSE` (formato npm pra licenças custom).

## [0.1.0-alpha.2] - 2026-05-27

### Changed

- **Suporte expandido**: agora aceita Debian 12 (Bookworm) E Debian 13 (Trixie). Antes só Debian 12.
- `detectOs()` e `setup.sh` validam ambas as versões.
- README atualizado.

## [0.1.0-alpha.1] - 2026-05-27

### Added — Plano A (CLI core)

- CLI entry point com 9 comandos (init, deploy, remove, list, status, logs, doctor, upgrade, ai) + menu TUI
- `aurora init`: detecção SO, validação root, Docker Swarm setup, AuroraNet, /opt/aurora structure, /etc/aurora/server.yml
- `aurora status`: snapshot CPU/RAM/disco/containers/stacks
- `aurora doctor`: health check de Docker, Swarm, network, estrutura, server.yml, API key
- `aurora list`: lista stacks de /etc/aurora/server.yml
- `aurora logs <stack>`: tail Swarm services
- `aurora upgrade`: npm i -g @aurorabr/stack@latest
- Esqueletos pra `deploy`, `remove`, `ai` (implementação completa em Planos B e C)
- TUI theme Aurora (teal/navy) + Clack helpers
- Bash bootstrap em `setup/setup.sh` (publicado em setup.aurora-mcp.com)
- GitHub Actions: CI (lint + test + build) + Release (npm publish em tag v*)
