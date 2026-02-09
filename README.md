# Homelinks

Keep all your Docker apps in one place. A simple, self-hosted dashboard to organize and quickly access your Docker services. Create, edit, and delete entries with optional thumbnails, then open them in a new tab. Data is persisted in SQLite and the app is ready to deploy with Docker.

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

### Generating a secure SESSION_SECRET

Before deploying, generate a strong random secret:

```bash
# Using Node.js (recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

Copy the output and use it as your `SESSION_SECRET` value.

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

If you run Docker Compose, it will also read `.env` and use `PORT`, `DB_PATH`, `DATA_DIR`, and `UPLOAD_DIR`.
For local development, you can remove `DB_PATH` or set it to `./data/homelinks.sqlite`.

Store the admin password in `ADMIN_PASSWORD` (plain text).

**Important**: Replace `SESSION_SECRET=change-me` with a secure random string (see above).

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
sudo chmod 775 /opt/docker/homelinks
sudo chmod 775 /opt/docker/homelinks/data
```

## 🔒 Security Features

- **Rate limiting**: Maximum 5 login attempts per 15 minutes per IP
- **Timing-attack protection**: Uses `crypto.timingSafeEqual` for credential comparison
- **URL validation**: Only valid HTTP/HTTPS URLs are accepted
- **Image validation**: Size, dimensions, and format checks
- **Session security**: HttpOnly cookies with SameSite protection
- **SQL injection prevention**: Prepared statements in all database queries
- **Graceful shutdown**: Proper database connection cleanup on termination

## 🧪 API

### Authentication
- `GET /api/session` - Check if user is authenticated
- `POST /api/login` - Login with email and password (rate limited)
- `POST /api/logout` - Logout and destroy session

### Apps
- `GET /api/apps` - List all apps (authenticated)
- `POST /api/apps` - Create new app (authenticated, multipart form with `name`, `url`, optional `image`)
- `PUT /api/apps/:id` - Update app (authenticated, multipart form with `name`, `url`, optional `image`)
- `DELETE /api/apps/:id` - Delete app (authenticated)

## 🩺 Health check

- `GET /health` - Health status with database connectivity check

Returns:
```json
{
  "ok": true,
  "timestamp": "2026-02-09T16:30:00.000Z",
  "status": "healthy"
}
```

## � Troubleshooting

### "Too many login attempts"

Wait 15 minutes or restart the container to reset the rate limiter.

### Database locked errors

Ensure only one instance is accessing the database. SQLite doesn't support multiple concurrent writers.

### Images not loading

Check that:
- The `UPLOAD_DIR` permissions are correct
- The volume mapping in Docker is set up properly
- Images are <= 1024x1024 pixels and <= 1MB

### 404 errors on static files

Rebuild the Docker image to include the latest path fixes:
```bash
docker compose build --no-cache
docker compose up -d
```

## �📝 Changelog

See [CHANGELOG.md](CHANGELOG.md).

## 📝 License

This project is licensed under the Apache 2.0 License - see [LICENSE](LICENSE).

## 👤 Author

Arturo Carretero Calvo — 2026