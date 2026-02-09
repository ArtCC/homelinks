# 🧭 homelinks

Self-hosted bookmarks manager to keep all your Docker apps in one place. Create, edit, and delete entries, then open them in a new tab. Data is persisted in SQLite and the app is ready to deploy with Docker.

## ✨ Features

- CRUD for app name + URL
- One-click open in a new tab
- SQLite persistence
- Docker-ready with optional Portainer stack

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
			- DB_PATH=/app/data/homelinks.sqlite
		volumes:
			- ./data:/app/data
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

### .env example

Create a `.env` file based on [.env.example](.env.example):

```env
PORT=9500
DB_PATH=./data/homelinks.sqlite
```

If you run Docker Compose, it will also read `.env` and use `PORT` for port mapping.

## 💾 Data persistence

The SQLite database is stored at `DB_PATH`. With Docker, map a volume (e.g. `./data:/app/data`) so data survives container restarts.

## 🧪 API

- `GET /api/apps`
- `POST /api/apps`
- `PUT /api/apps/:id`
- `DELETE /api/apps/:id`

## 🩺 Health check

- `GET /health`

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md).

## 📝 License

This project is licensed under the Apache 2.0 License - see [LICENSE](LICENSE).

## 👤 Author

Arturo Carretero Calvo — 2026