import { describe, it, expect } from "vitest"
import { defineStack, type StackDefinition } from "../src/lib/stack-def.js"

// Helper pra construir uma definicao valida minima nos testes — evita
// repetir os mesmos 8 campos em toda assertion.
function valid(overrides: Partial<StackDefinition> = {}): StackDefinition {
  return {
    name: "demo",
    displayName: "Demo",
    category: "Test",
    description: "stack de teste",
    version: "1.0",
    composeTemplate: "compose.tmpl",
    swarm: true,
    vars: [],
    ...overrides,
  }
}

describe("defineStack", () => {
  it("retorna o objeto cru quando definicao eh valida", () => {
    const def = defineStack(valid({ name: "traefik", displayName: "Traefik" }))
    expect(def.name).toBe("traefik")
    expect(def.displayName).toBe("Traefik")
    expect(def.swarm).toBe(true)
  })

  it("rejeita name fora do padrao slug (maiuscula)", () => {
    expect(() => defineStack(valid({ name: "Traefik" }))).toThrow(/slug|formato/i)
  })

  it("rejeita name com espaco", () => {
    expect(() => defineStack(valid({ name: "n8n stack" }))).toThrow(/slug|formato/i)
  })

  it("rejeita name vazio", () => {
    expect(() => defineStack(valid({ name: "" }))).toThrow(/slug|formato|vazio/i)
  })

  it("rejeita vars com nomes duplicados", () => {
    expect(() =>
      defineStack(
        valid({
          vars: [
            { name: "FOO", prompt: "Foo", type: "text" },
            { name: "FOO", prompt: "Foo2", type: "text" },
          ],
        }),
      ),
    ).toThrow(/duplicad/i)
  })

  it("rejeita composeTemplate vazio", () => {
    expect(() => defineStack(valid({ composeTemplate: "" }))).toThrow(/composeTemplate|template/i)
  })

  it("aceita primaryDomain como funcao", () => {
    const def = defineStack(
      valid({
        vars: [{ name: "DOMAIN", prompt: "?", type: "domain" }],
        primaryDomain: (v) => v.DOMAIN,
      }),
    )
    expect(def.primaryDomain?.({ DOMAIN: "x.example.com" })).toBe("x.example.com")
  })

  it("aceita teardown customizado", () => {
    const def = defineStack(valid({ teardown: ["echo bye"] }))
    expect(def.teardown).toEqual(["echo bye"])
  })
})
