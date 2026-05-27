// `aurora deploy <stack>` — esqueleto. No Plano A não temos templates
// implementados (vem no Plano B). Por enquanto retorna mensagem
// explicando que será suportado em breve. Deixar o esqueleto cria a
// estrutura pra Plano B preencher.

import { aurora } from "../tui/theme.js"

export async function deployCommand(stack?: string): Promise<void> {
  if (!stack) {
    console.error(aurora.err("Uso: aurora deploy <nome-da-stack>"))
    console.error(aurora.dim("Exemplo: aurora deploy traefik"))
    process.exit(1)
  }
  console.log(aurora.warn(`\n⚠ Templates de stacks ainda não implementados no Plano A.\n`))
  console.log(aurora.dim(`O comando \`aurora deploy ${stack}\` será ativado quando o Plano B (templates) for executado.`))
  console.log(aurora.dim("Por enquanto, veja o roadmap em https://stack.aurora-mcp.com"))
  process.exit(1)
}
