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
    // hostname tecnico (vem do OS, ex: "aurora-test-debian13" do Hetzner).
    // Persistido pra detectar mudancas — se o usuario renomear no /etc/hostname,
    // a gente avisa.
    hostname: z.string(),
    // Nome amigavel que o dono escolhe no `aurora init`. Aparece em
    // `aurora status`, contexto da IA, alertas. Pode ser igual ao hostname
    // tecnico ou algo como "Servidor Producao - Sao Paulo".
    display_name: z.string().default(""),
    // Email do dono/admin do servidor. Usado pra alertas Aurora (notify
    // do Plano C) e contexto IA. Opcional — sem email a IA segue funcionando
    // mas nao manda email de "deploy completo" / "stack offline".
    // NAO eh email do Let's Encrypt — esse vai por stack no deploy.
    admin_email: z.string().email().optional(),
    // Timezone IANA (ex: "America/Sao_Paulo"). Usado em cron schedules,
    // formatacao de logs em `aurora status`, agendamento de backup.
    // Default Sao_Paulo porque maioria dos usuarios alvo eh BR; pode ser
    // qualquer Olson timezone.
    timezone: z.string().default("America/Sao_Paulo"),
    // Nome da overlay network do Swarm usada por todas as stacks. Default
    // "aurora-net". Configuravel porque pode haver overlays preexistentes
    // (ex: "network_public" do SetupOrion) que o dono quer reaproveitar
    // pra nao re-attachar tudo, ou pra evitar conflito.
    network_name: z.string().default("aurora-net"),
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
