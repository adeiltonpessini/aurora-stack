import { describe, it, expect, vi } from "vitest"

// Mockamos o templates-index pra controlar o catalogo nos testes.
vi.mock("../src/templates-index.js", () => {
  const defineStack = (d: unknown) => d
  return {
    registeredStacks: [
      defineStack({
        name: "traefik",
        displayName: "Traefik",
        category: "Infra & Reverse Proxy",
        description: "Reverse proxy + LE",
        version: "3.0",
        composeTemplate: "compose.tmpl",
        swarm: true,
        vars: [],
        templateDir: "/fake/path/traefik",
      }),
      defineStack({
        name: "postgres",
        displayName: "PostgreSQL",
        category: "Bancos & Management",
        description: "Postgres 16",
        version: "16",
        composeTemplate: "compose.tmpl",
        swarm: true,
        vars: [],
        templateDir: "/fake/path/postgres",
      }),
    ],
  }
})

import { listStacks, findStack, listByCategory } from "../src/lib/stack-registry.js"

describe("stack-registry", () => {
  it("listStacks retorna catalogo com >= 1 stack", () => {
    const all = listStacks()
    expect(all.length).toBeGreaterThanOrEqual(2)
    expect(all.map((s) => s.name)).toContain("traefik")
  })

  it("findStack retorna undefined pra nome inexistente", () => {
    expect(findStack("nao-existe")).toBeUndefined()
  })

  it("findStack retorna a definicao pra nome conhecido", () => {
    const s = findStack("traefik")
    expect(s).toBeDefined()
    expect(s?.displayName).toBe("Traefik")
  })

  it("listByCategory agrupa por categoria", () => {
    const map = listByCategory()
    expect(map.get("Infra & Reverse Proxy")?.map((s) => s.name)).toEqual(["traefik"])
    expect(map.get("Bancos & Management")?.map((s) => s.name)).toEqual(["postgres"])
  })
})
