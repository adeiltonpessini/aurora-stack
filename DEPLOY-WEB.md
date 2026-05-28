# Deploy da landing — stack.aurora-mcp.com + setup.aurora-mcp.com

Guia pra subir a landing institucional do Aurora Stack na MESMA VPS do
BarberAI (Docker Swarm + Traefik + Cloudflare Tunnel já existentes).

A landing é um app Next.js standalone (`apps/web/`) que serve:

- `stack.aurora-mcp.com` → landing institucional + catálogo
- `setup.aurora-mcp.com` → bash bootstrap (`curl -sSL setup.aurora-mcp.com | bash`)

Os dois hostnames apontam pro mesmo container. O Next serve a landing em
`/` e o `setup.sh` em `/setup.sh`; um middleware Traefik reescreve a raiz
de `setup.aurora-mcp.com` → `/setup.sh` pra o one-liner funcionar.

---

## 1. Pré-requisitos (uma vez)

A VPS do BarberAI já tem tudo que precisamos:

- [x] Docker Swarm ativo (`docker info | grep Swarm`)
- [x] Rede `BarberaiNet` (overlay, external)
- [x] Traefik rodando com entrypoint `websecure`
- [x] Cloudflare Tunnel apontando subdomínios → Traefik

---

## 2. DNS na Cloudflare

No painel da zona `aurora-mcp.com`, adicione os 2 subdomínios apontando
pro mesmo túnel Cloudflare que o BarberAI usa:

| Tipo  | Nome    | Conteúdo                              | Proxy |
|-------|---------|---------------------------------------|-------|
| CNAME | `stack` | `<tunnel-id>.cfargotunnel.com`        | ✅ ON |
| CNAME | `setup` | `<tunnel-id>.cfargotunnel.com`        | ✅ ON |

> O `<tunnel-id>` é o mesmo do BarberAI. Veja em **Zero Trust → Networks →
> Tunnels → (seu túnel) → Public Hostname**. Adicione 2 public hostnames
> novos no túnel:
> - `stack.aurora-mcp.com` → `https://localhost:443` (No TLS Verify ✅)
> - `setup.aurora-mcp.com` → `https://localhost:443` (No TLS Verify ✅)

Ative **SSL/TLS → Edge Certificates → Always Use HTTPS** na zona
`aurora-mcp.com` (redirect 80→443 no edge — o Traefik não faz redirect).

---

## 3. Self-hosted runner (uma vez) — OBRIGATÓRIO

O workflow `release-web.yml` roda em `runs-on: [self-hosted, aurora-stack]`.
Runners self-hosted são registrados **por repositório**, então o repo
`aurora-stack` precisa do SEU próprio runner — os runners do `barberai` e
`aurora-mcp` não atendem jobs do `aurora-stack`.

O serviço `aurora_stack_runner` já está no `stack.runners.yml` (no repo
BarberAI). Pra ativá-lo:

1. Pegue o registration token em
   `github.com/adeiltonpessini/aurora-stack/settings/actions/runners/new`
2. No Portainer, na stack `runners`, adicione a env var:
   ```
   TOKEN_AURORA_STACK=<token-do-passo-1>
   ```
3. Redeploy da stack `runners`. O runner `aurora-stack-runner-1` aparece
   em `github.com/.../aurora-stack/settings/actions/runners` em ~10s, com
   as labels `aurora-stack, docker, linux`.

> O token é usado uma vez pra registrar; depois o container mantém
> credencial própria e se re-registra se reiniciar.

## 3b. GitHub Secret

A imagem usa o `GITHUB_TOKEN` automático (escopo `packages: write`) —
**não precisa de secret manual**. A landing não tem segredos de build
(diferente do BarberAI, que precisa do `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`).

Garanta que o package `aurora-web` no GHCR está acessível pro Portainer
puxar — use o mesmo PAT do BarberAI (já configurado no Portainer como
registry credential).

---

## 4. Build da imagem

Push na `main` que toque `apps/web/**` ou `setup/setup.sh` dispara o
workflow automaticamente. Ou rode manual:

```bash
# No GitHub: Actions → "Release web image" → Run workflow
```

A imagem sai em `ghcr.io/adeiltonpessini/aurora-web:latest`.

Build manual local (debug):

```bash
# Da raiz do repo aurora-stack (context = raiz por causa do setup.sh):
docker build -f apps/web/Dockerfile -t aurora-web:dev .
docker run --rm -p 4000:4000 aurora-web:dev
# Abra http://localhost:4000 e http://localhost:4000/setup.sh
```

---

## 5. Deploy no Swarm

### Via Portainer (recomendado)

1. **Stacks → Add stack → "aurora-web"**
2. Cole o conteúdo de `stack.aurora-web.yml`
3. Garanta que o registry GHCR está configurado (mesmo do BarberAI)
4. **Deploy the stack**

### Via CLI

```bash
# Copie stack.aurora-web.yml pra VPS, então:
docker stack deploy -c stack.aurora-web.yml aurora --with-registry-auth
```

Confirme:

```bash
docker stack services aurora
docker service logs aurora_aurora_web --tail 50
```

---

## 6. Verificar

```bash
# Landing
curl -sI https://stack.aurora-mcp.com | head -5

# Setup bootstrap (deve retornar o script bash)
curl -sSL https://setup.aurora-mcp.com | head -5
# Esperado: #!/usr/bin/env bash ...
```

No browser: `https://stack.aurora-mcp.com` mostra a landing com o mascote
flutuando.

---

## 7. Atualizar

Cada push na `main` (tocando `apps/web/` ou `setup/setup.sh`) rebuilda a
imagem. Pra aplicar no servidor:

```bash
# Portainer: Stacks → aurora-web → Pull and redeploy
# OU CLI:
docker service update --image ghcr.io/adeiltonpessini/aurora-web:latest \
  --force aurora_aurora_web
```

---

## 8. Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| 502 Bad Gateway | Container não subiu | `docker service logs aurora_aurora_web` |
| `curl setup.aurora-mcp.com` retorna HTML da landing | Middleware de rewrite não aplicou | Confira os labels `aurora-setup-rewrite` no stack; o router `aurora-setup` precisa de `priority=100` |
| 404 em `/setup.sh` | `setup.sh` não foi copiado pro public no build | Confira `COPY setup/setup.sh ./public/setup.sh` no Dockerfile |
| "no matching manifest" no pull | OCI index do buildx | Já mitigado: `provenance: false` + `sbom: false` no workflow |
| Imagem não atualiza | Tag `latest` cacheada | Use `--force` no `service update` ou pinne SHA |
| Workflow fica "Queued" pra sempre | Runner `aurora-stack` não registrado | Veja seção 3 — registre o `aurora_stack_runner` com `TOKEN_AURORA_STACK` |

---

## 9. Custo / blast radius

Roda na mesma VPS do BarberAI:

- **+1 container** (~150MB imagem, ~80MB RAM idle)
- **Zero infra nova** — reaproveita Swarm + Traefik + Cloudflare Tunnel
- **Trade-off:** se a VPS do BarberAI cair, a landing do Aurora cai junto.
  Aceitável pra landing institucional (não é serviço crítico).

Se um dia quiser isolar, basta apontar os 2 CNAMEs pra outro túnel/VPS e
deployar a mesma stack lá.
