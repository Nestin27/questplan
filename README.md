# QuestPlan

Планировщик задач с недельным календарём и записной книжкой.

## Стек

- **Frontend**: React 18 + Vite
- **Сервер**: Nginx (alpine)
- **Контейнеризация**: Docker + Docker Compose

---

## Быстрый старт (Docker Compose)

```bash
# Клонировать / скопировать проект
cd questplan

# Собрать и запустить
docker compose up -d --build

# Приложение доступно на:
# http://localhost:8080
```

### Остановить
```bash
docker compose down
```

### Пересобрать после изменений
```bash
docker compose up -d --build
```

---

## Запуск для разработки (без Docker)

```bash
# Установить зависимости
npm install

# Dev-сервер с hot reload на http://localhost:3000
npm run dev

# Собрать production-билд в ./dist
npm run build
```

---

## Docker вручную (без Compose)

```bash
# Сборка образа
docker build -t questplan .

# Запуск контейнера
docker run -d \
  --name questplan \
  --restart unless-stopped \
  -p 8080:80 \
  questplan

# Просмотр логов
docker logs -f questplan

# Остановить и удалить
docker stop questplan && docker rm questplan
```

---

## Структура проекта

```
questplan/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Всё приложение (компоненты)
├── public/
│   └── favicon.svg
├── nginx/
│   └── default.conf      # Nginx конфиг (SPA routing + gzip + кэш)
├── index.html
├── vite.config.js
├── package.json
├── Dockerfile            # Multi-stage: node:20-alpine → nginx:alpine
├── docker-compose.yml
└── .dockerignore
```

---

## Деплой на сервер

### Через Docker Compose (рекомендуется)

```bash
# На сервере:
git clone <your-repo> questplan
cd questplan
docker compose up -d --build
```

Приложение поднимется на порту **8080**. Если нужен порт 80 — измените в `docker-compose.yml`:
```yaml
ports:
  - "80:80"
```

### За Nginx reverse proxy

Если у вас уже есть Nginx/Traefik/Caddy на сервере, оставьте порт `8080` и проксируйте:

```nginx
# /etc/nginx/sites-available/questplan
server {
    listen 80;
    server_name questplan.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Данные

Все данные сохраняются в `localStorage` браузера. При необходимости можно добавить backend (например, Express + SQLite) для серверного хранения — структура уже готова к расширению.

---

## Особенности образа

- **Размер**: ~30 МБ (multi-stage build, alpine)
- **Кэширование**: статика кэшируется на 1 год (content hash от Vite)
- **SPA routing**: все пути → `index.html` через nginx
- **Gzip**: включён для JS/CSS/SVG
- **Health check**: встроен в Docker
