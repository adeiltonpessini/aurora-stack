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

A VPS do BarberAI já tem quase tudo que precisamos:

- [x] Docker Swarm ativo (`docker info | grep Swarm`)
- [x] Rede `BarberaiNet` (overlay, external)
- [x] Traefik rodando com entrypoint `websecure`
- [x] Cloudflare Tunnel apontando subdomínios → Traefik
- [ ] **Rede `AuroraNet` criada + Traefik anexado a ela** — ver seção 1b
      (passo de SEGURANÇA, feito uma vez)

---

## 1b. Isolar a landing (SEGURANÇA — uma vez) — OBRIGATÓRIO

> Auditoria de segurança (2026-05-28): a landing **não roda mais na
> `BarberaiNet`**. Numa rede compartilhada, se a landing fosse comprometida
> (ex.: RCE no Next.js), o atacante teria visibilidade de rede do Postgres,
> do Evolution Go e do app BarberAI — risco de **movimento lateral**. Agora
> a landing vive sozinha na `AuroraNet`.

O Traefik é o roteador único e vive na `BarberaiNet`. Para ele conseguir
rotear tráfego pra um container, precisa **compartilhar uma rede** com ele.
Por isso o Traefik precisa ser anexado também à `AuroraNet`. Resultado:
o Traefik fica nas **duas** redes (e roteia a landing), mas a landing **não
enxerga** Postgres/Evolution/BarberAI.

**Passo 1 — criar a rede overlay isolada (uma vez):**

```bash
docker network create -d overlay --attachable AuroraNet
docker network ls | grep AuroraNet   # confirma
```

**Passo 2 — anexar o Traefik à `AuroraNet`.** Como o serviço Traefik foi
criado direto no host/Portainer, edite a stack/serviço dele e adicione
`AuroraNet` à lista de redes. Duas formas:

- **Portainer:** Stacks → (stack do Traefik) → Editor → no bloco
  `networks:` do serviço Traefik, adicione `- AuroraNet`; e no bloco
  `networks:` raiz declare `AuroraNet: { external: true }`. Redeploy.
- **CLI (rápido, sem editar arquivo):**

  ```bash
  docker service update --network-add AuroraNet <nome-do-servico-traefik>
  # descubra o nome com: docker service ls | grep -i traefik
  ```

  > ⚠️ `--network-add` recria as tasks do Traefik (downtime de poucos
  > segundos de TODO o roteamento — landing, app, painel). Faça em janela
  > de baixo tráfego. Confirme depois com:
  > `docker service inspect <traefik> --format '{{range .Spec.TaskTemplate.Networks}}{{.Target}} {{end}}'`
  > (deve listar as duas redes).

Depois disso o `stack.aurora-web.yml` (que já referencia `AuroraNet` como
`external: true`) sobe e o Traefik consegue alcançá-lo.

> Fronteira de times: criar a rede e anexar o Traefik é operação de host
> (Davi). A landing em si (esta stack) é Aurora. O label
> `traefik.docker.network=AuroraNet` no `stack.aurora-web.yml` já diz ao
> Traefik por qual rede falar com a landing — necessário porque o Traefik
> agora está em mais de uma rede.

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

> ⚠️ Antes do 1º deploy, garanta que a `AuroraNet` existe e o Traefik está
> anexado a ela (seção 1b). Sem isso a landing sobe mas dá **502** (o
> Traefik não a alcança).
>
> ⚠️ A imagem no `stack.aurora-web.yml` está **pinada por digest**
> (`@sha256:REPLACE_WITH_REAL_DIGEST`). Pro 1º deploy de bootstrap, pegue o
> digest real (seção 7) ou use temporariamente a linha `:latest` comentada
> no arquivo.

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

## 7. Atualizar (com digest pinado)

Cada push na `main` (tocando `apps/web/` ou `setup/setup.sh`) rebuilda a
imagem `:latest`. Como prod roda **pinado por digest** (não `:latest`), a
atualização é **deliberada**:

