// Detecta SO via /etc/os-release (padrão freedesktop.org, presente em
// todas as distros Linux modernas). Lista de SOs suportados: Debian 12
// (Bookworm) e Debian 13 (Trixie). Ambos validados como compatíveis
// com apt + systemd + Docker Engine via get.docker.com + NodeSource
// setup_20.x. Distros fora da lista são marcadas como
// `isSupported:false` e o init aborta com mensagem clara.
//
// Critérios pra entrar na lista:
//   • apt-based (mesma sintaxe de install)
//   • systemd (necessário pra Docker)
//   • Não-EOL (Debian 11 fica fora — EOL programado pra junho/2026)

import { readFile } from "node:fs/promises"
import type { OsInfo } from "../types.js"

const SUPPORTED_OS = [
  { id: "debian", versionId: "12" },
  { id: "debian", versionId: "13" },
] as const

export async function detectOs(): Promise<OsInfo> {
  try {
    const raw = await readFile("/etc/os-release", "utf8")
    const fields = parseOsRelease(raw)
    const id = fields.ID ?? "unknown"
    const versionId = fields.VERSION_ID ?? ""
    const prettyName = fields.PRETTY_NAME ?? `${id} ${versionId}`
    const isSupported = SUPPORTED_OS.some((s) => s.id === id && s.versionId === versionId)
    return { id, versionId, prettyName, isSupported }
  } catch {
    return { id: "unknown", versionId: "", prettyName: "unknown", isSupported: false }
  }
}

function parseOsRelease(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (!m || !m[1] || m[2] === undefined) continue
    out[m[1]] = m[2].replace(/^"|"$/g, "")
  }
  return out
}
