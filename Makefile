DOCKER_COMPOSE := docker-compose
AUTH_SERVICE_DIR := auth-service
GAME_STORE_SERVICE_DIR := game-store-service
GATEWAY_DIR := gateway

UNAME_S := $(shell uname -s 2>/dev/null || echo Not_Linux)

.PHONY: help cleanup up down start stop start-container stop-container build rebuild logs clean

help:
ifeq ($(UNAME_S),Linux)
	@grep -E '^[a-zA-Z_-]+:|^#' Makefile | \
	awk '/^#/{if (prev) printf "%s\n", prev; printf "%s ", $$0; prev=""; next} {prev=$$0}' | \
	sed 's/^#//; s/:$$//'
else
	@powershell -Command "Get-Content Makefile | ForEach-Object { if ($$_ -match '^#') { $$_ -replace '^#', '' } elseif ($$_ -match '^[a-zA-Z_-]+:') { $$_ -replace ':', '' } }"
endif

# Cleanup unused Docker data
cleanup:
	docker system prune -f

# Start the services in the background using docker-compose
up:
	$(DOCKER_COMPOSE) up -d

# Stop and remove the containers
down:
	$(DOCKER_COMPOSE) down

# Start existing containers without rebuilding
start:
	$(DOCKER_COMPOSE) start

# Stop running containers
stop:
	$(DOCKER_COMPOSE) stop		

# Start a specific container (CONTAINER=<name>)
start-container:
	$(DOCKER_COMPOSE) start $(CONTAINER)

# Stop a specific container (CONTAINER=<name>)
stop-container:
	$(DOCKER_COMPOSE) stop $(CONTAINER)

# Build the services
build:
	$(DOCKER_COMPOSE) build

# Rebuild the services without using the cache
rebuild:
	$(DOCKER_COMPOSE) build --no-cache

# Tail the logs of the services
logs:
	$(DOCKER_COMPOSE) logs -f

# Clean up containers, volumes, and networks
clean:
	$(DOCKER_COMPOSE) down --volumes --remove-orphans
