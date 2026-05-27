// Tipos compartilhados entre commands/, lib/ e tui/. Mantemos eles aqui
// (não dentro dos módulos que usam) pra evitar ciclos de import e
// porque vão ser referenciados por TODOS os comandos.

import { z } from "zod"

// Estado persistido em /etc/aurora/server.yml. Schema com zod pra
// validar quando lê do disco (defesa contra YAML corrompido).
export const StackEntrySchema = z.object({
  version: z.string(),
  installed_at: z.string(), // ISO 8601
  config_path: z.string().optional(),
  domain: z.string().optional(),
  vars: z.record(z.string()).optional(),
})
export type StackEntry = z.infer<typeof StackEntrySchema>

export const ServerStateSchema = z.object({
  version: z.literal(1),
  server: z.object({
    id: z.string().uuid(),
    hostname: z.string(),
    installed_at: z.string(),
    cli_version: z.string(),
  }),
  stacks: z.record(StackEntrySchema).default({}),
})
export type ServerState = z.infer<typeof ServerStateSchema>

// Config local do usuário (~/.aurora/config.json) — credenciais.
export const UserConfigSchema = z.object({
  api_key: z.string().optional(),
  api_base_url: z.string().url().default("https://aurora-mcp.com"),
  telemetry_enabled: z.boolean().default(false),
})
export type UserConfig = z.infer<typeof UserConfigSchema>

// Resultado de exec wrapper.
export interface ExecResult {
  code: number
  stdout: string
  stderr: string
  durationMs: number
}

// Info do SO retornada por lib/os.ts.
export interface OsInfo {
  id: string // "debian"
  versionId: string // "12"
  prettyName: string
  isSupported: boolean
}
