// `aurora doctor` — health check ambiente. Verifica:
//   • Docker rodando
//   • Swarm ativo
//   • aurora-net existe
//   • /opt/aurora estrutura íntegra
//   • /etc/aurora/server.yml válido
//   • API key Aurora MCP funciona (se setada)

import { access } from "node:fs/promises"
import { join } from "node:path"
import { dockerInstalled, dockerSwarmActive, networkExists } from "../lib/docker.js"
import { readState } from "../lib/state.js"
import { readUserConfig } from "../lib/config.js"
import { pingAuroraMcp } from "../lib/api.js"
import { PATHS, AURORA_NET, STATE_SUBDIRS } from "../lib/paths.js"
import { aurora } from "../tui/theme.js"

interface Check {
  name: string
  ok: boolean
  detail?: string
}

export async function doctorCommand(): Promise<void> {
  const checks: Check[] = []

  // Docker
  checks.push({ name: "Docker instalado", ok: await dockerInstalled() })
  if (checks.at(-1)!.ok) {
    checks.push({ name: "Docker Swarm ativo", ok: await dockerSwarmActive() })
    try {
      checks.push({ name: `Network ${AURORA_NET}`, ok: await networkExists(AURORA_NET) })
    } catch (err: any) {
      checks.push({ name: `Network ${AURORA_NET}`, ok: false, detail: err.message })
    }
  }

  // Estrutura
  let structOk = true
  for (const sub of STATE_SUBDIRS) {
    try {
      await access(join(PATHS.auroraRoot, sub))
    } catch {
      structOk = false
      break
    }
  }
  checks.push({ name: "Estrutura /opt/aurora", ok: structOk })

  // server.yml
  try {
    const s = await readState()
    checks.push({ name: "/etc/aurora/server.yml válido", ok: s !== null, detail: s ? undefined : "Ausente — rode `aurora init`" })
  } catch (err: any) {
    checks.push({ name: "/etc/aurora/server.yml válido", ok: false, detail: err.message })
  }

  // API key
  const cfg = await readUserConfig()
  if (cfg.api_key) {
    const ok = await pingAuroraMcp(cfg)
    checks.push({ name: "API key Aurora MCP funcional", ok, detail: ok ? undefined : "Servidor inalcançável ou key inválida" })
  } else {
    checks.push({ name: "API key Aurora MCP", ok: true, detail: "Não configurada (IA conversacional desligada)" })
  }

  // Render
  console.log(aurora.bold(aurora.teal("\naurora doctor — health check\n")))
  let allGreen = true
  for (const c of checks) {
    const icon = c.ok ? aurora.ok("✓") : aurora.err("✗")
    const detail = c.detail ? aurora.dim(` (${c.detail})`) : ""
    console.log(`  ${icon} ${c.name}${detail}`)
    if (!c.ok) allGreen = false
  }
  console.log()
  if (allGreen) {
    console.log(aurora.ok("Tudo verde. Servidor pronto pra operar."))
    process.exit(0)
  } else {
    console.log(aurora.err("Algumas verificações falharam. Revise acima."))
    process.exit(1)
  }
}
