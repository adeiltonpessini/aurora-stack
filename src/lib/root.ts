// Validação simples de privilégio root. Não testamos com vi.mock
// porque `process.getuid` é nativo do Node e não vale a pena mockar
// (a função tem 1 linha de lógica). Em macOS/Windows getuid pode ser
// undefined; tratamos como "não-root" (a CLI vai abortar com mensagem
// clara, comportamento correto).

export function isRoot(): boolean {
  return typeof process.getuid === "function" && process.getuid() === 0
}

export class NotRootError extends Error {
  constructor() {
    super("Este comando precisa ser executado como root (use sudo).")
    this.name = "NotRootError"
  }
}

export function requireRoot(): void {
  if (!isRoot()) throw new NotRootError()
}
