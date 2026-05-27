# Aurora Stack

> Transforme qualquer Linux em uma infraestrutura inteligente.

CLI de provisionamento de servidores Linux com Docker Swarm + Traefik + 95 stacks pré-configuradas + IA conversacional opcional.

[![npm](https://img.shields.io/badge/npm-%40aurorabr%2Fstack-cb3837?logo=npm)](https://www.npmjs.com/package/@aurorabr/stack)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![status: alpha](https://img.shields.io/badge/status-alpha-f59e0b)](#status)

## Instalação rápida

Em um servidor **Debian 12 (Bookworm) ou 13 (Trixie)** limpo:

```bash
bash <(curl -sSL setup.aurora-mcp.com)
```

Isso prepara o servidor: Docker, Swarm, network overlay, estrutura de diretórios + CLI Aurora.

## Comandos

```bash
aurora              # menu interativo
aurora init         # prepara o servidor (idempotente)
aurora deploy <X>   # instala stack do catálogo (Plano B)
aurora list         # lista stacks instaladas
aurora status       # snapshot do servidor
aurora logs <X>     # tail dos logs
aurora doctor       # health check
aurora upgrade      # atualiza CLI
aurora ai "..."     # IA conversacional (Plano C)
```

## Status

**v0.1.0-alpha.1** — Plano A executado (CLI core). Próximos planos: B (95 templates de stacks) e C (IA conversacional).

## Roadmap

- ✅ **Plano A**: CLI core (init, status, doctor, list, etc)
- ⏳ **Plano B**: 95 templates (Traefik, Portainer, n8n, Postgres, ...)
- ⏳ **Plano C**: IA conversacional (`aurora ai "..."`)
- ⏳ **v0.2**: Painel web em `stack.aurora-mcp.com/dashboard`

## Licença

MIT

## Site

[stack.aurora-mcp.com](https://stack.aurora-mcp.com)
