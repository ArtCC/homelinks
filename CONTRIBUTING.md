# Contributing to Homelinks

Thank you for your interest in contributing to Homelinks! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. Please be considerate and constructive in your interactions.

## 🚀 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (Docker version, Node.js version, OS)

### Suggesting Features

Feature requests are welcome! Please provide:

- **Clear use case** - Why is this feature needed?
- **Proposed solution** - How should it work?
- **Alternatives considered** - Other approaches you've thought about

### Pull Requests

We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`
2. Make your changes following our [coding guidelines](#coding-guidelines)
3. Test your changes thoroughly
4. Ensure linting passes: `npm run lint`
5. Update documentation if needed
6. Submit your pull request!

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional, for testing containers)
- Git

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/homelinks.git
   cd homelinks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

4. **Run locally**
   ```bash
   npm start
   ```

5. **Access the app**
   - Open http://localhost:9500
   - Login with credentials from your .env file

### Testing with Docker

```bash
docker compose up -d
docker compose logs -f
```

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clear, documented code
   - Follow existing code style
   - Add comments for complex logic

3. **Run linting**
   ```bash
   npm run lint
   ```

4. **Commit your changes**
   - Follow our [commit message guidelines](#commit-messages)
   - Keep commits atomic and focused

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Open a pull request on GitHub
   - Fill out the PR template
   - Link related issues

6. **Code review**
   - Address any feedback from maintainers
   - Keep your branch up to date with `main`

## 📝 Coding Guidelines

### JavaScript Style

- Use **ES6+ syntax** (const/let, arrow functions, async/await)
- Use **2 spaces** for indentation
- Follow existing ESLint configuration
- No unused variables
- Use meaningful variable names

### File Organization

```
src/
  ├── config/      # Configuration files
  ├── middleware/  # Express middleware
  ├── routes/      # API routes
  ├── services/    # Business logic
  └── server.js    # Entry point

public/
  ├── app.js       # Frontend logic
  ├── styles.css   # Styling
  └── *.html       # HTML pages
```

### Code Comments

- Add comments for **complex logic** only
- Write **self-documenting code** when possible
- Use JSDoc for functions in `src/`
- Keep comments concise and clear

### CSS

- Use **CSS variables** for colors and spacing
- Follow existing naming conventions
- Mobile-first responsive design
- Keep specificity low

## 💬 Commit Messages

Use clear, descriptive commit messages:

### Format

```
<type>: <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat: add list view toggle for apps

- Implement grid/list view switcher
- Add localStorage persistence for view preference
- Update responsive styles for list view

Closes #123
```

```bash
fix: star icon not visible in list view

Add stroke property to SVG icon in list view CSS.
```

## 🧪 Testing

Currently, the project relies on manual testing. Automated tests are welcome contributions!

### Manual Testing Checklist

- [ ] Login/logout works correctly
- [ ] CRUD operations for apps (create, read, update, delete)
- [ ] Image upload and validation
- [ ] Favorites toggle
- [ ] Theme switching (auto/light/dark)
- [ ] View switching (grid/list)
- [ ] Search and pagination
- [ ] Responsive design on mobile
- [ ] Dark mode rendering

## 📄 Documentation

When contributing features:

- Update `README.md` if adding user-facing features
- Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/)
- Add inline code comments for complex logic
- Update API documentation if modifying endpoints

## ❓ Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## 📜 License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

Thank you for contributing to Homelinks! 🚀