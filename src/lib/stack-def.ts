// Motor de definicao de templates de stacks. Cada arquivo
// templates/<nome>/template.ts importa daqui e chama defineStack({...}).
//
// defineStack faz validacao em runtime (Aurora roda em Node, sem build
// step server-side) pra pegar erros de digitacao cedo: slug invalido,
// vars duplicadas, composeTemplate vazio. Falha rapida >>> falha
// silenciosa no docker stack deploy.

export type VarType = "text" | "password" | "email" | "domain" | "secret-generated"

export interface StackVar {
  // Nome da var no compose.tmpl (ex: "TRAEFIK_LE_EMAIL"). Convencao:
  // UPPER_SNAKE_CASE pra combinar com env vars do compose.
  name: string
  // Texto que o Clack vai mostrar ("Email pra Let's Encrypt:").
  prompt: string
  type: VarType
  // Valor pre-preenchido se usuario der Enter direto.
  default?: string
  // Texto cinza no campo vazio do Clack.
  placeholder?: string
  // Quando type === "secret-generated", quantos bytes aleatorios usar
  // antes do base64url. 32 bytes = 43 chars base64url, suficiente pra
  // senhas de DB/admin. Default 32.
  generatedBytes?: number
  // Validacao customizada pos-input. Retorna mensagem de erro pra abortar
  // o deploy, ou undefined se OK. Email/domain tem validacao default no
  // var-prompt.ts; isso aqui eh pra regras especificas da stack.
  validate?: (value: string) => string | undefined
}

export interface StackDefinition {
  // Slug canonico, usado em `aurora deploy <name>` e no nome da stack do
  // Swarm. Padrao: lowercase, alfanumerico + hifen.
  name: string
  // Nome bonito ("Traefik", "n8n", "Postgres") pra exibir em UI.
  displayName: string
  // Categoria do catalogo ("Infra & Reverse Proxy", "IA & LLM", etc.).
  // Usado por `aurora list --available` pra agrupar.
  category: string
  description: string
  // Versao da imagem default (ex: "3.0" pro Traefik 3.0). Persistida em
  // server.yml — informativo, nao afeta deploy diretamente (compose decide).
  version: string
  vars: StackVar[]
  // Caminho relativo ao template.ts pro arquivo compose.tmpl. Resolvido
  // pelo registry quando vai renderizar.
  composeTemplate: string
  // True = `docker stack deploy`; false = `docker compose up -d`. v0.1
  // tudo eh swarm — mas deixar o flag aberto pra v0.2+.
  swarm: boolean
  // Calcula a URL primaria da stack a partir das vars resolvidas. Usado
  // em `aurora list` (mostra "traefik   v3.0   https://traefik.x.com").
  // Funcao porque depende de qual var carrega o dominio.
  primaryDomain?: (vars: Record<string, string>) => string | undefined
  // Comandos pra rodar no `aurora remove`. Default eh
  // ["docker stack rm <name>"]. Override pra stacks que precisam de
  // cleanup extra (ex: drop de schema, unmount).
  teardown?: string[]
  // Stacks que precisam ja estar instaladas antes desta. Aurora valida
  // no inicio do deploy e aborta com mensagem clara se faltarem. Ex:
  // Portainer expoe HTTPS, entao requires: ["traefik"]. n8n persiste em
  // DB, entao requires: ["postgres"]. Pode ser vazio/undefined (stacks
  // base como Traefik e Postgres nao tem requires).
  requires?: string[]
}

// Stack registrada no catalogo — eh a definicao + diretorio resolvido
// do template no FS. O registry preenche `templateDir` no momento que
// importa o template.ts (resolve via import.meta.url do arquivo).
export interface RegisteredStack extends StackDefinition {
  templateDir: string
}

const SLUG_REGEX = /^[a-z][a-z0-9-]*$/

export function defineStack(def: StackDefinition): StackDefinition {
  if (!def.name || def.name.length === 0) {
    throw new Error(`defineStack: name vazio (slug obrigatorio)`)
  }
  if (!SLUG_REGEX.test(def.name)) {
    throw new Error(
      `defineStack: name "${def.name}" tem formato invalido. Slug deve ser lowercase, comecar com letra, conter so [a-z0-9-]. Ex: "traefik", "n8n", "evolution-api".`,
    )
  }
  if (!def.composeTemplate || def.composeTemplate.length === 0) {
    throw new Error(`defineStack[${def.name}]: composeTemplate eh obrigatorio (caminho pro arquivo .tmpl)`)
  }
  const seen = new Set<string>()
  for (const v of def.vars) {
    if (seen.has(v.name)) {
      throw new Error(`defineStack[${def.name}]: var "${v.name}" duplicada`)
    }
    seen.add(v.name)
  }
  return def
}
