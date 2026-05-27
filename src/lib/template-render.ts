// Renderizador minimo de templates de compose. Sintaxe estilo Mustache
// reduzida: {{VAR}} e {{#if VAR}}...{{/if}}. Nada de loops, partials,
// helpers — compose YAML eh estatico, vars sao 5-10 por stack, nao
// precisamos da expressividade de eta/Handlebars (deps extra de ~30kb).
//
// Decisao consciente: implementar com regex em ~40 linhas em vez de
// adicionar dep. Se um dia precisar de loops (lista de ports dinamica
// no traefik?), migra pra eta. Por enquanto YAGNI.

const IF_BLOCK = /\{\{#if\s+([A-Z][A-Z0-9_]*)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g
const VAR_REF = /\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g

export function renderTemplate(tmpl: string, vars: Record<string, string>): string {
  // Passo 1: resolve {{#if VAR}}...{{/if}}. Truthy = string nao vazia.
  // Falsy = ausente, "", undefined. Operacao recursiva nao precisa ser
  // explicita aqui porque o regex eh greedy-lazy ([\s\S]*?), entao
  // blocos aninhados nao sao suportados — YAGNI por enquanto.
  let out = tmpl.replace(IF_BLOCK, (_match, name: string, body: string) => {
    const v = vars[name]
    return v && v.length > 0 ? body : ""
  })

  // Passo 2: substitui {{VAR}} restantes. Se referencia uma var nao
  // passada, lanca — preferimos falhar cedo que deixar literal "{{X}}"
  // vazar no compose (que daria erro do docker minutos depois).
  out = out.replace(VAR_REF, (_match, name: string) => {
    if (!(name in vars)) {
      throw new Error(`renderTemplate: variavel "${name}" referenciada no template mas nao foi passada`)
    }
    return vars[name]
  })

  return out
}
