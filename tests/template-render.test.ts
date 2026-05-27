import { describe, it, expect } from "vitest"
import { renderTemplate } from "../src/lib/template-render.js"

describe("renderTemplate", () => {
  it("substitui {{VAR}} simples", () => {
    const out = renderTemplate("hello {{NAME}}!", { NAME: "world" })
    expect(out).toBe("hello world!")
  })

  it("substitui multiplas vars no mesmo template", () => {
    const tmpl = "user={{USER}} db={{DB}} port=5432"
    const out = renderTemplate(tmpl, { USER: "alice", DB: "appdb" })
    expect(out).toBe("user=alice db=appdb port=5432")
  })

  it("aceita whitespace dentro de {{ VAR }}", () => {
    const out = renderTemplate("x={{  HELLO  }}", { HELLO: "ok" })
    expect(out).toBe("x=ok")
  })

  it("{{#if VAR}}...{{/if}} mantem corpo quando VAR truthy", () => {
    const tmpl = "before{{#if FLAG}} extra{{/if}} after"
    expect(renderTemplate(tmpl, { FLAG: "yes" })).toBe("before extra after")
  })

  it("{{#if VAR}}...{{/if}} remove corpo quando VAR ausente/vazia", () => {
    const tmpl = "before{{#if FLAG}} extra{{/if}} after"
    expect(renderTemplate(tmpl, { FLAG: "" })).toBe("before after")
    expect(renderTemplate(tmpl, {})).toBe("before after")
  })

  it("lanca erro com nome da var quando var faltando", () => {
    expect(() => renderTemplate("hello {{MISSING}}", {})).toThrow(/MISSING/)
  })

  it("preserva caracteres especiais YAML no valor (sem auto-escape)", () => {
    // Valores podem ter $ e : (passwords, paths). Quem chama eh quem decide
    // se precisa quotar; o renderer nao mexe.
    const out = renderTemplate("PASS={{P}}", { P: "ab$c:def" })
    expect(out).toBe("PASS=ab$c:def")
  })
})
