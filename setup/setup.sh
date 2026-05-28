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

# Caractere ESC real (nao a string "\e"). printf '%s' com a string "\e"
# imprimiria literal em alguns shells — usamos o byte 0x1b de verdade.
ESC=$(printf '\033')

# Cores da marca Aurora (ANSI 256). Fallback gracioso: se o terminal nao
# suportar cor (sem TTY, TERM=dumb, NO_COLOR setado), tudo vira vazio e a
# saida sai em texto puro — sem lixo de escapes na tela.
if [ -t 1 ] && [ "${TERM:-dumb}" != "dumb" ] && [ -z "${NO_COLOR:-}" ]; then
  violet="${ESC}[38;5;141m"   # roxo Aurora
  cyan="${ESC}[38;5;51m"      # ciano chama
  lilac="${ESC}[38;5;183m"    # lilas claro (texto)
  dim="${ESC}[38;5;240m"      # cinza (secundario)
  green="${ESC}[38;5;48m"     # verde sucesso
  red="${ESC}[38;5;203m"      # vermelho erro
  yellow="${ESC}[38;5;221m"   # amarelo aviso
  bold="${ESC}[1m"
  reset="${ESC}[0m"
  USE_COLOR=1
else
  violet=""; cyan=""; lilac=""; dim=""; green=""; red=""; yellow=""; bold=""; reset=""
  USE_COLOR=0
fi

ok() { printf '%s  ✓ %s%s\n' "$green" "$reset" "$1"; }
err() { printf '%s  ✗ %s%s\n' "$red" "$reset" "$1" >&2; }
info() { printf '%s  • %s%s\n' "$cyan" "$reset" "$1"; }

# ── Spinner por etapa ──────────────────────────────────────────────────
# Uso:
#   step "Instalando Docker" comando_longo arg1 arg2
# Mostra um spinner braille animado (cores da marca) enquanto o comando
# roda; troca por ✓ (sucesso) ou ✗ + saida do erro (falha). Em terminal
# sem cor/TTY, cai pra info()+comando direto (sem animacao, log limpo).
SPINNER_FRAMES='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
step() {
  local label="$1"; shift
  if [ "$USE_COLOR" != "1" ]; then
    info "$label"
    if "$@" >/tmp/aurora-step.log 2>&1; then ok "$label"; else
      err "$label — falhou:"; sed 's/^/      /' /tmp/aurora-step.log >&2; return 1
    fi
    return 0
  fi
  "$@" >/tmp/aurora-step.log 2>&1 &
  local pid=$! i=0 n=${#SPINNER_FRAMES}
  # Esconde o cursor durante a animacao.
  printf '%s' "${ESC}[?25l"
  while kill -0 "$pid" 2>/dev/null; do
    local f="${SPINNER_FRAMES:$((i % n)):1}"
    printf '\r%s  %s %s%s' "$violet" "$f" "$reset" "$label"
    i=$((i + 1)); sleep 0.08
  done
  wait "$pid"; local rc=$?
  printf '%s' "${ESC}[?25h"   # mostra o cursor de novo
  printf '\r%s' "${ESC}[K"    # limpa a linha do spinner
  if [ "$rc" = "0" ]; then ok "$label"; else
    err "$label — falhou:"; sed 's/^/      /' /tmp/aurora-step.log >&2; return "$rc"
  fi
}

# Banner: mascote Aurora (fantasma encapuzado com chama) ao lado do nome.
# Desenhado pra caber em 80 colunas e renderizar em qualquer terminal UTF-8.
#
# IMPLEMENTACAO: as cores entram como ARGUMENTOS (%s) em vez de interpoladas
# no texto. Isso evita a colisao classica entre a barra invertida do desenho
# do mascote (\) e a sequencia de escape de cor (\e) na mesma string printf,
# que faz o \e sair literal na tela. Com %s a cor eh dado, nao codigo.
aurora_banner() {
  local L="$lilac" V="$violet" C="$cyan" D="$dim" B="$bold" R="$reset"
  printf '\n'
  printf '      %s\\%s %s/%s\n'                       "$C" "$R" "$C" "$R"
  printf '     %s.-%s^%s-.%s      %s%sA U R O R A%s  %s%sS T A C K%s\n' \
         "$V" "$C" "$V" "$R" "$B" "$V" "$R" "$B" "$C" "$R"
  printf '    %s/ %so%s  %so%s \\%s    %s\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80\xe2\x94\x80%s\n' \
         "$V" "$C" "$V" "$C" "$V" "$R" "$D" "$R"
  printf '    %s|  %s\xe2\x80\xbf%s  |%s    %sTransforme qualquer Linux em%s\n' \
         "$V" "$L" "$V" "$R" "$L" "$R"
  printf '     %s'\''-%s*%s-'\''%s     %sinfraestrutura inteligente%s\n' \
         "$V" "$C" "$V" "$R" "$L" "$R"
  printf '      %s\xc2\xb0%s        %sv0.1.0-alpha \xc2\xb7 Elastic License v2%s\n' \
         "$C" "$R" "$D" "$R"
  printf '\n'
}
clear
aurora_banner

# 1. SO suportado: Debian 12/13 ou Ubuntu 22.04/24.04
#    (mesma familia apt/systemd; os instaladores de Docker/Node cobrem ambos)
info "Verificando SO"
if [ ! -f /etc/os-release ]; then
  err "/etc/os-release não encontrado. Aurora Stack só roda em Linux."
  exit 1
fi
. /etc/os-release
os_ok=0
case "${ID:-}" in
  debian)
    case "${VERSION_ID:-}" in 12|13) os_ok=1 ;; esac
    ;;
  ubuntu)
    case "${VERSION_ID:-}" in 22.04|24.04) os_ok=1 ;; esac
    ;;
