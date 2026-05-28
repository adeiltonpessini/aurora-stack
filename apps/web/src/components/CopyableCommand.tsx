"use client"

import { useState } from "react"

// Bloco de comando bash com botao "copiar" que vira "copiado!" por 2s.
// Client component porque usa navigator.clipboard + state. Eh o
// elemento principal da hero — onde o usuario realmente copia o
// install command, entao vale o JS extra.
export function CopyableCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text (caso clipboard API bloqueada por HTTP/permissions)
      // Em HTTPS isso quase nunca acontece, mas o ramo de erro evita travar a UI.
    }
  }

  return (
    <div className="relative">
      <pre className="code-block pr-24 select-all">
        <span className="text-aurora-cyan">$</span> {command}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg
          bg-aurora-violet/20 hover:bg-aurora-violet/30 text-xs font-medium
          text-aurora-lilac transition-colors border border-aurora-violet/30"
        aria-label="Copiar comando"
      >
        {copied ? "copiado!" : "copiar"}
      </button>
    </div>
  )
}
