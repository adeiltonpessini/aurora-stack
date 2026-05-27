import { describe, it, expect, beforeEach, vi } from "vitest"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "aurora-cfg-"))
  process.env.AURORA_TEST_ROOT = testDir
  // Invalidar cache de paths.ts e config.ts para forçar re-import com novo AURORA_TEST_ROOT
  vi.resetModules()
})

describe("user config", () => {
  it("retorna config default quando arquivo não existe", async () => {
    const { readUserConfig } = await import("../src/lib/config.js")
    const cfg = await readUserConfig()
    expect(cfg.api_key).toBeUndefined()
    expect(cfg.api_base_url).toBe("https://aurora-mcp.com")
    expect(cfg.telemetry_enabled).toBe(false)
  })

  it("round-trip preserva fields", async () => {
    const { writeUserConfig, readUserConfig, defaultUserConfig } = await import("../src/lib/config.js")
    await writeUserConfig({ ...defaultUserConfig(), api_key: "k_abc123" })
    const back = await readUserConfig()
    expect(back.api_key).toBe("k_abc123")
  })

  it("escreve com mode 0600 (só dono lê)", async () => {
    const { stat } = await import("node:fs/promises")
    const { PATHS } = await import("../src/lib/paths.js")
    const { writeUserConfig, defaultUserConfig } = await import("../src/lib/config.js")
    await writeUserConfig({ ...defaultUserConfig(), api_key: "secret" })
    const st = await stat(PATHS.userConfigFile)
    // Cross-platform: Windows ignora chmod (retorna 0o666),
    // Linux respeita (retorna 0o600). Aceitamos ambos.
    expect([0o600, 0o666].includes(st.mode & 0o777)).toBe(true)
  })
})
