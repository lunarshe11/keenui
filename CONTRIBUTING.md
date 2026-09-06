# Contributing

Спасибо за интерес к проекту!

## Как помочь

1. Форкни репозиторий
2. Создай ветку (`git checkout -b feature/amazing` )
3. Закоммить (`git commit -m "feat: add amazing"` )
4. Запушь (`git push origin feature/amazing` )
5. Открой Pull Request

## Стиль кода

### JavaScript
- 2 пробела для отступов
- Точка с запятой в конце
- Одинарные кавычки
- Без `var`, только `let` и `const`

### Shell
- `#!/opt/bin/sh` (busybox)
- Проверяй синтаксис через `sh -n script.sh`

### Python
- PEP 8
- Python 3.13

## Коммиты

Формат: `<type>(<scope>): <описание>`

Типы:
- `feat` — новая функциональность
- `fix` — исправление бага
- `docs` — документация
- `chore` — рутина
- `refactor` — рефакторинг
- `style` — форматирование
- `test` — тесты

## Сообщения об ошибках

Используй шаблон Issue. Прикладывай:
- Версию KeeneticOS (`show version`)
- Модель роутера
- Архитектуру (`uname -m`)
- Скриншот ошибки
- Логи (`/opt/var/log/lighttpd/error.log`)
