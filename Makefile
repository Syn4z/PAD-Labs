# Define variables
DOCKER_COMPOSE := docker-compose
AUTH_SERVICE_DIR := auth-service
GAME_STORE_SERVICE_DIR := game-store-service
GATEWAY_DIR := gateway

# Docker commands
.PHONY: up down build rebuild logs

cleanup:
	docker system prune -f
up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

start:
	$(DOCKER_COMPOSE) start

stop:
	$(DOCKER_COMPOSE) stop		

start-container:
	$(DOCKER_COMPOSE) start $(CONTAINER)

stop-container:
	$(DOCKER_COMPOSE) stop $(CONTAINER)

build:
	$(DOCKER_COMPOSE) build

rebuild:
	$(DOCKER_COMPOSE) build --no-cache

logs:
	$(DOCKER_COMPOSE) logs -f

# Database Migrations
.PHONY: migrate-auth migrate-game-store

migrate-auth:
	@echo "Running DB migrations for Auth Service"
	cd $(AUTH_SERVICE_DIR) && alembic upgrade head

migrate-game-store:
	@echo "Running DB migrations for Game Store Service"
	cd $(GAME_STORE_SERVICE_DIR) && alembic upgrade head

# Clean up containers, volumes, and networks
clean:
	$(DOCKER_COMPOSE) down --volumes --remove-orphans