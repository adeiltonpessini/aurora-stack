# Portainer CE

Painel web pra gerenciar Docker/Swarm via interface grafica. Util pra debug, restart de service, ver logs em real-time, criar stacks ad-hoc.

## Pre-requisito

Traefik ja precisa estar instalado (pra TLS + roteamento por dominio):

```bash
aurora deploy traefik   # primeiro
aurora deploy portainer
```

## Como usar

```bash
aurora deploy portainer
```

Sera perguntado:

- **Dominio do Portainer** — ex: `portainer.seudominio.com`. Aponte um A record dessa entrada pro IP do servidor antes de fazer deploy.

## Primeiro acesso

Abra `https://portainer.seudominio.com` num browser. Portainer pede pra criar o usuario admin na primeira tela. **Voce tem ate 5 minutos pra fazer isso depois do deploy** (Portainer fecha o setup wizard por seguranca passado esse tempo — se acontecer, eh so reiniciar o service: `docker service update portainer_portainer --force`).

## Arquitetura

Portainer CE usa modo agent-stack: um `portainer/agent` global (1 por node) coleta dados; o `portainer/portainer-ce` central (1 replica no manager) serve a UI.

## Remocao

```bash
aurora remove portainer
```

Preserva volume com configuracoes do Portainer (admin user, environments salvos, stacks templates).
