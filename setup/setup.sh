#!/usr/bin/env bash
# Aurora Stack — bash one-liner bootstrap.
# Uso: bash <(curl -sSL setup.aurora-mcp.com)
#
# Faz:
#   1. Valida Debian 12
#   2. Valida root
#   3. apt update + upgrade
#   4. Instala deps básicas
#   5. Instala Node.js 20 via NodeSource
#   6. Instala Docker Engine via get.docker.com
#   7. Inicia Docker Swarm
#   8. Cria network aurora-net
#   9. Cria estrutura /opt/aurora
#  10. Instala @aurorabr/stack via npm i -g
#  11. Roda `aurora init` (pula tudo que já está OK — idempotente)

set -Eeuo pipefail

yellow="\e[33m"
green="\e[32m"
red="\e[91m"
reset="\e[0m"

ok() { echo -e "${green}[ OK ]${reset} $1"; }
err() { echo -e "${red}[ ERR ]${reset} $1" >&2; }
info() { echo -e "${yellow}[ ... ]${reset} $1"; }

# Banner
clear
cat <<'EOF'
========================================================
   AURORA STACK SETUP
   Transforme qualquer Linux em infraestrutura inteligente
========================================================
EOF

# 1. Debian 12
info "Verificando SO"
if [ ! -f /etc/os-release ]; then
  err "/etc/os-release não encontrado. Aurora Stack só roda em Linux."
  exit 1
fi
. /etc/os-release
if [ "${ID:-}" != "debian" ] || [ "${VERSION_ID:-}" != "12" ]; then
  err "Aurora Stack v0.1 requer Debian 12. Encontrado: ${PRETTY_NAME:-$ID $VERSION_ID}"
  exit 1
fi
ok "Debian 12 detectado"

# 2. Root
if [ "$(id -u)" != "0" ]; then
  err "Este script precisa rodar como root. Use: sudo bash <(curl -sSL setup.aurora-mcp.com)"
  exit 1
fi
ok "Root validado"

# 3. apt update + upgrade
info "Atualizando pacotes (pode levar 1-2 min)"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
ok "Pacotes atualizados"

# 4. Deps básicas
info "Instalando dependências básicas"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  curl ca-certificates gnupg dialog jq apt-utils
ok "Dependências básicas instaladas"

# 5. Node.js 20
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]; then
  info "Instalando Node.js 20 via NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs
fi
ok "Node.js $(node -v) instalado"

# 6. Docker
if ! command -v docker >/dev/null 2>&1; then
  info "Instalando Docker Engine"
  curl -fsSL https://get.docker.com | sh
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') instalado"

# 7. Swarm
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
  info "Iniciando Docker Swarm"
  docker swarm init >/dev/null 2>&1 || {
    err "Falha ao iniciar Swarm. Veja: docker info"
    exit 1
  }
fi
ok "Docker Swarm ativo"

# 8. aurora-net
if ! docker network ls --format '{{.Name}}' | grep -q '^aurora-net$'; then
  info "Criando overlay network aurora-net"
  docker network create -d overlay --attachable aurora-net >/dev/null
fi
ok "Network aurora-net pronta"

# 9. Estrutura
info "Criando estrutura /opt/aurora"
mkdir -p /opt/aurora/{apps,stacks,volumes,backups,configs,logs}
mkdir -p /etc/aurora
ok "Estrutura criada"

# 10. CLI
info "Instalando @aurorabr/stack via npm"
npm install -g @aurorabr/stack >/dev/null 2>&1 || {
  err "Falha ao instalar @aurorabr/stack via npm. Verifique sua conexão."
  exit 1
}
ok "Aurora Stack instalado: $(aurora --version)"

# 11. init final
echo ""
echo -e "${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
echo -e "${green}  ✓ Setup completo!${reset}"
echo -e "${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Rode 'aurora init' pra finalizar config (API key, estado server.yml)"
echo "  2. Depois 'aurora' (sem args) abre o menu"
echo ""
echo "Docs: https://stack.aurora-mcp.com"
echo ""
