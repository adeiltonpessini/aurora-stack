// `aurora upgrade` — atualiza o pacote npm global pra última versão.
// Simples: dispara npm install -g e mostra output.

import { exec } from "../lib/exec.js"
import { aurora } from "../tui/theme.js"
import { withSpinner } from "../tui/spinner.js"

export async function upgradeCommand(): Promise<void> {
  console.log(aurora.bold(aurora.teal("Atualizando Aurora Stack...\n")))
  await withSpinner(
    "Baixando última versão",
    async () => {
      const r = await exec("npm", ["install", "-g", "@aurorabr/stack@latest"], {
        timeoutMs: 120_000,
      })
      if (r.code !== 0) {
        throw new Error(`npm install falhou: ${r.stderr.trim()}`)
      }
    },
    "Aurora Stack atualizado ✓",
  )
  console.log(aurora.dim("\nRode `aurora --version` pra confirmar."))
}
