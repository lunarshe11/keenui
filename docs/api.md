# CGI API

Backend Keen UI работает через CGI-скрипты.

## /cgi-bin/api

Принимает GET-параметры: `cmd` (команда) и `arg` (аргумент).

### Информация о системе

| Команда | Описание |
|---|---|
| `version` | Версия прошивки |
| `system` | Системная информация |
| `interfaces` | Сетевые интерфейсы |
| `probe` | Проверка RCI |

### Keenetic-сервисы

| Команда | Описание |
|---|---|
| `vnstat-oneline` | Трафик br0 (краткий) |
| `vnstati&arg=s` | PNG-график (s/h/d/m/t) |
| `darkstat-overview` | Общая статистика |
| `darkstat-hosts` | Список хостов |
| `cron-list` | Список задач cron |
| `cron-add&arg=...` | Добавить задачу |
| `cron-del&arg=...` | Удалить задачу |

### WiFi, сеть

| Команда | Описание |
|---|---|
| `wifi-list` | 5GHz + 2.4GHz |
| `wifi-ssid&arg=...&arg2=...` | Сменить SSID |
| `wifi-password&arg=...&arg2=...` | Сменить пароль |
| `dns-list` | DNS-серверы |
| `dns-add&arg=...` | Добавить DNS |
| `dns-remove&arg=...` | Удалить DNS |

### Клиенты

| Команда | Описание |
|---|---|
| `clients` | Список клиентов |
| `client-wol&arg=MAC` | Wake-on-LAN |
| `client-static&arg=MAC&arg2=IP` | Static IP |
| `client-block&arg=MAC` | Блокировка |
| `client-rename&arg=MAC&arg2=NAME` | Переименование |

### Произвольные команды

| Команда | Описание |
|---|---|
| `exec&arg=...` | RCI exec (shell-like) |
| `rci&arg=...` | RCI parse (NDMS) |

## /cgi-bin/file

Принимает `path=/полный/путь`. Отдаёт файл с правильным MIME-типом.

## Аутентификация

Все запросы требуют **Basic Auth**. Логин/пароль — из `/opt/etc/lighttpd/lighttpd.user`.
