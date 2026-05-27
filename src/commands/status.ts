// `aurora status` — snapshot do servidor: CPU, RAM, disco, uptime,
// containers, stacks instaladas. Tudo via comandos locais (sem rede).

import { readState } from "../lib/state.js"
import { exec } from "../lib/exec.js"
import { aurora } from "../tui/theme.js"
import { cpus, totalmem, freemem, uptime, hostname } from "node:os"

export async function statusCommand(): Promise<void> {
  const state = await readState()
  const ramTotalGb = (totalmem() / 1024 ** 3).toFixed(1)
  const ramFreeGb = (freemem() / 1024 ** 3).toFixed(1)
  const ramUsedPct = (((totalmem() - freemem()) / totalmem()) * 100).toFixed(0)
  const cpuCount = cpus().length
  const upDays = (uptime() / 86400).toFixed(1)

  console.log(aurora.bold(aurora.teal("\nAurora Stack — Status\n")))
  // Header bonito: prioriza display_name quando existe (mais amigavel
  // em IA contextual e alertas), com hostname tecnico em dim ao lado.
  if (state?.server.display_name && state.server.display_name !== state.server.hostname) {
    console.log(`  ${aurora.dim("Servidor")}    ${aurora.bold(state.server.display_name)} ${aurora.dim(`(${hostname()})`)}`)
  } else {
    console.log(`  ${aurora.dim("Hostname")}    ${hostname()}`)
  }
  if (state?.server.timezone) {
    console.log(`  ${aurora.dim("Timezone")}    ${state.server.timezone}`)
  }
  if (state?.server.admin_email) {
    console.log(`  ${aurora.dim("Admin")}       ${state.server.admin_email}`)
  }
  if (state?.server.network_name) {
    console.log(`  ${aurora.dim("Rede")}        ${state.server.network_name}`)
  }
  console.log(`  ${aurora.dim("Uptime")}      ${upDays}d`)
  console.log(`  ${aurora.dim("CPU")}         ${cpuCount} cores`)
  console.log(`  ${aurora.dim("RAM")}         ${ramUsedPct}% usado (${ramFreeGb}/${ramTotalGb} GB livre)`)

  // Disco em /opt/aurora
  try {
    const r = await exec("df", ["-h", "/opt/aurora"], { timeoutMs: 5_000 })
    const line = r.stdout.split("\n")[1]?.trim()
    if (line) {
      const parts = line.split(/\s+/)
      console.log(`  ${aurora.dim("Disco")}       ${parts[2] ?? "?"}/${parts[1] ?? "?"} usado (${parts[4] ?? "?"})`)
    }
  } catch {
    // disco unavailable — segue
  }

  // Containers ativos
  try {
    const r = await exec("docker", ["ps", "--format", "{{.Names}}"], { timeoutMs: 5_000 })
    const containers = r.stdout.split("\n").filter((s) => s.trim().length > 0)
    console.log(`  ${aurora.dim("Containers")}  ${containers.length} ativos`)
  } catch {
    console.log(`  ${aurora.dim("Containers")}  ${aurora.err("docker indisponível")}`)
  }

  // Stacks instaladas
  if (state) {
    const entries = Object.entries(state.stacks)
    console.log(`\n${aurora.bold("Stacks instaladas")} (${entries.length}):\n`)
    if (entries.length === 0) {
      console.log(aurora.dim("  Nenhuma. Use `aurora deploy <stack>` pra instalar."))
    } else {
      for (const [name, s] of entries) {
        console.log(`  ${aurora.teal("●")} ${name.padEnd(20)} ${aurora.dim(`v${s.version} · ${s.installed_at.slice(0, 10)}`)}`)
      }
    }
  } else {
    console.log(aurora.warn(`\n⚠ Servidor não foi inicializado. Rode \`aurora init\` primeiro.\n`))
  }
}
