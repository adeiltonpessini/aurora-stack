// `aurora remove <stack>` — esqueleto. Vai virar funcional no Plano B
// (precisa do template pra saber `teardown:`).

import { aurora } from "../tui/theme.js"

export async function removeCommand(stack?: string): Promise<void> {
  if (!stack) {
    console.error(aurora.err("Uso: aurora remove <nome-da-stack>"))
    process.exit(1)
  }
  console.log(aurora.warn(`\n⚠ Removal ainda não implementado no Plano A.\n`))
  console.log(aurora.dim("Será ativado no Plano B junto com os templates."))
  process.exit(1)
}
