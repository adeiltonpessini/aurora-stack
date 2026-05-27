// Read/write do estado em /etc/aurora/server.yml. Validação via zod —
// se YAML estiver corrompido, joga erro com mensagem clara em vez de
// retornar lixo silencioso. Mode 0644 (root-only write) é OK porque a
// CLI roda como root quando muda estado.

import { readFile, writeFile, mkdir, chmod } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { hostname } from "node:os"
import { dump as yamlDump, load as yamlLoad } from "js-yaml"
import { PATHS } from "./paths.js"
import { ServerStateSchema, type ServerState } from "../types.js"

export function initialState(host: string, cliVersion: string): ServerState {
  return {
    version: 1,
    server: {
      id: randomUUID(),
      hostname: host,
      installed_at: new Date().toISOString(),
      cli_version: cliVersion,
    },
    stacks: {},
  }
}

export async function readState(): Promise<ServerState | null> {
  let raw: string
  try {
    raw = await readFile(PATHS.serverStateFile, "utf8")
  } catch (err: any) {
    if (err.code === "ENOENT") return null
    throw err
  }

  let parsed: unknown
  try {
    parsed = yamlLoad(raw)
  } catch (err: any) {
    throw new Error(`server.yml inválido (YAML parse error): ${err.message}`)
  }

  const result = ServerStateSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `server.yml inválido (schema): ${result.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}`,
    )
  }
  return result.data
}

export async function writeState(state: ServerState): Promise<void> {
  await mkdir(PATHS.serverStateDir, { recursive: true })
  const yaml = yamlDump(state, { noRefs: true, indent: 2, lineWidth: 100 })
  await writeFile(PATHS.serverStateFile, yaml, "utf8")
  await chmod(PATHS.serverStateFile, 0o644)
}

export function defaultHostname(): string {
  return hostname()
}