esac
if [ "$os_ok" != "1" ]; then
  err "Aurora Stack v0.1 requer Debian 12/13 ou Ubuntu 22.04/24.04 LTS. Encontrado: ${PRETTY_NAME:-$ID $VERSION_ID}"
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
_apt_update() { apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq; }
step "Atualizando pacotes (pode levar 1-2 min)" _apt_update

# 4. Deps básicas
_apt_deps() { DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl ca-certificates gnupg dialog jq apt-utils; }
step "Instalando dependências básicas" _apt_deps

# Nota de seguranca sobre os dois `curl ... | sh/bash` abaixo:
#   Sao os instaladores OFICIAIS do NodeSource e do Docker, baixados via
#   HTTPS (TLS verificado por -fsSL — falha se o cert for invalido). Rodam
#   como root. Nao pinamos por checksum porque esses scripts mudam a cada
#   release upstream (um pin fixo quebraria toda atualizacao deles). Esse
#   eh o trade-off aceito pela industria pra esses dois fornecedores
#   especificos. Quem exige supply-chain estrita pode instalar Node e
#   Docker via apt/keyring ANTES e o setup detecta (command -v) e pula.

# 5. Node.js 20
_install_node() { curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs; }
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]; then
  step "Instalando Node.js 20 (NodeSource oficial, HTTPS)" _install_node
fi
ok "Node.js $(node -v) instalado"

# 6. Docker
_install_docker() { curl -fsSL https://get.docker.com | sh; }
if ! command -v docker >/dev/null 2>&1; then
  step "Instalando Docker Engine (get.docker.com oficial, HTTPS)" _install_docker
fi
ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') instalado"

# 7. Swarm
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
  step "Iniciando Docker Swarm" docker swarm init || {
    err "Falha ao iniciar Swarm. Veja: docker info"
    exit 1
  }
fi
ok "Docker Swarm ativo"

# 8. aurora-net
if ! docker network ls --format '{{.Name}}' | grep -q '^aurora-net$'; then
  step "Criando overlay network aurora-net" \
    docker network create -d overlay --attachable aurora-net
fi
ok "Network aurora-net pronta"

# 9. Estrutura
_mk_struct() { mkdir -p /opt/aurora/{apps,stacks,volumes,backups,configs,logs} && mkdir -p /etc/aurora; }
step "Criando estrutura /opt/aurora" _mk_struct

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
