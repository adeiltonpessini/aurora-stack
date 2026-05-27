// `aurora doctor` — health check completo. Verifica em ordem:
//   1. Docker + Swarm + rede overlay configurada
//   2. Estrutura /opt/aurora intacta
//   3. /etc/aurora/server.yml valido
//   4. Portas 80/443 livres OU usadas pelo nosso Traefik (e nao por outro proc)
//   5. Espaco em disco >= 5GB em /opt/aurora
//   6. Cada stack do state tambem aparece em `docker stack ls`
//   7. (best-effort) DNS publico das stacks resolve pra IP do servidor
//   8. API key Aurora MCP funciona (se setada)
//
// Cada verificacao pode ser OK / WARN / FAIL. Doctor saida nao-zero
// soh se houver FAIL. WARN nao bloqueia (ex: DNS desatualizado eh
// problema mas nao impede operacao).

import { access } from "node:fs/promises"
import { join } from "node:path"
import { statfs } from "node:fs/promises"
import { lookup } from "node:dns/promises"
import { createConnection } from "node:net"
import { dockerInstalled, dockerSwarmActive, networkExists } from "../lib/docker.js"
import { exec } from "../lib/exec.js"
import { readState } from "../lib/state.js"
import { readUserConfig } from "../lib/config.js"
import { pingAuroraMcp } from "../lib/api.js"
import { PATHS, STATE_SUBDIRS } from "../lib/paths.js"
import { aurora } from "../tui/theme.js"

type Level = "ok" | "warn" | "fail"

interface Check {
  name: string
  level: Level
  detail?: string
}

export async function doctorCommand(): Promise<void> {
  const checks: Check[] = []
  const state = await readStateSafe()

  // 1. Docker + Swarm + rede
  const dockerOk = await dockerInstalled()
  push(checks, "Docker instalado", dockerOk ? "ok" : "fail")
  if (dockerOk) {
    const swarmOk = await dockerSwarmActive()
    push(checks, "Docker Swarm ativo", swarmOk ? "ok" : "fail", swarmOk ? undefined : "Rode `aurora init`")
    const netName = state && typeof state !== "string" ? state.server.network_name : "aurora-net"
    try {
      const exists = await networkExists(netName)
      push(checks, `Rede overlay "${netName}"`, exists ? "ok" : "fail", exists ? undefined : "Rode `aurora init`")
    } catch (err: unknown) {
      push(checks, `Rede overlay "${netName}"`, "fail", err instanceof Error ? err.message : String(err))
    }
  }

  // 2. Estrutura
  let structOk = true
  for (const sub of STATE_SUBDIRS) {
    try {
      await access(join(PATHS.auroraRoot, sub))
    } catch {
      structOk = false
      break
    }
  }
  push(checks, "Estrutura /opt/aurora", structOk ? "ok" : "fail", structOk ? undefined : "Rode `aurora init` (recria diretorios)")

  // 3. server.yml
  if (state === null) {
    push(checks, "/etc/aurora/server.yml", "fail", "Ausente — rode `aurora init`")
  } else if (state === "invalid") {
    push(checks, "/etc/aurora/server.yml", "fail", "YAML invalido ou schema fora — corrija manualmente ou re-init")
  } else {
    push(checks, "/etc/aurora/server.yml valido", "ok")
  }

  // 4. Portas 80 e 443
  for (const port of [80, 443]) {
    const status = await checkPort(port, state)
    push(checks, `Porta ${port}`, status.level, status.detail)
  }

  // 5. Espaco em disco em /opt/aurora
  try {
    const stats = await statfs(PATHS.auroraRoot)
    const freeBytes = Number(stats.bavail) * stats.bsize
    const freeGb = freeBytes / 1024 ** 3
    if (freeGb < 2) {
      push(checks, "Espaco em /opt/aurora", "fail", `Apenas ${freeGb.toFixed(1)} GB livres (< 2 GB)`)
    } else if (freeGb < 5) {
      push(checks, "Espaco em /opt/aurora", "warn", `${freeGb.toFixed(1)} GB livres (recomendado >= 5 GB)`)
    } else {
      push(checks, "Espaco em /opt/aurora", "ok", `${freeGb.toFixed(1)} GB livres`)
    }
  } catch {
    // Em alguns FS o statfs falha (Windows dev) — nao bloqueia.
    push(checks, "Espaco em /opt/aurora", "warn", "Indisponivel neste SO")
  }

  // 6. Stacks do state batem com Swarm
  if (state && typeof state !== "string" && Object.keys(state.stacks).length > 0) {
    const swarmStacks = await listSwarmStacks()
    if (swarmStacks === null) {
      push(checks, "Stacks state vs Swarm", "warn", "Nao consegui consultar `docker stack ls`")
    } else {
      const missing = Object.keys(state.stacks).filter((n) => !swarmStacks.includes(n))
      if (missing.length === 0) {
        push(checks, "Stacks state vs Swarm", "ok", `${Object.keys(state.stacks).length} stack(s) ativas`)
      } else {
        push(
          checks,
          "Stacks state vs Swarm",
          "warn",
          `Faltam no Swarm: ${missing.join(", ")}. Re-deploy com \`aurora deploy <nome>\`.`,
        )
      }
    }
  }

  // 7. DNS publico das stacks com dominio
  if (state && typeof state !== "string") {
    const serverIp = await detectServerIp()
    const stacksWithDomain = Object.entries(state.stacks).filter(([, s]) => s.domain)
    for (const [name, entry] of stacksWithDomain) {
      const status = await checkDns(entry.domain!, serverIp)
      push(checks, `DNS "${entry.domain}" (${name})`, status.level, status.detail)
    }
  }

  // 8. API key Aurora MCP
  const cfg = await readUserConfig()
  if (cfg.api_key) {
    const ok = await pingAuroraMcp(cfg)
    push(checks, "API key Aurora MCP", ok ? "ok" : "warn", ok ? undefined : "Servidor inalcancavel ou key invalida")
  } else {
    push(checks, "API key Aurora MCP", "ok", "Nao configurada (IA conversacional desligada)")
  }

  // Render
  console.log(aurora.bold(aurora.teal("\naurora doctor — health check\n")))
  let hasFail = false
  let hasWarn = false
  for (const c of checks) {
    const icon = c.level === "ok" ? aurora.ok("✓") : c.level === "warn" ? aurora.warn("⚠") : aurora.err("✗")
    const detail = c.detail ? aurora.dim(` (${c.detail})`) : ""
    console.log(`  ${icon} ${c.name}${detail}`)
    if (c.level === "fail") hasFail = true
    if (c.level === "warn") hasWarn = true
  }
  console.log()
  if (hasFail) {
    console.log(aurora.err("Algumas verificacoes falharam. Veja os ✗ acima."))
    process.exit(1)
  } else if (hasWarn) {
    console.log(aurora.warn("Tudo funcional, mas atencao aos ⚠ acima."))
    process.exit(0)
  } else {
    console.log(aurora.ok("Tudo verde. Servidor pronto pra operar."))
    process.exit(0)
  }
}

