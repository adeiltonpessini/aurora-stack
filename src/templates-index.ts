// Catalogo de stacks registradas. Cada template em /templates/<nome>/
// eh importado aqui pra que o tsup bundle-os no dist final (templates
// fora de src/ nao seriam puxados pelo bundler).
//
// Convencao por template:
//   import <name> from "../templates/<name>/template.js"
//   const <name>Dir = fileURLToPath(new URL("../templates/<name>", import.meta.url))
//
// Cada entrada de registeredStacks combina a definicao com o templateDir
// resolvido. Em runtime o registry usa templateDir + composeTemplate
// pra ler o arquivo .tmpl do disco.

import { fileURLToPath } from "node:url"
import type { RegisteredStack } from "./lib/stack-def.js"

// Lista preenchida nas Tasks 7-9 (Traefik, Portainer, Postgres) e
// expandida em batches subsequentes (95 stacks final).
//
// Marcador "STACK-IMPORTS" — ferramentas de scaffold/script de catalogo
// procuram por esse comentario pra saber onde injetar imports novos.

// STACK-IMPORTS-START

// STACK-IMPORTS-END

export const registeredStacks: RegisteredStack[] = [
  // STACK-ENTRIES-START
  // STACK-ENTRIES-END
]

// Helper exportado pra resolver pasta-base de um template a partir de
// uma URL (usado dentro do templates-index quando preenchermos as
// entradas). Vive aqui pra centralizar o pattern.
export function templateDir(metaUrl: string): string {
  return fileURLToPath(new URL(".", metaUrl))
}
