// Catalogo de stacks registradas. Cada template em /templates/<nome>/
// eh importado aqui pra que o tsup bundle-os no dist final (templates
// fora de src/ nao seriam puxados pelo bundler).

import { fileURLToPath } from "node:url"
import type { RegisteredStack } from "./lib/stack-def.js"

// STACK-IMPORTS-START
import traefik from "../templates/traefik/template.js"
import portainer from "../templates/portainer/template.js"
import postgres from "../templates/postgres/template.js"
// STACK-IMPORTS-END

// Helper pra resolver pasta-base de um template a partir da URL do
// templates-index.ts. Construimos paths relativos ao __dirname pra
// que `composeTemplate` (que eh relativo) seja resolvido corretamente
// em runtime — tanto rodando via `tsx` (src/) quanto via dist bundle.
const here = fileURLToPath(new URL(".", import.meta.url))

function withDir(stack: typeof traefik, dirName: string): RegisteredStack {
  return { ...stack, templateDir: resolveTemplateDir(dirName) }
}

function resolveTemplateDir(name: string): string {
  // Em dev (tsx via src/), templates/ esta um nivel acima de src/.
  // Em build (tsup), o bundle vai ficar em dist/, mas como o bundle eh
  // um unico arquivo .js, NAO conseguimos resolver pasta de template
  // relativa a ele. Solucao: tsup copia templates/ pra dist/templates/
  // (vamos configurar via tsup.config.ts antes do release).
  return fileURLToPath(new URL(`../templates/${name}/`, import.meta.url))
}
// here eh exportado pra debug em `aurora doctor`, nao eh load-bearing
export const indexDir = here

export const registeredStacks: RegisteredStack[] = [
  // STACK-ENTRIES-START
  withDir(traefik, "traefik"),
  withDir(portainer, "portainer"),
  withDir(postgres, "postgres"),
  // STACK-ENTRIES-END
]
