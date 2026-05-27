import { describe, it, expect, beforeEach, vi } from "vitest"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "aurora-test-"))
  process.env.AURORA_TEST_ROOT = testDir
  // Invalidar cache de paths.ts e state.ts para forçar re-import com novo AURORA_TEST_ROOT
  vi.resetModules()
})

describe("state YAML round-trip", () => {
  it("retorna null quando server.yml não existe", async () => {
    const { readState } = await import("../src/lib/state.js")
    const state = await readState()
    expect(state).toBeNull()
  })

  it("write + read preservam estrutura", async () => {
    const { readState, writeState, initialState } = await import("../src/lib/state.js")
    const s = initialState("test-host", "0.1.0")
    await writeState(s)
    const back = await readState()
    expect(back).not.toBeNull()
    expect(back!.server.hostname).toBe("test-host")
    expect(back!.server.cli_version).toBe("0.1.0")
    expect(back!.stacks).toEqual({})
  })

  it("initialState aplica defaults: display_name=hostname, timezone=America/Sao_Paulo, sem admin_email", async () => {
    const { initialState } = await import("../src/lib/state.js")
    const s = initialState("meu-host", "0.1.0")
    expect(s.server.display_name).toBe("meu-host") // default = hostname
    expect(s.server.timezone).toBe("America/Sao_Paulo")
    expect(s.server.admin_email).toBeUndefined()
  })

  it("initialState aceita extras (display_name + admin_email + timezone)", async () => {
    const { initialState } = await import("../src/lib/state.js")
    const s = initialState("tech-host", "0.1.0", {
      display_name: "Produção SP",
      admin_email: "ops@empresa.com",
      timezone: "America/Manaus",
    })
    expect(s.server.hostname).toBe("tech-host")
    expect(s.server.display_name).toBe("Produção SP")
    expect(s.server.admin_email).toBe("ops@empresa.com")
    expect(s.server.timezone).toBe("America/Manaus")
  })

  it("round-trip com extras preserva display_name + admin_email + timezone", async () => {
    const { readState, writeState, initialState } = await import("../src/lib/state.js")
    const s = initialState("h", "0.1.0", {
      display_name: "Servidor Cliente Acme",
      admin_email: "admin@acme.com",
      timezone: "UTC",
    })
    await writeState(s)
    const back = await readState()
    expect(back!.server.display_name).toBe("Servidor Cliente Acme")
    expect(back!.server.admin_email).toBe("admin@acme.com")
    expect(back!.server.timezone).toBe("UTC")
  })

  it("schema rejeita admin_email mal formado", async () => {
    const { writeFile, mkdir } = await import("node:fs/promises")
    const { PATHS } = await import("../src/lib/paths.js")
    const { readState } = await import("../src/lib/state.js")
    await mkdir(PATHS.serverStateDir, { recursive: true })
    await writeFile(
      PATHS.serverStateFile,
      `version: 1
server:
  id: 11111111-2222-3333-4444-555555555555
  hostname: h
  display_name: H
  admin_email: nao-eh-email
  timezone: UTC
  installed_at: '2026-05-27T00:00:00Z'
  cli_version: 0.1.0
stacks: {}
`,
    )
    await expect(readState()).rejects.toThrow(/inválido/)
  })

  it("rejeita YAML corrompido com mensagem clara", async () => {
    const { writeFile, mkdir } = await import("node:fs/promises")
    const { PATHS } = await import("../src/lib/paths.js")
    const { readState } = await import("../src/lib/state.js")
    await mkdir(PATHS.serverStateDir, { recursive: true })
    await writeFile(PATHS.serverStateFile, "version: not-a-number\nserver: garbage\n")
    await expect(readState()).rejects.toThrow(/inválido/)
  })

  it("escreve com modo de arquivo (verifica chmod executado sem erro)", async () => {
    const { stat } = await import("node:fs/promises")
    const { PATHS } = await import("../src/lib/paths.js")
    const { writeState, initialState } = await import("../src/lib/state.js")
    const s = initialState("h", "0.1.0")
    await writeState(s)
    const st = await stat(PATHS.serverStateFile)
    // Em Windows, chmod(0o644) resulta em 0o666 (438).
    // Em Linux, resulta em 0o644 (420).
    // Verificamos apenas que o arquivo foi criado e chmod foi chamado sem erro.
    expect(st.isFile()).toBe(true)
    const mode = st.mode & 0o777
    expect([0o644, 0o666].includes(mode)).toBe(true)
  })

  // Cleanup
  it.skip("cleanup", async () => {
    await rm(testDir, { recursive: true, force: true })
  })
})
