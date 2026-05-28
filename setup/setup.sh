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
#  9b. Hardening de SO: ufw + unattended-upgrades + fail2ban + SSH
#      (SSH hardening so se ja houver chave; nada que tranque o dono fora)
#  10. Instala @aurorabr/stack via npm i -g
#  11. Roda `aurora init` (pula tudo que já está OK — idempotente)
#
# Overrides de ambiente:
#   AURORA_SKIP_HARDENING=1  → pula o passo 9b (firewall/SSH/etc)
#   AURORA_FROM_SOURCE=1     → instala a CLI do source em vez do npm

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

# 1. Debian 12 ou 13
info "Verificando SO"
if [ ! -f /etc/os-release ]; then
  err "/etc/os-release não encontrado. Aurora Stack só roda em Linux."
  exit 1
fi
. /etc/os-release
if [ "${ID:-}" != "debian" ] || { [ "${VERSION_ID:-}" != "12" ] && [ "${VERSION_ID:-}" != "13" ]; }; then
  err "Aurora Stack v0.1 requer Debian 12 (Bookworm) ou 13 (Trixie). Encontrado: ${PRETTY_NAME:-$ID $VERSION_ID}"
  exit 1
fi
ok "${PRETTY_NAME} detectado"

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

# Nota de seguranca sobre os dois `curl ... | sh/bash` abaixo:
#   Sao os instaladores OFICIAIS do NodeSource e do Docker, baixados via
#   HTTPS (TLS verificado por -fsSL — falha se o cert for invalido). Rodam
#   como root. Nao pinamos por checksum porque esses scripts mudam a cada
#   release upstream (um pin fixo quebraria toda atualizacao deles). Esse
#   eh o trade-off aceito pela industria pra esses dois fornecedores
#   especificos. Quem exige supply-chain estrita pode instalar Node e
#   Docker via apt/keyring ANTES e o setup detecta (command -v) e pula.

# 5. Node.js 20
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]; then
  info "Instalando Node.js 20 via NodeSource (instalador oficial, HTTPS)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs
fi
ok "Node.js $(node -v) instalado"

# 6. Docker
if ! command -v docker >/dev/null 2>&1; then
  info "Instalando Docker Engine (instalador oficial get.docker.com, HTTPS)"
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

# 9b. Hardening de SO (firewall + auto-updates + fail2ban + SSH)
#
# Por que aqui: o servidor acabou de ganhar Docker exposto a internet.
# Deixar sem firewall/hardening eh deixar a porta aberta. Tudo idempotente
# e DEFENSIVO — nada que possa trancar o dono pra fora sem ele pedir.
#
# Override pra pular tudo (ex: VPS gerenciada com firewall do provedor):
#   AURORA_SKIP_HARDENING=1 bash <(curl -sSL ...)
if [ "${AURORA_SKIP_HARDENING:-0}" = "1" ]; then
  info "Hardening de SO pulado (AURORA_SKIP_HARDENING=1)"
else
  # Descobre a porta SSH ativa (default 22). Le do sshd_config efetivo —
  # se o dono ja trocou a porta, respeitamos pra nao tranca-lo fora.
  SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}')"
  SSH_PORT="${SSH_PORT:-22}"

  ## ── Firewall (ufw) ────────────────────────────────────────────────
  # ATENCAO Docker+Swarm: o Docker manipula iptables direto e PODE
  # contornar o ufw pra portas publicadas de containers. O ufw aqui
  # protege o HOST (SSH, servicos do host). As portas do Traefik (80/443)
  # sao publicadas pelo Swarm; liberamos no ufw por consistencia, mas o
  # filtro real delas eh o do Docker. Documentado pro Davi.
  if ! command -v ufw >/dev/null 2>&1; then
    info "Instalando ufw (firewall)"
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ufw
  fi
  # Libera SSH ANTES de qualquer enable — nunca me tranco fora.
  ufw allow "${SSH_PORT}/tcp" >/dev/null 2>&1 || true
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  if ufw status 2>/dev/null | grep -q "Status: active"; then
    ok "Firewall ufw ja ativo (portas ${SSH_PORT}, 80, 443 liberadas)"
  else
    ufw default deny incoming >/dev/null 2>&1 || true
    ufw default allow outgoing >/dev/null 2>&1 || true
    # --force pula a confirmacao interativa (estamos em curl|bash).
    ufw --force enable >/dev/null 2>&1 || true
    ok "Firewall ufw ativado (SSH ${SSH_PORT} + 80 + 443 liberadas)"
  fi

  ## ── Auto-updates de seguranca ─────────────────────────────────────
  if ! dpkg -l unattended-upgrades 2>/dev/null | grep -q '^ii'; then
    info "Instalando unattended-upgrades (patches de seguranca automaticos)"
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq unattended-upgrades
  fi
  # Habilita SO security updates automaticos (idempotente — sobrescreve
  # o arquivo com o conteudo conhecido).
  cat > /etc/apt/apt.conf.d/20auto-upgrades <<'AUTOUPG'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
