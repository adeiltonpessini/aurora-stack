// `aurora deploy <stack>` — wizard interativo:
//   1. Resolve a stack no catalogo
//   2. Garante state (init rodou)
//   3. Se ja instalada, confirma sobrescrever
//   4. Pergunta vars (preservando valores do state em re-deploy)
//   5. Renderiza compose.tmpl + escreve /opt/aurora/stacks/<name>.yml
//   6. Escreve /opt/aurora/configs/<name>.env (chmod 600, contem senhas)
//   7. Roda `docker stack deploy -c <yml> <name>`
//   8. Atualiza state com versao + vars + domain primario

import { readFile, writeFile, mkdir, chmod } from "node:fs/promises"
import { join } from "node:path"
import { findStack } from "../lib/stack-registry.js"
import { renderTemplate } from "../lib/template-render.js"
import { promptForVars } from "../lib/var-prompt.js"
import { exec } from "../lib/exec.js"
import { readState, writeState } from "../lib/state.js"
import { requireRoot } from "../lib/root.js"
import { PATHS } from "../lib/paths.js"
import { intro, outro, note, askConfirm } from "../tui/prompt.js"
import { withSpinner } from "../tui/spinner.js"
import { aurora, printBanner } from "../tui/theme.js"

export async function deployCommand(stackName?: string): Promise<void> {
  if (!stackName) {
    console.error(aurora.err("Uso: aurora deploy <nome-da-stack>"))
    console.error(aurora.dim("Exemplo: aurora deploy traefik"))
    console.error(aurora.dim("Ver catalogo completo: aurora list --available"))
    process.exit(1)
  }

  const stack = findStack(stackName)
  if (!stack) {
    throw new Error(
      `Stack "${stackName}" nao encontrada no catalogo. Rode \`aurora list --available\` pra ver opcoes.`,
    )
  }

  const state = await readState()
  if (!state) {
    throw new Error(
      `Servidor nao foi inicializado. Rode \`aurora init\` primeiro antes do deploy.`,
    )
  }

  requireRoot()
  printBanner()
  intro(`aurora deploy ${stack.name} — ${stack.displayName}`)

  // Re-deploy: ja existe entry? Confirma sobrescrever.
  const existing = state.stacks[stack.name]
  if (existing) {
    note(
      `${stack.displayName} ja esta instalada (v${existing.version}, desde ${existing.installed_at.slice(0, 10)}).\nRedeploy vai pedir as vars de novo (defaults = valores atuais).\nVolumes/dados sao preservados.`,
      "Re-deploy",
    )
    const proceed = await askConfirm("Continuar com re-deploy?", true)
    if (!proceed) {
      outro(aurora.warn("Cancelado."))
      return
    }
  }

  // Coleta as vars
  note(stack.description, "Configurando vars")
  const vars = await promptForVars(stack.vars, existing?.vars)

  // Renderiza o compose
  const tmplPath = join(stack.templateDir, stack.composeTemplate)
  const tmplRaw = await readFile(tmplPath, "utf8")
  const composeBody = renderTemplate(tmplRaw, vars)

  // Caminhos finais
  const composeOut = join(PATHS.stacksDir, `${stack.name}.yml`)
  const envOut = join(PATHS.configsDir, `${stack.name}.env`)

  await withSpinner(
    "Escrevendo arquivos da stack",
    async () => {
      await mkdir(PATHS.stacksDir, { recursive: true, mode: 0o755 })
      await mkdir(PATHS.configsDir, { recursive: true, mode: 0o755 })

      await writeFile(composeOut, composeBody, "utf8")

      // Env file: KEY=VALUE por linha. Senhas estao aqui, entao chmod 600.
      const envBody = Object.entries(vars)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n"
      await writeFile(envOut, envBody, "utf8")
      await chmod(envOut, 0o600)
    },
    "Arquivos gravados",
  )

  // Deploy via Swarm
  await withSpinner(
    `Subindo ${stack.name} no Docker Swarm`,
    async () => {
      const r = await exec(
        "docker",
        ["stack", "deploy", "-c", composeOut, stack.name, "--with-registry-auth"],
        { timeoutMs: 120_000 },
      )
      if (r.code !== 0) {
        throw new Error(`docker stack deploy falhou (code ${r.code}): ${r.stderr}`)
      }
    },
    `${stack.name} subiu (Swarm orquestrando)`,
  )

  // Atualiza state
  const primaryDomain = stack.primaryDomain?.(vars)
  state.stacks[stack.name] = {
    version: stack.version,
    installed_at: existing?.installed_at ?? new Date().toISOString(),
    config_path: envOut,
    ...(primaryDomain ? { domain: primaryDomain } : {}),
    vars,
  }
  await writeState(state)

  if (primaryDomain) {
    outro(
      aurora.ok(
        `${stack.displayName} pronta! Acesse: ${aurora.bold(`https://${primaryDomain}`)}\nLogs: \`aurora logs ${stack.name}\``,
      ),
    )
  } else {
    outro(
      aurora.ok(
        `${stack.displayName} pronta! Veja status: \`aurora status\` · Logs: \`aurora logs ${stack.name}\``,
      ),
    )
  }
}
