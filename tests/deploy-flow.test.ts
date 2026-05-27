import { describe, it, expect, vi, beforeEach } from "vitest"
import { mkdtemp, readFile, mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), "aurora-deploy-"))
  process.env.AURORA_TEST_ROOT = testDir
  vi.resetModules()
})

// Mocks compartilhados
vi.mock("../src/lib/root.js", () => ({
  requireRoot: vi.fn(),
}))
vi.mock("../src/lib/exec.js", () => ({
  exec: vi.fn().mockResolvedValue({ code: 0, stdout: "", stderr: "", durationMs: 1 }),
}))
vi.mock("../src/tui/prompt.js", () => ({
  askText: vi.fn(async (_q: string, opts: { default?: string } = {}) => opts.default ?? "default-val"),
  askPassword: vi.fn(async () => "senha-digitada"),
  askEmail: vi.fn(async (_q: string, opts: { default?: string } = {}) => opts.default ?? "ops@example.com"),
  askDomain: vi.fn(async (_q: string, opts: { default?: string } = {}) => opts.default ?? "demo.example.com"),
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

// Fixture: registramos uma stack dummy diretamente.
vi.mock("../src/templates-index.js", () => ({
  registeredStacks: [
    {
      name: "demo",
      displayName: "Demo",
      category: "Test",
      description: "stack de teste",
      version: "1.0",
      composeTemplate: "compose.tmpl",
      swarm: true,
      vars: [
        { name: "DEMO_DOMAIN", prompt: "Dominio?", type: "domain" },
        { name: "DEMO_PASSWORD", prompt: "Senha?", type: "secret-generated", generatedBytes: 8 },
      ],
      primaryDomain: (v: Record<string, string>) => v.DEMO_DOMAIN,
      templateDir: "", // setado abaixo
    },
  ],
  templateDir: () => "",
}))

describe("deployCommand", () => {
  it("escreve compose, env, registra state e chama docker stack deploy", async () => {
    // Setup: criar templateDir fake com compose.tmpl
    const templatesRoot = join(testDir, "templates", "demo")
    await mkdir(templatesRoot, { recursive: true })
    await writeFile(
      join(templatesRoot, "compose.tmpl"),
      `version: "3.8"
services:
  demo:
    image: nginx
    environment:
      DOMAIN: {{DEMO_DOMAIN}}
      PASSWORD: {{DEMO_PASSWORD}}
`,
      "utf8",
    )

    // Inject templateDir no mock dinamicamente
    const { registeredStacks } = await import("../src/templates-index.js")
    registeredStacks[0].templateDir = templatesRoot

    // Init prerequisito: state inicial
    const { initialState, writeState } = await import("../src/lib/state.js")
    await writeState(initialState("test-host", "0.1.0"))

    // Run
    const { deployCommand } = await import("../src/commands/deploy.js")
    const { exec } = await import("../src/lib/exec.js")

    await deployCommand("demo")

    // Asserts: compose escrito em /opt/aurora/stacks/demo.yml
    const { PATHS } = await import("../src/lib/paths.js")
    const composeBody = await readFile(join(PATHS.stacksDir, "demo.yml"), "utf8")
    expect(composeBody).toContain("DOMAIN: demo.example.com")
    expect(composeBody).toMatch(/PASSWORD: [A-Za-z0-9_-]{10,}/)
    expect(composeBody).not.toContain("{{")

    // Env escrito em /opt/aurora/configs/demo.env
    const envBody = await readFile(join(PATHS.configsDir, "demo.env"), "utf8")
    expect(envBody).toContain("DEMO_DOMAIN=demo.example.com")
    expect(envBody).toMatch(/DEMO_PASSWORD=[A-Za-z0-9_-]+/)

    // docker stack deploy foi chamado
    expect(exec).toHaveBeenCalledWith(
      "docker",
      expect.arrayContaining(["stack", "deploy", "-c", join(PATHS.stacksDir, "demo.yml"), "demo"]),
      expect.any(Object),
    )

    // State atualizado
    const { readState } = await import("../src/lib/state.js")
    const state = await readState()
    expect(state?.stacks.demo).toBeDefined()
    expect(state?.stacks.demo.version).toBe("1.0")
    expect(state?.stacks.demo.domain).toBe("demo.example.com")
  })

  it("aborta se a stack nao existe no catalogo", async () => {
    const { initialState, writeState } = await import("../src/lib/state.js")
    await writeState(initialState("test-host", "0.1.0"))

    const { deployCommand } = await import("../src/commands/deploy.js")
    await expect(deployCommand("nao-existe")).rejects.toThrow(/nao encontrad/i)
  })

  it("aborta se nao tem state (aurora init nao rodou)", async () => {
    const { deployCommand } = await import("../src/commands/deploy.js")
    await expect(deployCommand("demo")).rejects.toThrow(/init/i)
  })
})
