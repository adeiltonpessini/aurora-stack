// Wrapper sobre ora — adiciona auto-success/auto-fail e cores Aurora.

import ora, { type Ora } from "ora"
import { aurora } from "./theme.js"

export interface SpinnerHandle {
  succeed: (msg?: string) => void
  fail: (msg?: string) => void
  update: (msg: string) => void
  stop: () => void
}

export function spinner(message: string): SpinnerHandle {
  const s: Ora = ora({
    text: message,
    color: "cyan",
    spinner: "dots",
  }).start()
  return {
    succeed: (msg) => s.succeed(msg ? aurora.ok(msg) : undefined),
    fail: (msg) => s.fail(msg ? aurora.err(msg) : undefined),
    update: (msg) => {
      s.text = msg
    },
    stop: () => s.stop(),
  }
}

// Wrapper que envolve uma Promise com spinner — sucesso/falha automáticos.
export async function withSpinner<T>(message: string, fn: () => Promise<T>, successMsg?: string): Promise<T> {
  const s = spinner(message)
  try {
    const result = await fn()
    s.succeed(successMsg ?? message)
    return result
  } catch (err) {
    s.fail(err instanceof Error ? err.message : String(err))
    throw err
  }
}
