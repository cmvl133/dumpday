.PHONY: help up down build install dev sh-backend sh-frontend db-migrate lint-backend lint-frontend fix-backend fix-frontend logs restart clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

## Help
help: ## Show this help message
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${YELLOW}%-20s${RESET} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

## Docker commands
up: ## Start all containers
	docker compose up -d

down: ## Stop all containers
	docker compose down

build: ## Build all containers
	docker compose build --no-cache

restart: ## Restart all containers
	docker compose restart

logs: ## Show logs from all containers
	docker compose logs -f

clean: ## Remove all containers, volumes, and networks
	docker compose down -v --remove-orphans

## Installation
install: ## Install all dependencies (composer + npm)
	@echo "${GREEN}Installing backend dependencies...${RESET}"
	docker compose run --rm php composer install
	@echo "${GREEN}Preparing frontend volume permissions...${RESET}"
	@docker run --rm -v $$(basename $$(pwd))_frontend_node_modules:/app/node_modules alpine chown -R 1000:1000 /app/node_modules 2>/dev/null || true
	@echo "${GREEN}Installing frontend dependencies...${RESET}"
	docker compose run --rm node npm install
	@echo "${GREEN}All dependencies installed!${RESET}"

## Development
dev: ## Start development environment with hot reload
	@echo "${GREEN}Starting development environment...${RESET}"
	@echo "${YELLOW}Frontend: http://localhost:3000${RESET}"
	@echo "${YELLOW}Backend API: http://localhost:8000/api${RESET}"
	docker compose up

## Shell access
sh-backend: ## Open shell in PHP container
	docker compose exec php sh

sh-frontend: ## Open shell in Node container
	docker compose exec node sh

## Database
db-migrate: ## Run Doctrine migrations
	docker compose exec php php bin/console doctrine:migrations:migrate --no-interaction

db-diff: ## Generate migration diff
	docker compose exec php php bin/console doctrine:migrations:diff

db-create: ## Create database
	docker compose exec php php bin/console doctrine:database:create --if-not-exists

## Linting
lint-backend: ## Run ECS (Easy Coding Standard)
	docker compose exec php vendor/bin/ecs check

lint-frontend: ## Run ESLint
	docker compose exec node npm run lint

## Formatting / Fixing
fix-backend: ## Fix code with ECS
	docker compose exec php vendor/bin/ecs check --fix

fix-frontend: ## Fix code with Prettier and ESLint
	docker compose exec node npm run format
	docker compose exec node npm run lint:fix

## Utility
cache-clear: ## Clear Symfony cache
	docker compose exec php php bin/console cache:clear

test-backend: ## Run PHPUnit tests
	docker compose exec php php bin/phpunit

composer: ## Run composer command (usage: make composer CMD="require package")
	docker compose exec php composer $(CMD)

npm: ## Run npm command (usage: make npm CMD="install package")
	docker compose exec node npm $(CMD)
