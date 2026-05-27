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
