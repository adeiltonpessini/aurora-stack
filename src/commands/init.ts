// `aurora init` — prepara o servidor. Idempotente: rodar 2x não quebra,
// só pula etapas já feitas. Fluxo:
//   1. Valida SO (Debian 12 ou 13)
//   2. Valida root
//   3. Verifica Docker (delegado pro setup.sh)
//   4. Inicia Swarm se ausente
//   5. Cria AuroraNet se ausente
//   6. Cria estrutura /opt/aurora/{...}
//   7. Pergunta nome amigavel + email admin + timezone do servidor
//   8. Confirmacao "Esta correto? [s/N]"
//   9. Cria/atualiza /etc/aurora/server.yml
//  10. Pede API key Aurora MCP (opcional)

import { mkdir } from "node:fs/promises"
import { detectOs } from "../lib/os.js"
import { requireRoot } from "../lib/root.js"
import {
  dockerInstalled,
  dockerSwarmActive,
  swarmInit,
  networkExists,
  createOverlayNetwork,
} from "../lib/docker.js"
import { readState, writeState, initialState, defaultHostname } from "../lib/state.js"
import { readUserConfig, writeUserConfig } from "../lib/config.js"
import { PATHS, STATE_SUBDIRS } from "../lib/paths.js"
import { cliVersion } from "../lib/version.js"
import { intro, outro, note, askText, askConfirm } from "../tui/prompt.js"
import { withSpinner } from "../tui/spinner.js"
import { aurora, printBanner } from "../tui/theme.js"
import { join } from "node:path"

// Lista de timezones comuns no Brasil + alguns globais úteis. NÃO é
// exaustiva — usuario pode digitar qualquer IANA timezone valido. Default
// America/Sao_Paulo porque maioria dos usuarios alvo é BR.
const COMMON_TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Bahia",
  "America/Recife",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Noronha",
  "UTC",
] as const

