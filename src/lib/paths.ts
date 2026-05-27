// Caminhos canônicos do Aurora Stack no servidor Linux. Centralizar
// aqui evita strings espalhadas (e facilita override em testes via
// AURORA_TEST_ROOT).

import { homedir } from "node:os"
import { join } from "node:path"

const TEST_ROOT = process.env.AURORA_TEST_ROOT

export const PATHS = {
  // Estado server-wide. Lido pelo root, escrito pelo CLI rodando como root.
  serverStateDir: TEST_ROOT ? join(TEST_ROOT, "etc/aurora") : "/etc/aurora",
  get serverStateFile() {
    return join(this.serverStateDir, "server.yml")
  },

  // Raiz das stacks (compose files, volumes, etc).
  auroraRoot: TEST_ROOT ? join(TEST_ROOT, "opt/aurora") : "/opt/aurora",
  get stacksDir() {
    return join(this.auroraRoot, "stacks")
  },
  get configsDir() {
    return join(this.auroraRoot, "configs")
  },
  get volumesDir() {
    return join(this.auroraRoot, "volumes")
  },
  get backupsDir() {
    return join(this.auroraRoot, "backups")
  },
  get logsDir() {
    return join(this.auroraRoot, "logs")
  },

  // Config por-usuário (API key Aurora MCP).
  userConfigDir: TEST_ROOT ? join(TEST_ROOT, ".aurora") : join(homedir(), ".aurora"),
  get userConfigFile() {
    return join(this.userConfigDir, "config.json")
  },
} as const

// Nome canônico da overlay network do Swarm.
export const AURORA_NET = "aurora-net"

// Lista de subdiretórios criados pelo `aurora init` em /opt/aurora.
export const STATE_SUBDIRS = ["stacks", "configs", "volumes", "backups", "logs", "apps"] as const
