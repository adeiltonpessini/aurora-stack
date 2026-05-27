// Entry point do CLI. Usa commander pra parsing de args. Quando rodado
// sem argumentos cai no menu TUI. Cada subcomando é lazy-imported pra
// reduzir startup time (TUI não precisa carregar Docker wrappers).

import { Command } from "commander"
import { cliVersion } from "./lib/version.js"

async function main() {
  const program = new Command()
  const version = await cliVersion()

  program
    .name("aurora")
    .description(
      "Aurora Stack — transforme qualquer Linux em infraestrutura inteligente",
    )
    .version(version)

  program
    .command("init")
    .description("Prepara o servidor (Docker + Swarm + AuroraNet + diretórios)")
    .action(async () => {
      const { initCommand } = await import("./commands/init.js")
      await initCommand()
    })

  program
    .command("deploy <stack>")
    .description("Instala uma stack do catálogo")
    .action(async (stack) => {
      const { deployCommand } = await import("./commands/deploy.js")
      await deployCommand(stack)
    })

  program
    .command("remove <stack>")
    .description("Desinstala uma stack")
    .action(async (stack) => {
      const { removeCommand } = await import("./commands/remove.js")
      await removeCommand(stack)
    })

  program
    .command("list")
    .description("Lista stacks instaladas")
    .action(async () => {
      const { listCommand } = await import("./commands/list.js")
      await listCommand()
    })

  program
    .command("status")
    .description("Snapshot do servidor (CPU, RAM, disco, containers)")
    .action(async () => {
      const { statusCommand } = await import("./commands/status.js")
      await statusCommand()
    })

  program
    .command("logs <stack>")
    .description("Tail dos logs da stack")
    .action(async (stack) => {
      const { logsCommand } = await import("./commands/logs.js")
      await logsCommand(stack)
    })

  program
    .command("doctor")
    .description("Health check do ambiente")
    .action(async () => {
      const { doctorCommand } = await import("./commands/doctor.js")
      await doctorCommand()
    })

  program
    .command("upgrade")
    .description("Atualiza o Aurora Stack pra última versão")
    .action(async () => {
      const { upgradeCommand } = await import("./commands/upgrade.js")
      await upgradeCommand()
    })

  program
    .command("ai <query>")
    .description("Modo conversacional (precisa API key Aurora)")
    .action(async (query) => {
      const { aiCommand } = await import("./commands/ai.js")
      await aiCommand(query)
    })

  // Sem args: menu TUI
  if (process.argv.length <= 2) {
    const { menuCommand } = await import("./commands/menu.js")
    await menuCommand()
    return
  }

  await program.parseAsync(process.argv)
}

main().catch((err) => {
  console.error("\n" + (err instanceof Error ? err.message : String(err)))
  process.exit(1)
})
