# 🧭 homelinks

Self-hosted bookmarks manager to keep all your Docker apps in one place. Create, edit, and delete entries, then open them in a new tab. Data is persisted in SQLite and the app is ready to deploy with Docker.

> Security note: this project includes basic admin login with rate limiting and timing-attack protection, but is still intended for private networks. Do not expose it publicly without additional security measures.

## ✨ Features

- CRUD for app name + URL with validation
- One-click open in a new tab
- Optional app thumbnails (jpg/png/webp, max 1024x1024, 1MB)
- SQLite persistence
- Docker-ready with optional Portainer stack
- Rate limiting on login (protection against brute force)
- Graceful shutdown handling
- Health check endpoint with database verification

## 🧱 Tech stack

- Node.js + Express
- SQLite (`sqlite3`)
- Vanilla HTML/CSS/JS

## ✅ Requirements

- Node.js 20+
- Docker (optional)

## 🚀 Quick start (local)

```bash
npm install
npm start
```

Open http://localhost:9500

## 🐳 Docker

```bash
docker compose up -d
```

Make sure you have `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` set in your `.env` file first.

Open http://localhost:9500

### Example docker-compose.yml

```yaml
services:
  homelinks:
    image: ghcr.io/artcc/homelinks:latest
    container_name: homelinks
    ports:
      - "${PORT:-9500}:${PORT:-9500}"
    environment:
      - PORT=${PORT:-9500}
      - DB_PATH=${DB_PATH:-/app/data/homelinks.sqlite}
      - UPLOAD_DIR=${UPLOAD_DIR:-/app/data/uploads}
      - MAX_IMAGE_SIZE=${MAX_IMAGE_SIZE:-1024}
      - MAX_IMAGE_BYTES=${MAX_IMAGE_BYTES:-1048576}
      - ADMIN_EMAIL=${ADMIN_EMAIL:?}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:?}
      - SESSION_SECRET=${SESSION_SECRET:?}
      - COOKIE_SECURE=${COOKIE_SECURE:-false}
    volumes:
      - ${DATA_DIR:-./data}:/app/data
    restart: unless-stopped
```

### Portainer

Create a Stack and paste the compose file above. Adjust ports and volumes as needed.

To pull manually:

```bash
docker pull ghcr.io/artcc/homelinks:latest
```

## 🔧 Configuration

### Environment variables

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| `PORT` | Server port | No | 9500 |
| `DB_PATH` | SQLite database path | No | `./data/homelinks.sqlite` |
| `DATA_DIR` | Host data directory for Docker volume | No | `./data` |
| `UPLOAD_DIR` | Uploads directory | No | `./data/uploads` |
| `MAX_IMAGE_SIZE` | Max image dimensions (px) | No | 1024 |
| `MAX_IMAGE_BYTES` | Max image file size (bytes) | No | 1048576 (1MB) |
| `ADMIN_EMAIL` | Admin email for login | Yes | - |
| `ADMIN_PASSWORD` | Admin password (plain text) | Yes | - |
| `SESSION_SECRET` | Session secret | Yes | - |
| `COOKIE_SECURE` | Set `true` behind HTTPS | No | `false` |

### .env example

Create a `.env` file based on [.env.example](.env.example):

```env
PORT=9500
DB_PATH=/app/data/homelinks.sqlite
DATA_DIR=./data
UPLOAD_DIR=/app/data/uploads
MAX_IMAGE_SIZE=1024
MAX_IMAGE_BYTES=1048576
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=
SESSION_SECRET=change-me
COOKIE_SECURE=false
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=
SESSION_SECRET=change-me
COOKIE_SECURE=false
```

If you run Docker Compose, it will also read `.env` and use `PORT`, `DB_PATH`, `DATA_DIR`, and `UPLOAD_DIR`.
For local development, you can remove `DB_PATH` or set it to `./data/homelinks.sqlite`.

Store the admin password in `ADMIN_PASSWORD` (plain text).

## 💾 Data persistence

The SQLite database is stored at `DB_PATH` and uploads go to `UPLOAD_DIR`. With Docker, map a volume (e.g. `./data:/app/data`) so data survives container restarts.

### Permissions (Linux servers)

If you create a host directory like `/opt/docker/homelinks/data`, these permissions work with the default container user (root):

```bash
sudo chown -R root:root /opt/docker/homelinks
sudo chmod 755 /opt/docker/homelinks
sudo chmod 755 /opt/docker/homelinks/data
```

If you prefer running as a non-root user (e.g. `1000:1000`), use:

```bash
sudo chown -R 1000:1000 /opt/docker/homelinks
sudo chmod 775 /opt/docker/homelinks /opt/docker/homelinks/data
```

## 🧪 API

- `GET /api/apps`
- `POST /api/apps` (multipart form with `name`, `url`, optional `image`)
- `PUT /api/apps/:id` (multipart form with `name`, `url`, optional `image`)
- `DELETE /api/apps/:id`

## 🩺 Health check

- `GET /health`

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md).

## 📝 License

This project is licensed under the Apache 2.0 License - see [LICENSE](LICENSE).

## 👤 Author

Arturo Carretero Calvo — 2026