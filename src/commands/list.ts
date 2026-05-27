// `aurora list` — lista stacks instaladas (le /etc/aurora/server.yml).
// `aurora list --available` (alias `-a`) — mostra catalogo completo
// agrupado por categoria (stacks disponiveis pra deploy).

import { readState } from "../lib/state.js"
import { listByCategory } from "../lib/stack-registry.js"
import { aurora } from "../tui/theme.js"

export async function listCommand(opts: { available?: boolean } = {}): Promise<void> {
  if (opts.available) {
    return listAvailable()
  }
  return listInstalled()
}

async function listInstalled(): Promise<void> {
  const state = await readState()
  if (!state) {
    console.log(aurora.warn("Servidor nao inicializado. Rode `aurora init`."))
    process.exit(1)
  }
  const stacks = Object.entries(state.stacks)
  if (stacks.length === 0) {
    console.log(aurora.dim("Nenhuma stack instalada. Use `aurora deploy <stack>`."))
    console.log(aurora.dim("Ver catalogo completo: `aurora list --available`"))
    return
  }
  console.log(aurora.bold(aurora.teal(`\n${stacks.length} stack(s) instalada(s):\n`)))
  for (const [name, entry] of stacks) {
    console.log(`  ${aurora.teal("●")} ${name.padEnd(20)} ${aurora.dim(`v${entry.version}`)}`)
    if (entry.domain) console.log(`    ${aurora.dim("domain:")} ${entry.domain}`)
    if (entry.installed_at) console.log(`    ${aurora.dim("desde: ")} ${entry.installed_at.slice(0, 10)}`)
  }
}

function listAvailable(): void {
  const byCategory = listByCategory()
  if (byCategory.size === 0) {
    console.log(aurora.warn("Catalogo vazio (versao alpha — em construcao)."))
    return
  }

  let total = 0
  for (const stacks of byCategory.values()) total += stacks.length

  const wordStack = total === 1 ? "stack disponivel" : "stacks disponiveis"
  console.log(aurora.bold(aurora.teal(`\nCatalogo Aurora Stack (${total} ${wordStack}):\n`)))

  for (const [category, stacks] of byCategory) {
    console.log(`${aurora.bold(category)} ${aurora.dim(`(${stacks.length})`)}`)
    for (const s of stacks) {
      console.log(`  ${aurora.teal("●")} ${s.name.padEnd(20)} ${aurora.dim(`v${s.version} · ${s.description}`)}`)
    }
    console.log("")
  }

  console.log(aurora.dim("Para instalar: `aurora deploy <nome>`"))
}
