// Envelope sobre @clack/prompts — adiciona handling de cancel (Ctrl+C
// retorna Symbol que precisa ser detectado) e tema Aurora.

import * as p from "@clack/prompts"
import { aurora } from "./theme.js"

export async function askText(message: string, opts: { default?: string; placeholder?: string } = {}): Promise<string> {
  const r = await p.text({
    message,
    initialValue: opts.default,
    placeholder: opts.placeholder,
  })
  if (p.isCancel(r)) {
    p.cancel("Operação cancelada.")
    process.exit(0)
  }
  return r as string
}

// Password prompt — usa o componente password do Clack que mascara
// caracteres na tela. NAO suporta initialValue (limitacao do Clack);
// se houver default (re-deploy), mostra placeholder informando.
export async function askPassword(message: string, opts: { placeholder?: string } = {}): Promise<string> {
  const r = await p.password({ message, mask: "•" })
  if (p.isCancel(r)) {
    p.cancel("Operação cancelada.")
    process.exit(0)
  }
  return r as string
}

// Email com validacao basica de formato (sintaxe so — nao verifica MX).
// Loopa ate validar; aceita string vazia se opcional eh true.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export async function askEmail(
  message: string,
  opts: { default?: string; placeholder?: string; optional?: boolean } = {},
): Promise<string> {
  while (true) {
    const value = await askText(message, opts)
    const v = value.trim()
    if (v.length === 0 && opts.optional) return ""
    if (EMAIL_RE.test(v)) return v
    p.log.warn(aurora.warn(`Email invalido. Use formato nome@dominio.com.`))
  }
}

// Domain (FQDN). Valida que tem ao menos um ponto e nao tem
// http://, espaco ou caractere proibido. Loopa ate validar.
const DOMAIN_RE = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63})+$/
export async function askDomain(
  message: string,
  opts: { default?: string; placeholder?: string } = {},
): Promise<string> {
  while (true) {
    const value = await askText(message, opts)
    const v = value.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")
    if (DOMAIN_RE.test(v)) return v
    p.log.warn(aurora.warn(`Dominio invalido. Use FQDN tipo "app.exemplo.com" (sem https://).`))
  }
}

export async function askConfirm(message: string, defaultYes = false): Promise<boolean> {
  const r = await p.confirm({ message, initialValue: defaultYes })
  if (p.isCancel(r)) {
    p.cancel("Operação cancelada.")
    process.exit(0)
  }
  return r as boolean
}

export async function askSelect<T extends string>(
  message: string,
  options: Array<{ value: T; label: string; hint?: string }>,
): Promise<T> {
  const r = await p.select({ message, options })
  if (p.isCancel(r)) {
    p.cancel("Operação cancelada.")
    process.exit(0)
  }
  return r as T
}

export function intro(message: string): void {
  p.intro(aurora.teal(message))
}

export function outro(message: string): void {
  p.outro(aurora.teal(message))
}

export function note(message: string, title?: string): void {
  p.note(message, title)
}
