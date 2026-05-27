// Config local do USUÁRIO em ~/.aurora/config.json. Contém API key
// Aurora MCP — por isso mode 0600 (só dono lê). Diferente de
// /etc/aurora/server.yml que é estado do SERVIDOR (mode 0644).

import { readFile, writeFile, mkdir, chmod } from "node:fs/promises"
import { PATHS } from "./paths.js"
import { UserConfigSchema, type UserConfig } from "../types.js"

export function defaultUserConfig(): UserConfig {
  return {
    api_base_url: "https://aurora-mcp.com",
    telemetry_enabled: false,
  }
}

export async function readUserConfig(): Promise<UserConfig> {
  let raw: string
  try {
    raw = await readFile(PATHS.userConfigFile, "utf8")
  } catch (err: any) {
    if (err.code === "ENOENT") return defaultUserConfig()
    throw err
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return defaultUserConfig()
  }
  const result = UserConfigSchema.safeParse(parsed)
  return result.success ? result.data : defaultUserConfig()
}

export async function writeUserConfig(cfg: UserConfig): Promise<void> {
  await mkdir(PATHS.userConfigDir, { recursive: true, mode: 0o700 })
  await writeFile(PATHS.userConfigFile, JSON.stringify(cfg, null, 2), "utf8")
  await chmod(PATHS.userConfigFile, 0o600)
}
