# React + Symfony Boilerplate

Full-stack application boilerplate with React 19 frontend and Symfony 7 backend.

## Tech Stack

### Backend
- PHP 8.3
- Symfony 7.2
- Doctrine ORM
- PostgreSQL 16
- ECS (Easy Coding Standard)

### Frontend
- React 19
- TypeScript
- Redux Toolkit
- Vite
- Tailwind CSS
- shadcn/ui components

### Infrastructure
- Docker with docker-compose
- Nginx reverse proxy
- Hot reload for development

## Quick Start

```bash
# Build containers
make build

# Install dependencies
make install

# Start development environment
make dev
```

After running these commands:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Health check: http://localhost:8000/api/health

## Available Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all containers in background |
| `make down` | Stop all containers |
| `make build` | Build all containers |
| `make install` | Install all dependencies (composer + npm) |
| `make dev` | Start development environment with hot reload |
| `make sh-backend` | Open shell in PHP container |
| `make sh-frontend` | Open shell in Node container |
| `make db-migrate` | Run Doctrine migrations |
| `make lint-backend` | Run ECS |
| `make lint-frontend` | Run ESLint |
| `make fix-backend` | Fix code with ECS |
| `make fix-frontend` | Fix code with Prettier and ESLint |

## Project Structure

```
.
├── backend/                 # Symfony application
│   ├── config/             # Symfony configuration
│   ├── migrations/         # Doctrine migrations
│   ├── public/             # Public directory (index.php)
│   ├── src/                # PHP source code
│   │   ├── Controller/     # API controllers
│   │   ├── Entity/         # Doctrine entities
│   │   └── Repository/     # Doctrine repositories
│   └── tests/              # PHPUnit tests
├── frontend/               # React application
│   ├── public/             # Static assets
│   └── src/                # TypeScript source code
│       ├── components/     # React components
│       │   └── ui/         # shadcn/ui components
│       ├── lib/            # Utility functions
│       └── store/          # Redux store
├── docker/                 # Docker configuration
│   ├── nginx/              # Nginx config
│   ├── node/               # Node Dockerfile
│   ├── php/                # PHP-FPM Dockerfile
│   └── postgres/           # PostgreSQL config
├── docker-compose.yml      # Docker services
└── Makefile               # Build commands
```

## Adding shadcn/ui Components

The project is pre-configured for shadcn/ui. To add new components:

```bash
make sh-frontend
npx shadcn@latest add <component-name>
```

## Environment Variables

### Backend (.env)
```
APP_ENV=dev
APP_SECRET=change_this_secret_in_production
DATABASE_URL=postgresql://app:app@postgres:5432/app
```

### Database Connection
- Host: postgres (inside docker) / localhost:5432 (from host)
- Database: app
- User: app
- Password: app
