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
