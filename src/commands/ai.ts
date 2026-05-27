// `aurora ai "<frase>"` — esqueleto. Lógica completa no Plano C
// (chama POST /api/v1/ai/intent, parse de plano, execução step-a-step).

import { aurora } from "../tui/theme.js"

export async function aiCommand(query?: string): Promise<void> {
  if (!query) {
    console.error(aurora.err('Uso: aurora ai "<sua frase em pt-BR>"'))
    console.error(aurora.dim('Exemplo: aurora ai "instala n8n com postgres e backup"'))
    process.exit(1)
  }
  console.log(aurora.warn(`\n⚠ IA conversacional ainda não disponível no Plano A.\n`))
  console.log(aurora.dim("Será ativada no Plano C (integração com aurora-mcp.com/api/v1/ai/intent)."))
  process.exit(1)
}
