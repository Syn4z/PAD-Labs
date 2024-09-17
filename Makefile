# Define variables
DOCKER_COMPOSE := docker-compose
AUTH_SERVICE_DIR := auth-service
GAME_STORE_SERVICE_DIR := game-store-service
GATEWAY_DIR := gateway

# Detect OS
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    ACTIVATE_VENV := venv\Scripts\activate
    PYTHON := python
    PIP_UPGRADE := python -m pip install --upgrade pip
else
    DETECTED_OS := $(shell uname -s)
    ACTIVATE_VENV := . venv/bin/activate
    PYTHON := python3
    PIP_UPGRADE := pip install --upgrade pip
endif

# Docker commands
.PHONY: up down build rebuild logs

up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

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

# Gateway tasks
.PHONY: start-gateway stop-gateway restart-gateway

start-gateway:
	@echo "Starting Gateway"
	cd $(GATEWAY_DIR) && npm run start

stop-gateway:
	@echo "Stopping Gateway"
	cd $(GATEWAY_DIR) && npm run stop

restart-gateway:
	@echo "Restarting Gateway"
	cd $(GATEWAY_DIR) && npm run restart

# Auth service tasks
.PHONY: setup-auth start-auth stop-auth restart-auth

setup-auth:
	@echo "Setting up virtual environment for Auth Service"
	cd $(AUTH_SERVICE_DIR) && $(PYTHON) -m venv venv
	cd $(AUTH_SERVICE_DIR) && $(ACTIVATE_VENV) && $(PIP_UPGRADE) && pip install -r requirements.txt

start-auth:
	@echo "Starting Authentication Service"
	cd $(AUTH_SERVICE_DIR) && $(PYTHON) src/app.py

stop-auth:
	@echo "Stopping Authentication Service"
	$(DOCKER_COMPOSE) stop auth-service

restart-auth: stop-auth start-auth

# Game store service tasks
.PHONY: setup-game-store start-game-store stop-game-store restart-game-store

setup-game-store:
	@echo "Setting up virtual environment for Games Store Service"
	cd $(GAME_STORE_SERVICE_DIR) && $(PYTHON) -m venv venv
	cd $(GAME_STORE_SERVICE_DIR) && $(ACTIVATE_VENV) && $(PIP_UPGRADE) && pip install -r requirements.txt

start-game-store:
	@echo "Starting Game Store Service"
	cd $(GAME_STORE_SERVICE_DIR) && $(PYTHON) src/app.py

stop-game-store:
	$(DOCKER_COMPOSE) stop game-store-service

restart-game-store: stop-game-store start-game-store

# Clean up containers, volumes, and networks
clean:
	$(DOCKER_COMPOSE) down --volumes --remove-orphans