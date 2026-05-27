# Changelog

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