```bash
# 1. Descubra o digest da imagem nova (após o build do Actions):
docker pull ghcr.io/adeiltonpessini/aurora-web:latest
docker inspect --format='{{index .RepoDigests 0}}' \
  ghcr.io/adeiltonpessini/aurora-web:latest
# saída: ghcr.io/adeiltonpessini/aurora-web@sha256:abc123...

# 2. Edite stack.aurora-web.yml: troque o @sha256:... pelo novo digest.
# 3. Redeploy:
#    Portainer: Stacks → aurora-web → Update the stack
#    OU CLI:
docker service update \
  --image ghcr.io/adeiltonpessini/aurora-web@sha256:NOVO_DIGEST \
  --force aurora_aurora_web
```

> Por que digest e não `:latest`: a tag `:latest` é mutável — qualquer push
> a sobrescreve. Pinar por `sha256` garante que prod roda exatamente o que
> foi auditado, e a atualização só acontece quando você troca o digest de
> propósito (proteção supply-chain).

---

## 8. Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| 502 Bad Gateway | Container não subiu **OU** Traefik não está na `AuroraNet` | `docker service logs aurora_aurora_web`; confirme `docker service inspect <traefik> --format '{{range .Spec.TaskTemplate.Networks}}{{.Target}} {{end}}'` lista AuroraNet (seção 1b) |
| 502 só na landing (resto OK) | Faltou o label `traefik.docker.network=AuroraNet` (Traefik em multi-rede roteia pela errada) | Confirme o label no `stack.aurora-web.yml` e redeploy |
| `manifest unknown` / digest no pull | `@sha256:REPLACE_WITH_REAL_DIGEST` ainda é placeholder | Troque pelo digest real (seção 7) ou use a linha `:latest` comentada no bootstrap |
| `curl setup.aurora-mcp.com` retorna HTML da landing | Middleware de rewrite não aplicou | Confira os labels `aurora-setup-rewrite` no stack; o router `aurora-setup` precisa de `priority=100` |
| 404 em `/setup.sh` | `setup.sh` não foi copiado pro public no build | Confira `COPY setup/setup.sh ./public/setup.sh` no Dockerfile |
| "no matching manifest" no pull | OCI index do buildx | Já mitigado: `provenance: false` + `sbom: false` no workflow |
| Imagem não atualiza | Tag `latest` cacheada | Use `--force` no `service update` ou pinne SHA |
| Workflow fica "Queued" pra sempre | Runner `aurora-stack` não registrado | Veja seção 3 — registre o `aurora_stack_runner` com `TOKEN_AURORA_STACK` |

---

## 9. Custo / blast radius / postura de segurança

Roda na mesma VPS do BarberAI:

- **+1 container** (~150MB imagem, ~80MB RAM idle), limitado a 256M/0.5cpu
- **Zero infra nova** — reaproveita Swarm + Traefik + Cloudflare Tunnel
- **Trade-off:** se a VPS do BarberAI cair, a landing do Aurora cai junto.
  Aceitável pra landing institucional (não é serviço crítico).

**Isolamento (pós-auditoria 2026-05-28):**

- Landing em **rede própria** (`AuroraNet`) — **não** enxerga
  Postgres/Evolution/BarberAI. Sem movimento lateral se comprometida.
- Container **blindado**: `read_only` rootfs, `cap_drop: ALL`,
  `no-new-privileges`, user non-root (uid 1001), `/tmp` em tmpfs.
- A landing **não carrega segredo nenhum** — só serve HTML estático e o
  `setup.sh`. Mesmo comprometida, não há credencial a vazar.
- Imagem **pinada por digest** (supply-chain).
- **Resource limits** impedem que abuso/leak derrube a VPS inteira.

Se um dia quiser isolar fisicamente, basta apontar os 2 CNAMEs pra outro
túnel/VPS e deployar a mesma stack lá (já está pronta pra rede própria).