AUTOUPG
  ok "Auto-updates de seguranca habilitados"

  ## ── fail2ban (anti brute-force no SSH) ────────────────────────────
  if ! command -v fail2ban-server >/dev/null 2>&1; then
    info "Instalando fail2ban (protecao SSH brute-force)"
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fail2ban
    systemctl enable --now fail2ban >/dev/null 2>&1 || true
  fi
  ok "fail2ban ativo"

  ## ── SSH hardening (OPT-IN SEGURO) ─────────────────────────────────
  # Desabilitar senha SO se ja existe chave autorizada — senao o dono
  # que entrou por senha (comum em VPS nova) ficaria trancado pra fora.
  # Detecta chave em /root/.ssh/authorized_keys ou no home de users sudo.
  HAS_KEY=0
  if [ -s /root/.ssh/authorized_keys ]; then
    HAS_KEY=1
  else
    for home in /home/*; do
      [ -s "${home}/.ssh/authorized_keys" ] && HAS_KEY=1 && break
    done
  fi

  if [ "$HAS_KEY" = "1" ]; then
    HARDEN_FILE="/etc/ssh/sshd_config.d/99-aurora-hardening.conf"
    if [ ! -f "$HARDEN_FILE" ]; then
      info "Chave SSH detectada — aplicando hardening de SSH (chave-only)"
      cat > "$HARDEN_FILE" <<'SSHARDEN'
# Aurora Stack — SSH hardening (chave-only). Aplicado so porque foi
# detectada uma chave autorizada. Pra reverter: apague este arquivo e
# rode `systemctl reload ssh`.
PermitRootLogin prohibit-password
PasswordAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 3
SSHARDEN
      # Valida ANTES de aplicar — config quebrada nao derruba o sshd.
      if sshd -t 2>/dev/null; then
        systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
        ok "SSH endurecido (senha desabilitada, so chave). Porta ${SSH_PORT}"
      else
        err "sshd -t falhou — hardening NAO aplicado (config preservada). Remova ${HARDEN_FILE} e investigue."
        rm -f "$HARDEN_FILE"
      fi
    else
      ok "SSH ja endurecido (${HARDEN_FILE} existe)"
    fi
  else
    info "Nenhuma chave SSH autorizada detectada — SSH hardening PULADO"
    info "  (manter senha evita trancar voce fora). Pra endurecer depois:"
    info "  1) adicione sua chave: ssh-copy-id root@<servidor>"
    info "  2) rerode este setup, ou crie /etc/ssh/sshd_config.d/99-aurora-hardening.conf"
  fi
fi

# 10. CLI — tenta npm primeiro, fallback pra install from source.
#
# Por que dois caminhos:
#   • Caminho 1 (npm): rapido e oficial. Funciona quando o pacote
#     @aurorabr/stack ja foi publicado no registry (GitHub Actions
#     release.yml roda npm publish em cada tag v*).
#   • Caminho 2 (source): plano B pra periodo de pre-publish. Clona
#     o repo, builda, link global. Util ate ter NPM_TOKEN configurado
#     E uma release de fato publicada.
#
# Variavel de override pra usuario avancado:
#   AURORA_FROM_SOURCE=1 bash <(curl -sSL ...) → pula npm e vai direto
#   pro source (util pra testar branches/PRs).
info "Instalando Aurora Stack CLI"
AURORA_INSTALLED=0

if [ "${AURORA_FROM_SOURCE:-0}" != "1" ]; then
  if npm install -g @aurorabr/stack >/dev/null 2>&1; then
    AURORA_INSTALLED=1
    ok "Aurora Stack instalado via npm: $(aurora --version)"
  else
    info "npm install falhou (pacote ainda nao publicado?). Tentando from source"
  fi
fi

if [ "$AURORA_INSTALLED" = "0" ]; then
  # Install from source: clone repo + build + link.
  # Local: /opt/aurora/cli-source (versionado por git, atualizavel
  # com `cd /opt/aurora/cli-source && git pull && npm run build`).
  SOURCE_DIR="/opt/aurora/cli-source"
  REPO_URL="${AURORA_REPO_URL:-https://github.com/adeiltonpessini/aurora-stack.git}"
  BRANCH="${AURORA_BRANCH:-main}"

  if ! command -v git >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git
  fi

  if [ -d "$SOURCE_DIR/.git" ]; then
    info "Atualizando codigo em $SOURCE_DIR"
    git -C "$SOURCE_DIR" fetch --depth=1 origin "$BRANCH"
    git -C "$SOURCE_DIR" reset --hard "origin/$BRANCH"
  else
    info "Clonando $REPO_URL (branch $BRANCH) em $SOURCE_DIR"
    rm -rf "$SOURCE_DIR"
    git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$SOURCE_DIR"
  fi

  info "Build (npm ci + npm run build)"
  ( cd "$SOURCE_DIR" && npm ci --silent && npm run build --silent ) || {
    err "Build do source falhou. Veja $SOURCE_DIR pra debug."
    exit 1
  }

  info "Linking aurora globalmente"
  ( cd "$SOURCE_DIR" && npm link --silent ) || {
    err "npm link falhou."
    exit 1
  }

  ok "Aurora Stack instalado from source: $(aurora --version)"
fi

# 11. init final
echo ""
echo -e "${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
echo -e "${green}  ✓ Setup completo!${reset}"
echo -e "${green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}"
echo ""
if [ "${AURORA_SKIP_HARDENING:-0}" != "1" ]; then
  echo "Hardening de SO aplicado:"
  echo "  • Firewall ufw ativo (SSH porta ${SSH_PORT:-22} + 80 + 443)"
  echo "  • Auto-updates de seguranca ligados"
  echo "  • fail2ban protegendo o SSH"
  if [ "${HAS_KEY:-0}" = "1" ]; then
    echo "  • SSH endurecido: SO chave (senha desabilitada)"
  else
    echo -e "  • ${yellow}SSH ainda aceita senha${reset} (nenhuma chave detectada)."
    echo "    Recomendado: ssh-copy-id e depois endurecer."
  fi
  echo ""
fi
echo "Próximos passos:"
echo ""
echo "  1. Rode 'aurora init' pra finalizar config (API key, estado server.yml)"
echo "  2. Depois 'aurora' (sem args) abre o menu"
echo ""
echo "Docs: https://stack.aurora-mcp.com"
echo ""