export async function initCommand(): Promise<void> {
  printBanner()
  intro("aurora init — preparando o servidor")

  // ──────────────────────────────────────────────────────────────────
  // Verificacoes do ambiente (idempotentes, todas com spinner)
  // ──────────────────────────────────────────────────────────────────

  // 1. SO
  let osPrettyName = ""
  await withSpinner(
    "Detectando sistema operacional",
    async () => {
      const os = await detectOs()
      osPrettyName = os.prettyName
      if (!os.isSupported) {
        throw new Error(
          `SO não suportado no v0.1: ${os.prettyName}. Aurora Stack v0.1 suporta Debian 12 (Bookworm) ou 13 (Trixie).`,
        )
      }
    },
    "Sistema operacional verificado",
  )
  note(osPrettyName, "SO")

  // 2. Root
  requireRoot()

  // 3. Docker
  await withSpinner(
    "Verificando Docker",
    async () => {
      if (!(await dockerInstalled())) {
        throw new Error(
          "Docker não está instalado. Rode primeiro: curl -fsSL https://get.docker.com | sh",
        )
      }
    },
    "Docker instalado",
  )

  // 4. Swarm
  await withSpinner(
    "Verificando Docker Swarm",
    async () => {
      if (!(await dockerSwarmActive())) {
        await swarmInit()
      }
    },
    "Docker Swarm ativo (single-node manager)",
  )

  // 5. Estrutura de diretorios (idempotente, antes das perguntas pra
  // garantir que /etc/aurora existe pra writeState depois)
  await withSpinner(
    "Criando estrutura /opt/aurora",
    async () => {
      await mkdir(PATHS.auroraRoot, { recursive: true, mode: 0o755 })
      for (const sub of STATE_SUBDIRS) {
        await mkdir(join(PATHS.auroraRoot, sub), { recursive: true, mode: 0o755 })
      }
    },
    "Estrutura /opt/aurora criada",
  )

  // ──────────────────────────────────────────────────────────────────
  // Configuracao do servidor — perguntas (idempotente: se ja existir
  // server.yml, mostra valores atuais como default)
  // ──────────────────────────────────────────────────────────────────

  const existing = await readState()
  const techHost = defaultHostname()

  // Loop de configuracao + confirmacao. Se usuario responde "N" no
  // final, volta pro topo do loop e re-pergunta. Pattern do SetupOrion.
  let displayName = ""
  let adminEmail = ""
  let timezone = ""
  let networkName = ""
  let confirmed = false

  while (!confirmed) {
    note(
      `Hostname técnico do SO: ${aurora.dim(techHost)}\nUse Ctrl+C pra cancelar a qualquer momento.`,
      "Configuração do servidor",
    )

    displayName = await askText("Nome amigável do servidor (aparece em status e IA):", {
      default: existing?.server.display_name || displayName || techHost,
      placeholder: "Ex: Produção SP, Homelab, Cliente Acme...",
    })

    const emailAnswer = await askText(
      "Email do admin (opcional — usado em alertas Aurora futuros, não no Let's Encrypt):",
      {
        default: existing?.server.admin_email || adminEmail,
        placeholder: "seu@email.com (Enter pra deixar vazio)",
      },
    )
    adminEmail = emailAnswer.trim()

    timezone = await askText(
      `Timezone (IANA — sugestões: ${COMMON_TIMEZONES.slice(0, 4).join(", ")}, ...):`,
      {
        default: existing?.server.timezone || timezone || "America/Sao_Paulo",
        placeholder: "America/Sao_Paulo",
      },
    )

    // Nome da rede overlay — todas stacks vao se conectar a ela.
    // Permitir customizar protege contra colisao com rede preexistente
    // (ex: "network_public" do SetupOrion num servidor migrado).
    // Validacao: slug do Docker (1-64 chars, [a-zA-Z0-9._-]).
    while (true) {
      const candidate = await askText(
        "Nome da rede Docker overlay (compartilhada por todas stacks):",
        {
          default: existing?.server.network_name || networkName || "aurora-net",
          placeholder: "aurora-net",
        },
      )
      const trimmed = candidate.trim()
      if (/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(trimmed)) {
        networkName = trimmed
        break
      }
      note(
        aurora.warn("Nome de rede inválido. Use letras/números/_-., 1 a 64 caracteres, começando por alfanumérico."),
      )
    }

    // Confirmacao tipo SetupOrion ("As respostas estao corretas?")
    note(
      `Nome amigável: ${aurora.bold(displayName)}\n` +
        `Email admin:   ${adminEmail ? aurora.bold(adminEmail) : aurora.dim("(vazio)")}\n` +
        `Timezone:      ${aurora.bold(timezone)}\n` +
        `Rede Docker:   ${aurora.bold(networkName)}\n` +
        `Hostname SO:   ${aurora.dim(techHost)} ${aurora.dim("(lido do sistema)")}`,
      "Confirme",
    )

    confirmed = await askConfirm("As respostas estão corretas?", true)
    if (!confirmed) {
      note("Vamos refazer.", "Ok")
    }
  }

  // 6. AuroraNet (depois de saber o nome configurado pelo usuario)
  await withSpinner(
    `Verificando network ${networkName}`,
    async () => {
      if (!(await networkExists(networkName))) {
        await createOverlayNetwork(networkName)
      }
    },
    `Network ${networkName} pronta`,
  )

  // ──────────────────────────────────────────────────────────────────
  // Persistir estado
  // ──────────────────────────────────────────────────────────────────

  await withSpinner(
    "Gravando /etc/aurora/server.yml",
    async () => {
      if (existing) {
        // Idempotente: preserva id + installed_at do estado anterior.
        const updated = {
          ...existing,
          server: {
            ...existing.server,
            hostname: techHost,
            display_name: displayName,
            ...(adminEmail ? { admin_email: adminEmail } : { admin_email: undefined }),
            timezone,
            network_name: networkName,
            cli_version: await cliVersion(),
          },
        }
        // Limpa admin_email undefined (zod schema permite optional, YAML
        // dump ignora undefined).
        if (!adminEmail) {
          delete (updated.server as { admin_email?: string }).admin_email
        }
        await writeState(updated)
      } else {
        const fresh = initialState(techHost, await cliVersion(), {
          display_name: displayName,
          ...(adminEmail ? { admin_email: adminEmail } : {}),
          timezone,
          network_name: networkName,
        })
        await writeState(fresh)
      }
    },
    "Estado gravado",
  )

  // ──────────────────────────────────────────────────────────────────
  // API key Aurora MCP (opcional)
  // ──────────────────────────────────────────────────────────────────

  const cfg = await readUserConfig()
  if (!cfg.api_key) {
    const wantKey = await askConfirm(
      "Configurar API key Aurora (necessária pra IA conversacional)? Pode adicionar depois.",
      false,
    )
    if (wantKey) {
      const key = await askText("Cole sua API key (https://aurora-mcp.com/dashboard):", {
        placeholder: "k_live_...",
      })
      if (key.trim().length > 0) {
        await writeUserConfig({ ...cfg, api_key: key.trim() })
        note("API key salva em " + PATHS.userConfigFile, "Pronto")
      }
    }
  }

  outro(aurora.ok("Servidor pronto! Próximo passo: `aurora` (menu) ou `aurora deploy traefik`"))
}
