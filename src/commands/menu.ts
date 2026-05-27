// Menu interativo quando `aurora` é chamado sem args. UX inspirada no
// SetupOrion (menu numerado de opções) mas com tema Aurora e fluxo de
// confirmação. Usa Clack select pra navegação por setas.

import { askSelect } from "../tui/prompt.js"
import { printBanner, aurora } from "../tui/theme.js"
import { statusCommand } from "./status.js"
import { listCommand } from "./list.js"
import { doctorCommand } from "./doctor.js"

type MenuAction = "deploy" | "list" | "status" | "doctor" | "ai" | "init" | "exit"

export async function menuCommand(): Promise<void> {
  printBanner()
  const choice = await askSelect<MenuAction>("O que deseja fazer?", [
    { value: "init", label: "Preparar servidor", hint: "aurora init" },
    { value: "deploy", label: "Instalar aplicação", hint: "[catálogo] (Plano B)" },
    { value: "list", label: "Gerenciar aplicações instaladas" },
    { value: "ai", label: "Aurora IA (conversacional)", hint: "[Plano C]" },
    { value: "status", label: "Status do servidor" },
    { value: "doctor", label: "Health check (doctor)" },
    { value: "exit", label: "Sair" },
  ])

  switch (choice) {
    case "init": {
      const { initCommand } = await import("./init.js")
      await initCommand()
      break
    }
    case "list":
      await listCommand()
      break
    case "status":
      await statusCommand()
      break
    case "doctor":
      await doctorCommand()
      break
    case "deploy":
      console.log(aurora.dim("\nUse `aurora deploy <stack>` (templates virão no Plano B)."))
      break
    case "ai":
      console.log(aurora.dim("\nUse `aurora ai \"<frase>\"` (disponível no Plano C)."))
      break
    case "exit":
    default:
      console.log(aurora.dim("Até mais."))
      process.exit(0)
  }
}
