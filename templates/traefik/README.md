# Traefik

Reverse proxy v3.0 com Let's Encrypt automatico (TLS challenge). Eh a primeira stack a subir no servidor — todas as outras stacks que expoe HTTP/HTTPS dependem de Traefik pra TLS e roteamento por dominio.

## Como usar

```bash
aurora deploy traefik
```

Sera perguntado:

- **Dominio principal** — usado por outras stacks pra montar subdominios (ex: `n8n.seudominio.com`).
- **Email Let's Encrypt** — recebe avisos de expiracao de certificado.

## O que acontece

- Cria stack Swarm `traefik` na rede `aurora-net`
- Expoe portas 80 e 443 no host (mode: host)
- Redireciona 80 -> 443 (HTTPS forcado)
- Le labels de outras stacks pra montar routers automaticos
- Persiste certificados em volume `traefik-letsencrypt`

## Dashboard

O dashboard interno (porta 8080) NAO eh exposto publicamente no v0.1. Pra ver:

```bash
ssh -L 8080:localhost:8080 root@seu-servidor
# abre browser em http://localhost:8080
```

Versoes futuras vao permitir habilitar dashboard publico via basic auth com bcrypt.

## DNS necessario

Antes do deploy, aponte seu dominio principal + os subdominios das stacks pro IP do servidor:

```
seudominio.com         A    <ip-do-servidor>
*.seudominio.com       A    <ip-do-servidor>
```

Wildcard `*.` cobre os subdominios de stacks como `n8n.seudominio.com`, `portainer.seudominio.com`, etc.

## Remocao

```bash
aurora remove traefik
```

Preserva volume com certificados (pra re-deploy nao re-pedir do LE — rate limits LE sao agressivos).
