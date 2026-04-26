# To-Do — Планируем жизнь к лучшему

Планировщик задач с недельным календарём и записной книжкой.

## Стек

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **База данных**: SQLite (better-sqlite3) — данные доступны с любого устройства в локальной сети
- **Файлы**: хранятся на сервере, доступны по URL

---

## Быстрый старт (локально)

```bash
# 1. Установить зависимости
npm install

# 2. Запустить бэкенд (в одном терминале)
npm run dev:server
# → API на http://localhost:4000

# 3. Запустить фронтенд (в другом терминале)
npm run dev:client
# → Приложение на http://localhost:3000
```

Открыть с телефона или другого устройства в локальной сети:
```
http://<IP вашего компьютера>:3000
```

---

## Docker (для постоянного запуска)

```bash
# Собрать и запустить
docker compose up -d --build

# Приложение: http://localhost:8080
# В локальной сети: http://<IP>:8080

# Логи
docker compose logs -f

# Остановить
docker compose down
```

Данные (SQLite + файлы) хранятся в Docker volume `questplan_data` — не теряются при перезапуске.

---

## Структура проекта

```
questplan/
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # UI — планировщик + записная книжка
│   └── api.js            # Все обращения к бэкенду
├── server/
│   └── index.js          # Express API + SQLite
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js        # Vite + proxy на бэкенд (для dev)
├── package.json
├── Dockerfile
└── docker-compose.yml
```

---

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/tasks | Все задачи |
| POST | /api/tasks | Создать задачу |
| PATCH | /api/tasks/:id | Обновить задачу |
| DELETE | /api/tasks/:id | Удалить задачу |
| POST | /api/tasks/:id/subtasks | Добавить подзадачу |
| GET | /api/notes | Все заметки |
| POST | /api/notes | Создать заметку |
| POST | /api/notes/:id/blocks | Добавить блок (текст/код) |
| POST | /api/notes/:id/blocks/file | Загрузить файл |
| GET | /uploads/:filename | Скачать файл |
