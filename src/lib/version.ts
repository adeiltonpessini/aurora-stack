// Lê a versão do package.json em build/runtime. Necessário pra
// `aurora --version`, telemetria e contexto pra IA.

import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))

let cached: string | null = null

export async function cliVersion(): Promise<string> {
  if (cached) return cached
  // Em dev: src/lib/version.ts → ../../package.json
  // Em prod: dist/index.js → ../package.json
  const candidates = [
    join(__dirname, "../../package.json"),
    join(__dirname, "../package.json"),
  ]
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8")
      const pkg = JSON.parse(raw)
      if (pkg.version) {
        cached = pkg.version
        return cached!
      }
    } catch {
      continue
    }
  }
  cached = "0.0.0-unknown"
  return cached
}
