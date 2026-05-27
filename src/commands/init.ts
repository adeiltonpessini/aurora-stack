// `aurora init` — prepara o servidor. Idempotente: rodar 2x não quebra,
// só pula etapas já feitas. Fluxo:
//   1. Valida SO (Debian 12)
//   2. Valida root
//   3. Instala Docker se ausente (delega pra script oficial)
//   4. Inicia Swarm
//   5. Cria AuroraNet
//   6. Cria estrutura /opt/aurora/{...}
//   7. Cria /etc/aurora/server.yml inicial
//   8. Pede API key (opcional)

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
import { exec } from "../lib/exec.js"
import { readState, writeState, initialState, defaultHostname } from "../lib/state.js"
import { readUserConfig, writeUserConfig } from "../lib/config.js"
import { PATHS, AURORA_NET, STATE_SUBDIRS } from "../lib/paths.js"
import { cliVersion } from "../lib/version.js"
import { intro, outro, note, askText, askConfirm } from "../tui/prompt.js"
import { withSpinner } from "../tui/spinner.js"
import { aurora, printBanner } from "../tui/theme.js"
import { join } from "node:path"

export async function initCommand(): Promise<void> {
  printBanner()
  intro("aurora init — preparando o servidor")

  // 1. SO
  await withSpinner("Detectando sistema operacional", async () => {
    const os = await detectOs()
    if (!os.isSupported) {
      throw new Error(
        `SO não suportado no v0.1: ${os.prettyName}. Aurora Stack v0.1 só suporta Debian 12.`,
      )
    }
  }, "Sistema operacional: Debian 12 ✓")

  // 2. Root
  requireRoot()

  // 3. Docker
  await withSpinner("Verificando Docker", async () => {
    if (!(await dockerInstalled())) {
      throw new Error(
        "Docker não está instalado. Rode primeiro: curl -fsSL https://get.docker.com | sh",
      )
    }
  }, "Docker instalado ✓")

  // 4. Swarm
  await withSpinner("Verificando Docker Swarm", async () => {
    if (!(await dockerSwarmActive())) {
      await swarmInit()
    }
  }, "Docker Swarm ativo (single-node manager) ✓")

  // 5. AuroraNet
  await withSpinner(`Verificando network ${AURORA_NET}`, async () => {
    if (!(await networkExists(AURORA_NET))) {
      await createOverlayNetwork(AURORA_NET)
    }
  }, `Network ${AURORA_NET} pronta ✓`)

  // 6. Estrutura
  await withSpinner("Criando estrutura /opt/aurora", async () => {
    await mkdir(PATHS.auroraRoot, { recursive: true, mode: 0o755 })
    for (const sub of STATE_SUBDIRS) {
      await mkdir(join(PATHS.auroraRoot, sub), { recursive: true, mode: 0o755 })
    }
  }, "Estrutura /opt/aurora criada ✓")

  // 7. server.yml
  await withSpinner("Inicializando estado em /etc/aurora/server.yml", async () => {
    const existing = await readState()
    if (!existing) {
      const fresh = initialState(defaultHostname(), await cliVersion())
      await writeState(fresh)
    }
  }, "Estado inicializado ✓")

  // 8. API key
  const cfg = await readUserConfig()
  if (!cfg.api_key) {
    const wantKey = await askConfirm(
      "Configurar API key Aurora (necessária pra IA conversacional)? Pode adicionar depois com `aurora doctor`.",
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
