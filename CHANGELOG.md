# Changelog

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
