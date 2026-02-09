# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-02-09

### Added

- Initial release with CRUD UI for app bookmarks
- SQLite persistence and REST API
- Docker/Portainer deployment ready with GHCR image publishing
- Admin login with session management
- Rate limiting on login endpoint to prevent brute force attacks (max 5 attempts per 15 minutes)
- URL format validation for app entries
- Optional app thumbnails (jpg/png/webp, max 1024x1024, 1MB)
- Image upload with size and dimension validation
- Search functionality for apps
- Pagination support (10 items per page)
- Configurable image size limits via environment variables (`MAX_IMAGE_SIZE`, `MAX_IMAGE_BYTES`)
- Loading states for all async operations (save, delete, login)
- Better error handling and user feedback in frontend
- Graceful shutdown handling for database connections (SIGTERM, SIGINT)
- Enhanced health check endpoint with database connectivity verification
- Timing-attack protection using `crypto.timingSafeEqual` for both email and password comparison
- Responsive design with mobile support

### Security

- Resolved tar vulnerability by overriding to version 7.5.7 (fixes CVE issues in build dependencies)