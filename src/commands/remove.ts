// `aurora remove <stack>` — desinstala stack. Por seguranca:
//   - Pede confirmacao explicita (nao tem --yes intencional no v0.1)
//   - PRESERVA volumes em /opt/aurora/volumes/<name>/* (dados ficam)
//   - PRESERVA configs em /opt/aurora/configs/<name>.env (reinstalar sem reperguntar)
//   - Remove apenas o stack do Swarm + entry do state
//
// Volumes ficarem propositais: usuario que quer wipe completo usa
// `docker volume prune` ou `rm -rf /opt/aurora/volumes/<name>` manual.
// Defaults conservadores >>> defaults destrutivos.

import { findStack } from "../lib/stack-registry.js"
import { exec } from "../lib/exec.js"
import { readState, writeState } from "../lib/state.js"
import { requireRoot } from "../lib/root.js"
import { intro, outro, note, askConfirm } from "../tui/prompt.js"
import { withSpinner } from "../tui/spinner.js"
import { aurora, printBanner } from "../tui/theme.js"

export async function removeCommand(stackName?: string): Promise<void> {
  if (!stackName) {
    console.error(aurora.err("Uso: aurora remove <nome-da-stack>"))
    process.exit(1)
  }

  const state = await readState()
  if (!state) {
    throw new Error("Servidor nao foi inicializado. Rode `aurora init` primeiro.")
  }

  const entry = state.stacks[stackName]
  if (!entry) {
    throw new Error(
      `Stack "${stackName}" nao esta instalada. Veja stacks ativas com \`aurora list\`.`,
    )
  }

  requireRoot()
  printBanner()
  intro(`aurora remove ${stackName}`)

  // Tenta achar a definicao no catalogo (pode nao achar se stack foi
  // instalada por uma versao mais nova da CLI; nesse caso teardown
  // default eh suficiente).
  const stack = findStack(stackName)

  note(
    `Vou remover ${stackName} (v${entry.version}, desde ${entry.installed_at.slice(0, 10)}).\n` +
      `${aurora.warn("Volumes em /opt/aurora/volumes/" + stackName + " sao PRESERVADOS.")}\n` +
      `${aurora.dim("Pra wipe total: docker volume prune apos remove.")}`,
    "Atencao",
  )

  const proceed = await askConfirm(`Remover stack "${stackName}"?`, false)
  if (!proceed) {
    outro(aurora.dim("Cancelado. Stack mantida."))
    return
  }

  // Executa teardown (default ou customizado da stack)
  const commands = stack?.teardown ?? [`docker stack rm ${stackName}`]

  for (const cmdLine of commands) {
    const parts = cmdLine.split(/\s+/)
    const cmd = parts[0]
    const args = parts.slice(1)
    await withSpinner(
      `Executando: ${cmdLine}`,
      async () => {
        const r = await exec(cmd, args, { timeoutMs: 60_000 })
        if (r.code !== 0) {
          // Nao aborta: docker stack rm ja-removida retorna != 0 sem ser
          // erro pratico. Soh loga e continua.
          console.error(aurora.warn(`  (warn) ${cmdLine} retornou code ${r.code}: ${r.stderr.trim()}`))
        }
      },
      `OK: ${cmdLine}`,
    )
  }

  // Limpa state
  delete state.stacks[stackName]
  await writeState(state)

  outro(aurora.ok(`${stackName} removida. Volumes preservados em /opt/aurora/volumes/${stackName}/`))
}
