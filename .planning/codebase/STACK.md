# Technology Stack

**Analysis Date:** 2026-01-20

## Languages

**Primary:**
- PHP 8.3 - Backend API (`backend/src/`)
- TypeScript 5.7 - Frontend application (`frontend/src/`)

**Secondary:**
- Twig - Email and AI prompt templates (`backend/templates/`)
- YAML - Symfony configuration (`backend/config/`)

## Runtime

**Environment:**
- PHP 8.3-fpm-alpine (Docker)
- Node.js 22-alpine (Docker)
- Nginx (reverse proxy)
- PostgreSQL 16-alpine

**Package Manager:**
- Composer (PHP backend)
- npm (Node.js frontend)
- Lockfile: `backend/composer.lock`, `frontend/package-lock.json`

## Frameworks

**Core:**
- Symfony 7.4 - Backend framework (`backend/composer.json`)
- React 19 - Frontend UI library (`frontend/package.json`)
- Redux Toolkit 2.5 - State management (`frontend/src/store/`)

**UI:**
- Tailwind CSS 3.4 - Utility-first CSS (`frontend/tailwind.config.js`)
- shadcn/ui (Radix UI) - Component library (Dialog, Popover, Slot)
- Lucide React - Icon library
- Tiptap 3.15 - Rich text editor

**Testing:**
- PHPUnit 11.5 - Backend unit tests
- Symfony PHPUnit Bridge 7.4

**Build/Dev:**
- Vite 6.0 - Frontend bundler (`frontend/vite.config.ts`)
- Docker Compose - Container orchestration (`docker-compose.yml`)

## Key Dependencies

**Backend Critical:**
- `doctrine/orm` ^3.3 - ORM for PostgreSQL
- `doctrine/doctrine-bundle` ^2.13 - Doctrine integration
- `symfony/http-client` 7.4 - OpenAI API requests
- `symfony/mailer` 7.4 - Email sending
- `symfony/security-bundle` ^7.4 - Authentication
- `symfony/serializer` ^7.4 - JSON serialization
- `symfony/twig-bundle` 7.4 - Template engine (prompts, emails)

**Backend Dev:**
- `symplify/easy-coding-standard` ^12 - Code style enforcement
- `symfony/maker-bundle` ^1.62 - Code generation

**Frontend Critical:**
- `@reduxjs/toolkit` ^2.5.0 - State management
- `react-redux` ^9.2.0 - React-Redux bindings
- `@dnd-kit/core` ^6.3.1 - Drag and drop (schedule)
- `@dnd-kit/sortable` ^10.0.0 - Sortable lists
- `i18next` ^25.7.4 - Internationalization (en/pl)
- `react-i18next` ^16.5.3 - React i18n bindings
- `canvas-confetti` ^1.9.4 - Celebration effects

**Frontend UI:**
- `@radix-ui/react-dialog` ^1.1.15 - Modal dialogs
- `@radix-ui/react-popover` ^1.1.15 - Popovers
- `class-variance-authority` ^0.7.1 - Variant styling
- `clsx` ^2.1.1 - Class name utility
- `tailwind-merge` ^2.6.0 - Tailwind class merging
- `tailwindcss-animate` ^1.0.7 - Animation utilities

**Frontend Dev:**
- `eslint` ^9.17.0 - Linting
- `prettier` ^3.4.2 - Code formatting
- `typescript-eslint` ^8.19.0 - TypeScript ESLint
- `@vitejs/plugin-react` ^4.3.4 - React Vite plugin

## Configuration

**Environment Variables:**

Backend (`backend/.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key (required)
- `ALLOWED_USERS` - Whitelist of allowed user emails
- `MAILER_DSN` - SMTP configuration (Mailpit in dev)
- `MAIL_FROM` - Sender email address (default: noreply@dopaminder.app)
- `APP_ENV` - Environment (dev/prod)
- `APP_SECRET` - Symfony application secret

**Build:**
- `backend/config/` - Symfony YAML configuration
- `frontend/vite.config.ts` - Vite bundler config
- `frontend/tsconfig.json` - TypeScript compiler config
- `frontend/tailwind.config.js` - Tailwind CSS config
- `frontend/eslint.config.js` - ESLint config

**Path Aliases:**
- `@/*` maps to `./src/*` in frontend (`tsconfig.json`, `vite.config.ts`)

## Platform Requirements

**Development:**
- Docker and Docker Compose
- Make (for Makefile commands)
- Ports: 3100 (frontend), 8180 (backend API), 5532 (PostgreSQL), 8125 (Mailpit UI)

**Production:**
- PostgreSQL 16+
- PHP 8.3+ with extensions: pdo_pgsql, intl, opcache, zip, mbstring
- Node.js 22+ (for building frontend)
- SMTP server for emails

## Docker Services

| Service | Image | Port |
|---------|-------|------|
| nginx | Custom (./docker/nginx) | 8180:80 |
| php | php:8.3-fpm-alpine + extensions | 9000 (internal) |
| node | node:22-alpine | 3100:3000, 5273:5173 |
| postgres | postgres:16-alpine | 5532:5432 |
| mailpit | axllent/mailpit | 8125:8025, 1125:1025 |

## PHP Extensions

Installed via Dockerfile (`docker/php/Dockerfile`):
- pdo, pdo_pgsql
- intl
- opcache
- zip
- mbstring
- xdebug (dev only)

## Commands

**Development:**
```bash
make dev          # Start development environment
make install      # Install all dependencies
make sh-backend   # Shell into PHP container
make sh-frontend  # Shell into Node container
```

**Database:**
```bash
make db-migrate   # Run Doctrine migrations
make db-diff      # Generate migration diff
make db-create    # Create database
```

**Linting/Formatting:**
```bash
make lint-backend   # Run ECS (PHP)
make lint-frontend  # Run ESLint
make fix-backend    # Fix with ECS
make fix-frontend   # Fix with Prettier + ESLint
```

**Testing:**
```bash
make test-backend   # Run PHPUnit tests
```

---

*Stack analysis: 2026-01-20*
