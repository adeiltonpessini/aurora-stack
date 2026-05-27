// `aurora logs <stack>` — tail dos logs da stack Swarm.
// Wrapper sobre `docker service logs --tail 100 -f <stack>_<service>`.
// Como cada stack pode ter N services, usamos `--format` pra puxar tudo.

import { spawn } from "node:child_process"
import { aurora } from "../tui/theme.js"

export function logsCommand(stack: string): void {
  if (!stack) {
    console.error(aurora.err("Uso: aurora logs <stack>"))
    process.exit(1)
  }
  // Filtra serviços que começam com <stack>_ (convenção Swarm).
  // Não usamos exec() wrapper aqui porque queremos streaming live —
  // o exec() captura tudo antes de retornar. Spawn direto + inherit stdio.
  const child = spawn(
    "sh",
    [
      "-c",
      `docker service ls --filter "name=${stack}_" --format "{{.Name}}" | xargs -I {} docker service logs --tail 50 -f {}`,
    ],
    { stdio: "inherit" },
  )
  child.on("error", (err) => {
    console.error(aurora.err(`Falha ao buscar logs: ${err.message}`))
    process.exit(1)
  })
}
