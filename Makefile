.PHONY: help up down logs reset db clean install dev build

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

up: ## Start all services with Docker Compose
	docker compose up -d --build

down: ## Stop all services
	docker compose down

logs: ## Follow logs from all services
	docker compose logs -f

db: ## Run database migrations and seed
	docker compose exec web pnpm db:migrate
	docker compose exec web pnpm db:seed

reset: ## Reset database (WARNING: destroys all data)
	docker compose down -v
	docker compose up -d --build
	$(MAKE) db

clean: ## Clean up Docker images and volumes
	docker compose down -v --rmi all

dev: ## Start development mode (requires dependencies installed)
	pnpm dev

build: ## Build the project
	pnpm build

typecheck: ## Run TypeScript type checking
	pnpm typecheck

lint: ## Run linting
	pnpm lint

test: ## Run tests
	pnpm test

e2e: ## Run end-to-end tests
	pnpm e2e