// `aurora list` — lista stacks instaladas (lê /etc/aurora/server.yml).

import { readState } from "../lib/state.js"
import { aurora } from "../tui/theme.js"

export async function listCommand(): Promise<void> {
  const state = await readState()
  if (!state) {
    console.log(aurora.warn("Servidor não inicializado. Rode `aurora init`."))
    process.exit(1)
  }
  const stacks = Object.entries(state.stacks)
  if (stacks.length === 0) {
    console.log(aurora.dim("Nenhuma stack instalada. Use `aurora deploy <stack>`."))
    return
  }
  console.log(aurora.bold(aurora.teal(`\n${stacks.length} stack(s) instalada(s):\n`)))
  for (const [name, entry] of stacks) {
    console.log(`  ${aurora.teal("●")} ${name.padEnd(20)} ${aurora.dim(`v${entry.version}`)}`)
    if (entry.domain) console.log(`    ${aurora.dim("domain:")} ${entry.domain}`)
    if (entry.installed_at) console.log(`    ${aurora.dim("desde: ")} ${entry.installed_at.slice(0, 10)}`)
  }
}
