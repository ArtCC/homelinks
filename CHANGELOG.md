# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.6] - 2026-02-14

### Added

- Favorites section heading above the main list when favorites exist

### Changed

- Add app button aligned to the left
- Pagination adapts on narrow screens (short label + tighter buttons)

### Fixed

- List view layout no longer expands when description text is present
- List view description wraps/clamps without affecting container width

## [0.0.5] - 2026-02-11

### Changed

- Add app button aligned to the left
- Pagination label shortens on narrow screens ("1 of 2")

### Fixed

- List view layout no longer expands when description text is present
- List view description now wraps/clamps without affecting container width

## [0.0.4] - 2026-02-10

### Added

- **Category system**: Organize apps with custom categories and tags
- **Category filter**: Dropdown in toolbar to filter apps by category
- **Category autocomplete**: Datalist suggestions from existing categories when adding/editing apps
- **App descriptions**: Optional text field to add notes about each app
- **Description display**: Shown in both grid (2-line clamp) and list (single line ellipsis) views
- **Search by category**: Search now matches category in addition to name, URL, and description
- **Input validation**: Category limited to 50 characters, description limited to 500 characters (both client and server)
- New API endpoint: `GET /api/apps/categories` to list unique categories

### Changed

- Create and update endpoints now accept optional `category` and `description` fields
- Database schema auto-migrates to add `category` and `description` columns
- Empty string categories are excluded from category lists

### Fixed

- Case-insensitive category deduplication (e.g. "Media" and "media" are now treated as one)
- Empty string categories no longer appear in filter or suggestions

## [0.0.3] - 2026-02-09

### Added

- **Grid/List view toggle**: New button in header to switch between grid cards and compact list view
- **List view**: Horizontal layout with 80x80px thumbnails, name, URL, and inline actions
- **View persistence**: User's view preference stored in localStorage
- **Dynamic view icons**: Button icon changes between grid-3x3 and list based on active view
- **Responsive list view**: Adaptive layout for mobile devices (vertical stack)
- Session validation before page load to prevent flash of unauthorized content

### Changed

- Both root `/` and `/index.html` now redirect to login if not authenticated
- Improved window.open behavior using native link click for better cross-origin compatibility

### Fixed

- Flash of index.html content before redirect to login (added client-side session check)
- Star icon not visible in list view (added stroke property to SVG)
- Cross-origin link opening (qBittorrent and similar services)

## [0.0.2] - 2026-02-09

### Added

- **Favorites system**: Star toggle button on app cards to pin important apps
- **Manual theme selector**: Cycle between auto/light/dark modes with dedicated button
- **Theme persistence**: User theme preference stored in localStorage
- **Dynamic theme icons**: Button icon changes between monitor/sun/moon based on selected theme
- **Collapsible form**: "New app" form can be hidden/shown with toggle button
- **Empty state differentiation**: Different messages for "no apps" vs "no search results"
- **Session persistence**: Login session now lasts 30 days (survives browser restart)
- **Login theme support**: Login page respects user's theme selection
- Apps automatically ordered by favorite status, then alphabetically
- New API endpoint: `PATCH /api/apps/:id/favorite` to toggle favorite status

### Changed

- Pagination reduced from 10 to 6 items per page for better visual balance (2 rows × 3 columns)
- Favorited apps display with gold star icon and highlighted border
- Theme toggle replaces icon element to ensure proper visual update

### Fixed

- Theme icon not updating visually on click (now replaces DOM element)
- Session lost on browser restart (added maxAge to cookie configuration)

## [0.0.1] - 2026-02-09

### Added

- Initial release with CRUD UI for app bookmarks
- Modern grid-based card layout for apps (responsive: 3 columns desktop, 2 tablet, 1 mobile)
- Lucide icon system throughout the UI
- Image preview before uploading
- Microanimations: fade-in, scale-in, stagger animations for cards
- Hover effects with elevation and scaling
- Dark mode support based on system preference (`prefers-color-scheme`)
- Enhanced focus states with visible focus rings
- Modern color palette (Indigo accent, improved contrast)
- Improved empty states with icons and helpful messages
- Better search box with icon
- Thumbnail placeholders with gradients when no image
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

### Changed

- Redesigned complete UI with modern, minimalist aesthetic
- Updated color system with CSS variables for light/dark modes
- Improved button styles with better states (hover, focus, disabled)
- Enhanced typography and spacing
- Larger app thumbnails (16:9 aspect ratio vs 56x56px)
- Improved mobile responsive design

### Security

- Resolved tar vulnerability by overriding to version 7.5.7 (fixes CVE issues in build dependencies)