import { describe, it, expect, vi, beforeEach } from "vitest"

// Mockamos o modulo tui/prompt antes dos imports do var-prompt — os 4
// askers viram funcoes controlaveis nos testes.
vi.mock("../src/tui/prompt.js", () => ({
  askText: vi.fn(),
  askPassword: vi.fn(),
  askEmail: vi.fn(),
  askDomain: vi.fn(),
}))

import { promptForVars } from "../src/lib/var-prompt.js"
import * as prompts from "../src/tui/prompt.js"

const mockedText = prompts.askText as unknown as ReturnType<typeof vi.fn>
const mockedPwd = prompts.askPassword as unknown as ReturnType<typeof vi.fn>
const mockedEmail = prompts.askEmail as unknown as ReturnType<typeof vi.fn>
const mockedDomain = prompts.askDomain as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockedText.mockReset()
  mockedPwd.mockReset()
  mockedEmail.mockReset()
  mockedDomain.mockReset()
})

describe("promptForVars", () => {
  it("secret-generated cria valor com tamanho previsivel quando sem prefill", async () => {
    const out = await promptForVars([
      { name: "API_SECRET", prompt: "?", type: "secret-generated", generatedBytes: 16 },
    ])
    // base64url de 16 bytes = 22 chars (sem padding)
    expect(out.API_SECRET.length).toBeGreaterThanOrEqual(20)
    expect(out.API_SECRET).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it("secret-generated preserva valor existente em re-deploy", async () => {
    const out = await promptForVars(
      [{ name: "SECRET", prompt: "?", type: "secret-generated" }],
      { SECRET: "valor-antigo-preservado" },
    )
    expect(out.SECRET).toBe("valor-antigo-preservado")
  })

  it("chama o asker correto pra cada tipo", async () => {
    mockedText.mockResolvedValueOnce("texto")
    mockedPwd.mockResolvedValueOnce("senha")
    mockedEmail.mockResolvedValueOnce("a@b.com")
    mockedDomain.mockResolvedValueOnce("x.example.com")

    const out = await promptForVars([
      { name: "T", prompt: "T", type: "text" },
      { name: "P", prompt: "P", type: "password" },
      { name: "E", prompt: "E", type: "email" },
      { name: "D", prompt: "D", type: "domain" },
    ])

    expect(out).toEqual({ T: "texto", P: "senha", E: "a@b.com", D: "x.example.com" })
    expect(mockedText).toHaveBeenCalledOnce()
    expect(mockedPwd).toHaveBeenCalledOnce()
    expect(mockedEmail).toHaveBeenCalledOnce()
    expect(mockedDomain).toHaveBeenCalledOnce()
  })

  it("validate customizada falha lanca erro com mensagem", async () => {
    mockedText.mockResolvedValueOnce("appdb")
    await expect(
      promptForVars([
        {
          name: "DB",
          prompt: "?",
          type: "text",
          validate: (v) => (v === "appdb" ? "nome reservado" : undefined),
        },
      ]),
    ).rejects.toThrow(/nome reservado/)
  })

  it("existing values sobrescrevem defaults nas perguntas (passa como default ao asker)", async () => {
    mockedText.mockResolvedValueOnce("escolhido-pelo-usuario")
    await promptForVars(
      [{ name: "DB", prompt: "?", type: "text", default: "default-do-template" }],
      { DB: "valor-do-state-anterior" },
    )
    // Verifica que askText foi chamado com default = valor do state, nao do template
    expect(mockedText).toHaveBeenCalledWith(
      "?",
      expect.objectContaining({ default: "valor-do-state-anterior" }),
    )
  })
})
