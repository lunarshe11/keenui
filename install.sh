#!/bin/sh
# Keen UI installer for Keenetic + Entware
# Usage: wget -O - https://raw.githubusercontent.com/USER/keenui/main/install.sh | sh

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

info(){ printf "${BLUE}▸${NC} %s\n" "$1"; }
ok(){ printf "${GREEN}✓${NC} %s\n" "$1"; }
warn(){ printf "${YELLOW}⚠${NC} %s\n" "$1"; }
err(){ printf "${RED}✗${NC} %s\n" "$1"; exit 1; }

REPO_URL="https://raw.githubusercontent.com/USER/keenui/main"
UI_DIR="/opt/keen/www"
LIGHTTPD_DIR="/opt/etc/lighttpd"
INIT_DIR="/opt/etc/init.d"
DEFAULT_USER="admin"
DEFAULT_PASS="keenui"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         Keen UI installer            ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Проверка Entware
info "Проверка Entware..."
[ -x /opt/bin/opkg ] || err "Entware не установлен. Установите его и повторите."
ok "Entware найден"

# 2. Проверка архитектуры
ARCH=$(uname -m)
info "Архитектура: $ARCH"

# 3. Установка пакетов
info "Установка пакетов (lighttpd, vnstat2, vnstati2, darkstat)..."
opkg update >/dev/null 2>&1
opkg install lighttpd lighttpd-mod-cgi vnstat2 vnstati2 darkstat >/dev/null 2>&1
ok "Пакеты установлены"

# 4. Создание директорий
info "Создание структуры каталогов..."
mkdir -p "$UI_DIR/css" "$UI_DIR/js" "$UI_DIR/img" "$UI_DIR/cgi-bin"
mkdir -p /opt/var/log/lighttpd
mkdir -p /opt/var/lib/vnstat
mkdir -p /opt/var/lib/darkstat
ok "Каталоги созданы"

# 5. Скачивание файлов
info "Скачивание файлов Keen UI..."
BASE="$REPO_URL/files"
for pair in \
  "www/index.html:$UI_DIR/index.html" \
  "www/manifest.json:$UI_DIR/manifest.json" \
  "www/sw.js:$UI_DIR/sw.js" \
  "www/css/style.css:$UI_DIR/css/style.css" \
  "www/js/app.js:$UI_DIR/js/app.js" \
  "www/img/favicon.svg:$UI_DIR/img/favicon.svg" \
  "www/img/logo.svg:$UI_DIR/img/logo.svg" \
  "www/cgi-bin/api:$UI_DIR/cgi-bin/api" \
  "www/cgi-bin/file:$UI_DIR/cgi-bin/file" \
  "lighttpd/lighttpd.conf:$LIGHTTPD_DIR/lighttpd.conf" \
  "init.d/S80lighttpd:$INIT_DIR/S80lighttpd" \
  "init.d/S54darkstat:$INIT_DIR/S54darkstat"
do
  SRC="${pair%%:*}"; DST="${pair#*:}"
  wget -q -O "$DST" "$BASE/$SRC" || err "Не удалось скачать $SRC"
done
ok "Файлы скачаны"

# 6. Права
chmod +x "$UI_DIR/cgi-bin/api" "$UI_DIR/cgi-bin/file"
chmod +x "$INIT_DIR/S80lighttpd" "$INIT_DIR/S54darkstat"
chmod 600 "$LIGHTTPD_DIR/lighttpd.user" 2>/dev/null || true

# 7. Пользователь
if [ ! -f "$LIGHTTPD_DIR/lighttpd.user" ]; then
  info "Создание пользователя $DEFAULT_USER..."
  printf '%s:%s\n' "$DEFAULT_USER" "$DEFAULT_PASS" > "$LIGHTTPD_DIR/lighttpd.user"
  chmod 600 "$LIGHTTPD_DIR/lighttpd.user"
  ok "Пользователь создан: $DEFAULT_USER / $DEFAULT_PASS"
else
  warn "Пользователь уже существует — не перезаписываю"
fi

# 8. Перенос оригинальной админки на :8080
info "Перенос оригинальной админки на :8080..."
ndmc -c "ip http port 8080" >/dev/null 2>&1 || true
ndmc -c "system configuration save" >/dev/null 2>&1 || true
ok "Админка на http://192.168.1.1:8080/"

# 9. vnstat — инициализация
info "Настройка vnstat..."
cat > /opt/etc/vnstat.conf <<VNSTAT
DatabaseDir "/opt/var/lib/vnstat"
Interface "br0"
SaveInterval 5
PollInterval 5
VNSTAT
vnstat --add -i br0 2>/dev/null || true

# 10. Запуск сервисов
info "Запуск сервисов..."
"$INIT_DIR/S32vnstat2" restart >/dev/null 2>&1 || true
"$INIT_DIR/S54darkstat" restart >/dev/null 2>&1 || true
"$INIT_DIR/S80lighttpd" restart >/dev/null 2>&1 || true

sleep 2
if ps | grep -q "[l]ighttpd"; then
  ok "lighttpd запущен"
else
  warn "lighttpd не запустился — проверь /opt/var/log/lighttpd/error.log"
fi

# 11. Финальный вывод
IP=$(ip -4 addr show br0 2>/dev/null | grep inet | awk '{print $2}' | cut -d/ -f1 | head -1)
[ -z "$IP" ] && IP="192.168.1.1"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║         Установка завершена!         ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  URL:      http://$IP/"
echo "  Логин:    $DEFAULT_USER"
echo "  Пароль:   $DEFAULT_PASS"
echo ""
echo "  При первом входе предложит сменить пароль."
echo ""
echo "  Оригинальная админка: http://$IP:8080/"
echo ""
