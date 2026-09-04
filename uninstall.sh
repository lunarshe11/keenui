#!/bin/sh
# Keen UI uninstaller
set -e

echo "Удаление Keen UI..."
/opt/etc/init.d/S80lighttpd stop 2>/dev/null || true
/opt/etc/init.d/S54darkstat stop 2>/dev/null || true
rm -rf /opt/keen
rm -f /opt/etc/lighttpd/lighttpd.conf
rm -f /opt/etc/lighttpd/lighttpd.user
rm -f /opt/etc/init.d/S80lighttpd
rm -f /opt/etc/init.d/S54darkstat

# Возвращаем админку на порт 80
ndmc -c "ip http port 80" 2>/dev/null || true
ndmc -c "system configuration save" 2>/dev/null || true

echo "Готово. Оригинальная админка вернулась на http://192.168.1.1/"
echo "Пакеты (lighttpd, vnstat2, vnstati2, darkstat) не удалялись."
echo "Если нужно — удали вручную: opkg remove lighttpd vnstat2 vnstati2 darkstat"
