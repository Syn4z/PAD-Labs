DOCKER_COMPOSE := docker-compose
AUTH_SERVICE_DIR := auth-service
GAME_STORE_SERVICE_DIR := game-store-service
GATEWAY_DIR := gateway

UNAME_S := $(shell uname -s 2>/dev/null || echo Not_Linux)

.PHONY: help cleanup up down start stop start-container stop-container build rebuild logs clean

help:		# Display all available commands
ifeq ($(UNAME_S),Linux)
	@grep -E '^[a-zA-Z_-]+:|^#' Makefile | \
	awk '/^#/{if (prev) printf "%s\n", prev; printf "%s ", $$0; prev=""; next} {prev=$$0}' | \
	sed 's/^#//; s/:$$//'
else
	@powershell -Command "Get-Content Makefile | ForEach-Object { if ($$_ -match '^#') { $$_ -replace '^#', '' } elseif ($$_ -match '^[a-zA-Z_-]+:') { $$_ -replace ':', '' } }"
endif

cleanup:		Cleanup unused Docker data
	docker system prune -f

up:        Start the services in the background using docker-compose
	$(DOCKER_COMPOSE) up -d

down:		Stop and remove the containers
	$(DOCKER_COMPOSE) down

start:        Start existing containers without rebuilding
	$(DOCKER_COMPOSE) start

stop:		Stop running containers
	$(DOCKER_COMPOSE) stop		

start-container:		Start a specific container (CONTAINER=<name>)
	$(DOCKER_COMPOSE) start $(CONTAINER)

stop-container:        Stop a specific container (CONTAINER=<name>)
	$(DOCKER_COMPOSE) stop $(CONTAINER)

build:        Build the services
	$(DOCKER_COMPOSE) build

rebuild:	    Rebuild the services without using the cache
	$(DOCKER_COMPOSE) build --no-cache

logs:        Tail the logs of the services
	$(DOCKER_COMPOSE) logs -f

clean:        Clean up containers, volumes, and networks
	$(DOCKER_COMPOSE) down --volumes --remove-orphans

test-auth-service:        Run unit tests for auth-service
	@cd $(AUTH_SERVICE_DIR)/src && python -m unittest discover -s test -p "unitTests.py"