function push(arr: Check[], name: string, level: Level, detail?: string): void {
  arr.push({ name, level, detail })
}

type StateOrFlag = Awaited<ReturnType<typeof readState>> | "invalid"
async function readStateSafe(): Promise<StateOrFlag> {
  try {
    return await readState()
  } catch {
    return "invalid"
  }
}

// Checa se uma porta TCP esta em uso. Considera "ok":
//   - Porta livre (ninguem escutando) — ok porque Traefik vai usar
//   - Porta usada e Traefik esta no state (provavelmente eh nosso Traefik)
// "fail" se: porta usada e nao temos Traefik (outro proc bloqueando)
async function checkPort(
  port: number,
  state: StateOrFlag,
): Promise<{ level: Level; detail: string }> {
  const inUse = await isPortInUse(port)
  if (!inUse) {
    return { level: "ok", detail: "livre" }
  }
  // Em uso. Se nosso Traefik esta no state, provavelmente eh ele.
  const hasTraefik = state && typeof state !== "string" && !!state.stacks.traefik
  if (hasTraefik) {
    return { level: "ok", detail: "em uso (provavelmente Traefik desta stack)" }
  }
  return {
    level: "fail",
    detail: `em uso por outro processo (sudo lsof -i :${port} pra investigar)`,
  }
}

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = createConnection({ host: "127.0.0.1", port, timeout: 500 })
    sock.once("connect", () => {
      sock.destroy()
      resolve(true)
    })
    sock.once("error", () => resolve(false))
    sock.once("timeout", () => {
      sock.destroy()
      resolve(false)
    })
  })
}

async function listSwarmStacks(): Promise<string[] | null> {
  try {
    const r = await exec("docker", ["stack", "ls", "--format", "{{.Name}}"], { timeoutMs: 5_000 })
    if (r.code !== 0) return null
    return r.stdout.split("\n").map((s) => s.trim()).filter((s) => s.length > 0)
  } catch {
    return null
  }
}

// Tenta descobrir o IP externo do servidor. Usa `hostname -I` em
// primeiro lugar (mais barato); fallback eh deixar undefined que o
// check de DNS tolera (vira warn em vez de fail).
async function detectServerIp(): Promise<string | undefined> {
  try {
    const r = await exec("hostname", ["-I"], { timeoutMs: 2_000 })
    if (r.code === 0) {
      const first = r.stdout.trim().split(/\s+/)[0]
      if (first && /^\d+\.\d+\.\d+\.\d+$/.test(first)) return first
    }
  } catch {
    // ignora
  }
  return undefined
}

async function checkDns(
  domain: string,
  serverIp: string | undefined,
): Promise<{ level: Level; detail: string }> {
  try {
    const r = await lookup(domain, { family: 4 })
    if (!serverIp) {
      return { level: "warn", detail: `resolve pra ${r.address} (IP do servidor desconhecido — nao consegui comparar)` }
    }
    if (r.address === serverIp) {
      return { level: "ok", detail: `aponta pra ${serverIp}` }
    }
    return {
      level: "fail",
      detail: `aponta pra ${r.address}, mas servidor eh ${serverIp}. Atualize o A record no DNS.`,
    }
  } catch (err: unknown) {
    return {
      level: "fail",
      detail: `nao resolve (${err instanceof Error ? err.message : String(err)})`,
    }
  }
}
