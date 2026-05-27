// Testes da regra de dependencia entre stacks (campo `requires`).

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "aurora-deps-"))
  process.env.AURORA_TEST_ROOT = testDir
  vi.resetModules()
  vi.clearAllMocks()
})

vi.mock("../src/lib/root.js", () => ({ requireRoot: vi.fn() }))
vi.mock("../src/lib/exec.js", () => ({
  exec: vi.fn().mockResolvedValue({ code: 0, stdout: "", stderr: "", durationMs: 1 }),
}))
vi.mock("../src/tui/prompt.js", () => ({
  askText: vi.fn(async (_q: string, opts: { default?: string } = {}) => opts.default ?? "x"),
  askPassword: vi.fn(async () => "p"),
  askEmail: vi.fn(async (_q: string, opts: { default?: string } = {}) => opts.default ?? "a@b.com"),
  askDomain: vi.fn(async (_q: string, opts: { default?: string } = {}) => opts.default ?? "x.example.com"),
  askConfirm: vi.fn(async () => true),
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
      name: "base",
      displayName: "Base",
      category: "Test",
      description: "base",
      version: "1.0",
      composeTemplate: "compose.tmpl",
      swarm: true,
      vars: [],
      templateDir: "",
    },
    {
      name: "dependente",
      displayName: "Dependente",
      category: "Test",
      description: "depende de base",
      version: "1.0",
      composeTemplate: "compose.tmpl",
      swarm: true,
      vars: [],
      requires: ["base"],
      templateDir: "",
    },
  ],
  templateDir: () => "",
}))

describe("dependencias entre stacks", () => {
  it("deploy aborta com mensagem clara se a dependencia nao esta instalada", async () => {
    const { initialState, writeState } = await import("../src/lib/state.js")
    await writeState(initialState("h", "0.1.0"))

    const { deployCommand } = await import("../src/commands/deploy.js")
    await expect(deployCommand("dependente")).rejects.toThrow(/aurora deploy base/i)
  })

  it("remove aborta se outra stack instalada depende desta", async () => {
    const { initialState, writeState } = await import("../src/lib/state.js")
    const s = initialState("h", "0.1.0")
    s.stacks.base = { version: "1.0", installed_at: "2026-05-27T00:00:00Z", vars: {} }
    s.stacks.dependente = { version: "1.0", installed_at: "2026-05-27T00:00:00Z", vars: {} }
    await writeState(s)

    const { removeCommand } = await import("../src/commands/remove.js")
    await expect(removeCommand("base")).rejects.toThrow(/aurora remove dependente/i)
  })

  it("remove permite quando ninguem depende", async () => {
    const { initialState, writeState, readState } = await import("../src/lib/state.js")
    const s = initialState("h", "0.1.0")
    s.stacks.base = { version: "1.0", installed_at: "2026-05-27T00:00:00Z", vars: {} }
    await writeState(s)

    const { removeCommand } = await import("../src/commands/remove.js")
    await removeCommand("base")

    const after = await readState()
    expect(after?.stacks.base).toBeUndefined()
  })
})
