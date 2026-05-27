// Registry de stacks: API publica pra commands/* descobrirem o
// catalogo. A lista vem de templates-index.ts (imports estaticos pra
// funcionar com bundle do tsup).

import { registeredStacks } from "../templates-index.js"
import type { RegisteredStack } from "./stack-def.js"

export function listStacks(): RegisteredStack[] {
  return [...registeredStacks]
}

export function findStack(name: string): RegisteredStack | undefined {
  return registeredStacks.find((s) => s.name === name)
}

export function listByCategory(): Map<string, RegisteredStack[]> {
  const map = new Map<string, RegisteredStack[]>()
  for (const s of registeredStacks) {
    const arr = map.get(s.category) ?? []
    arr.push(s)
    map.set(s.category, arr)
  }
  return map
}
