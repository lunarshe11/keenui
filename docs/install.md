# Установка

## Требования

- Роутер Keenetic с USB-портом
- Entware установлен на USB-накопитель
- KeeneticOS 4.x или 5.x
- SSH-доступ к роутеру

## Быстрая установка

```bash
wget -O - https://raw.githubusercontent.com/lunarshe11/keenui/main/install.sh | sh
```

## Что делает install.sh

1. Проверяет что Entware установлен
2. Устанавливает пакеты: lighttpd, lighttpd-mod-cgi, vnstat2, vnstati2, darkstat
3. Создаёт каталоги /opt/keen/www/, /opt/var/log/lighttpd/, /opt/var/lib/vnstat/
4. Скачивает файлы UI с GitHub
5. Создаёт пользователя admin:keenui
6. Переносит оригинальную админку на порт :8080
7. Настраивает vnstat на интерфейс br0
8. Запускает vnstatd, darkstat, lighttpd

## После установки

- **URL:** http://192.168.1.1/
- **Логин:** admin
- **Пароль:** keenui
- **Оригинальная админка:** http://192.168.1.1:8080/

**При первом входе UI предложит сменить пароль.**

## Ручная установка

Если install.sh не работает — можно установить вручную:

```bash
# 1. Пакеты
opkg update
opkg install lighttpd lighttpd-mod-cgi vnstat2 vnstati2 darkstat

# 2. Файлы
mkdir -p /opt/keen/www/{css,js,img,cgi-bin}
# Скачай файлы из files/www/ и положи в /opt/keen/www/

# 3. Конфиг lighttpd
cp files/lighttpd/lighttpd.conf /opt/etc/lighttpd/lighttpd.conf

# 4. Init-скрипты
cp files/init.d/* /opt/etc/init.d/
chmod +x /opt/etc/init.d/S80lighttpd /opt/etc/init.d/S54darkstat

# 5. Пользователь
printf "admin:keenui\n" > /opt/etc/lighttpd/lighttpd.user
chmod 600 /opt/etc/lighttpd/lighttpd.user

# 6. Запуск
/opt/etc/init.d/S80lighttpd start
/opt/etc/init.d/S54darkstat start
/opt/etc/init.d/S32vnstat2 start
```

## Удаление

```bash
wget -O - https://raw.githubusercontent.com/lunarshe11/keenui/main/uninstall.sh | sh
```

## Обновление

```bash
cd /opt/keen && git pull
/opt/etc/init.d/S80lighttpd restart
```
