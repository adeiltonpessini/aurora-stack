# Changelog

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
