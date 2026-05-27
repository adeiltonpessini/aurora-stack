// Resolve as vars de um StackDefinition perguntando pra usuario via
// Clack (com helpers tipados em tui/prompt). Suporta re-deploy
// idempotente: se `existingValues` for passado, usa como default
// (re-prompta pra confirmar; usuario pode dar Enter pra manter).
//
// secret-generated NUNCA pergunta — gera com crypto.randomBytes na
// primeira vez, preserva nas seguintes. Pattern padrao pra senhas de
// servico que so o container precisa saber.

import { randomBytes } from "node:crypto"
import type { StackVar } from "./stack-def.js"
import { askText, askPassword, askEmail, askDomain } from "../tui/prompt.js"

export async function promptForVars(
  vars: StackVar[],
  existingValues?: Record<string, string>,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {}

  for (const v of vars) {
    const prefill = existingValues?.[v.name] ?? v.default

    if (v.type === "secret-generated") {
      // Re-deploy: preserva pra nao quebrar app que tem senha cacheada.
      // Primeiro deploy: gera novo.
      out[v.name] = prefill ?? generateSecret(v.generatedBytes ?? 32)
    } else if (v.type === "password") {
      // Clack password input nao aceita initialValue, entao se ja existe
      // uma senha, oferecemos placeholder informativo. Usuario tem que
      // re-digitar — protege contra falsa sensacao de "ja salvo".
      const placeholder = prefill ? "(senha previa preservada se vazio)" : v.placeholder
      const raw = await askPassword(v.prompt, { placeholder })
      out[v.name] = raw.trim().length === 0 && prefill ? prefill : raw
    } else if (v.type === "email") {
      out[v.name] = await askEmail(v.prompt, { default: prefill, placeholder: v.placeholder })
    } else if (v.type === "domain") {
      out[v.name] = await askDomain(v.prompt, { default: prefill, placeholder: v.placeholder })
    } else {
      out[v.name] = await askText(v.prompt, { default: prefill, placeholder: v.placeholder })
    }

    // Validacao customizada da stack (apos input + apos default-resolved).
    if (v.validate) {
      const err = v.validate(out[v.name])
      if (err) {
        throw new Error(`Validacao falhou em ${v.name}: ${err}`)
      }
    }
  }

  return out
}

// base64url eh URL-safe (sem +, /, =) e cabe direto em vars de env de
// docker compose sem precisar quotar. 32 bytes = 256 bits, suficiente
// pra senhas e secrets cripto.
function generateSecret(bytes: number): string {
  return randomBytes(bytes).toString("base64url")
}
