import { describe, it, expect, vi, beforeEach } from "vitest"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "aurora-rm-"))
  process.env.AURORA_TEST_ROOT = testDir
  vi.resetModules()
  vi.clearAllMocks()
})

vi.mock("../src/lib/root.js", () => ({ requireRoot: vi.fn() }))
vi.mock("../src/lib/exec.js", () => ({
  exec: vi.fn().mockResolvedValue({ code: 0, stdout: "", stderr: "", durationMs: 1 }),
}))
vi.mock("../src/tui/prompt.js", () => ({
  askConfirm: vi.fn(),
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
}))
vi.mock("../src/tui/spinner.js", () => ({
  withSpinner: vi.fn(async (_msg: string, fn: () => Promise<unknown>) => fn()),
}))
vi.mock("../src/tui/theme.js", () => ({
  aurora: new Proxy({}, { get: () => (x: unknown) => x }),
  printBanner: vi.fn(),
}))
vi.mock("../src/templates-index.js", () => ({
  registeredStacks: [
    {
      name: "demo",
      displayName: "Demo",
      category: "Test",
      description: "demo",
      version: "1.0",
      composeTemplate: "compose.tmpl",
      swarm: true,
      vars: [],
      templateDir: "/fake",
    },
    {
      name: "custom",
      displayName: "Custom",
      category: "Test",
      description: "custom teardown",
      version: "1.0",
      composeTemplate: "compose.tmpl",
      swarm: true,
      vars: [],
      teardown: ["docker stack rm custom", "docker volume rm custom_data"],
      templateDir: "/fake",
    },
  ],
  templateDir: () => "",
}))

describe("removeCommand", () => {
  it("aborta se stack nao esta instalada", async () => {
    const { initialState, writeState } = await import("../src/lib/state.js")
    await writeState(initialState("h", "0.1.0"))

    const { removeCommand } = await import("../src/commands/remove.js")
    await expect(removeCommand("demo")).rejects.toThrow(/nao esta instalada|nao instalad/i)
  })

  it("aborta sem efeito quando usuario responde N na confirmacao", async () => {
    const { initialState, writeState, readState } = await import("../src/lib/state.js")
    const s = initialState("h", "0.1.0")
    s.stacks.demo = { version: "1.0", installed_at: "2026-05-27T00:00:00Z", vars: {} }
    await writeState(s)

    const { askConfirm } = await import("../src/tui/prompt.js")
    ;(askConfirm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false)

    const { removeCommand } = await import("../src/commands/remove.js")
    await removeCommand("demo")

    // Exec NAO foi chamado
    const { exec } = await import("../src/lib/exec.js")
    expect(exec).not.toHaveBeenCalled()

    // State mantem a stack
    const after = await readState()
    expect(after?.stacks.demo).toBeDefined()
  })

  it("fluxo completo: confirma -> docker stack rm -> limpa state", async () => {
    const { initialState, writeState, readState } = await import("../src/lib/state.js")
    const s = initialState("h", "0.1.0")
    s.stacks.demo = { version: "1.0", installed_at: "2026-05-27T00:00:00Z", vars: { X: "1" } }
    await writeState(s)

    const { askConfirm } = await import("../src/tui/prompt.js")
    ;(askConfirm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true)

    const { removeCommand } = await import("../src/commands/remove.js")
    await removeCommand("demo")

    const { exec } = await import("../src/lib/exec.js")
    expect(exec).toHaveBeenCalledWith("docker", ["stack", "rm", "demo"], expect.any(Object))

    const after = await readState()
    expect(after?.stacks.demo).toBeUndefined()
  })

  it("usa teardown customizado quando definido na stack", async () => {
    const { initialState, writeState } = await import("../src/lib/state.js")
    const s = initialState("h", "0.1.0")
    s.stacks.custom = { version: "1.0", installed_at: "2026-05-27T00:00:00Z", vars: {} }
    await writeState(s)

    const { askConfirm } = await import("../src/tui/prompt.js")
    ;(askConfirm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true)

    const { removeCommand } = await import("../src/commands/remove.js")
    await removeCommand("custom")

    const { exec } = await import("../src/lib/exec.js")
    // Deve ter chamado pelo menos 2x (os 2 comandos do teardown).
    expect(exec).toHaveBeenCalledTimes(2)
  })
})
