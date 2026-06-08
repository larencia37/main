# Makefile - Sistema Hospitalario Venezolano

.PHONY: help install start stop clean test docker-build docker-up docker-down

# Variables
BACKEND_DIR=backend
FRONTEND_DIR=frontend
DB_NAME=clinica_venezuela
DB_USER=postgres

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

install: ## Instalar dependencias de backend y frontend
	@echo "Instalando dependencias del backend..."
	cd $(BACKEND_DIR) && npm install
	@echo "Instalando dependencias del frontend..."
	cd $(FRONTEND_DIR) && npm install

start: ## Iniciar servicios (backend y frontend)
	@echo "Iniciando backend..."
	cd $(BACKEND_DIR) && npm start &
	@echo "Iniciando frontend..."
	cd $(FRONTEND_DIR) && npm start &
	@echo "Servicios iniciados. Backend: http://localhost:3000, Frontend: http://localhost:3001"

stop: ## Detener todos los procesos de Node.js
	@echo "Deteniendo procesos..."
	pkill -f "node.*server.js" || true
	pkill -f "react-scripts start" || true

clean: ## Limpiar node_modules y builds
	@echo "Limpiando dependencias..."
	rm -rf $(BACKEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(FRONTEND_DIR)/build

test: ## Ejecutar tests del backend
	cd $(BACKEND_DIR) && npm test

docker-build: ## Construir imágenes Docker
	docker-compose build

docker-up: ## Iniciar servicios con Docker
	docker-compose up -d

docker-down: ## Detener servicios Docker
	docker-compose down

db-setup: ## Configurar base de datos PostgreSQL
	@echo "Creando base de datos..."
	createdb $(DB_NAME) || echo "Base de datos ya existe"
	@echo "Ejecutando esquema..."
	psql -d $(DB_NAME) -f database/schema.sql
	@echo "Insertando datos iniciales..."
	psql -d $(DB_NAME) -f database/seed_data.sql

db-reset: ## Resetear base de datos
	@echo "Eliminando base de datos..."
	dropdb $(DB_NAME) || echo "Base de datos no existe"
	$(MAKE) db-setup

dev: ## Iniciar modo desarrollo
	@echo "Iniciando modo desarrollo..."
	$(MAKE) install
	$(MAKE) db-setup
	$(MAKE) start

deploy: ## Desplegar en producción (requiere configuración)
	@echo "Desplegando en producción..."
	@echo "Asegúrese de configurar las variables de entorno"
	@echo "Backend production build..."
	cd $(BACKEND_DIR) && npm run build
	@echo "Frontend production build..."
	cd $(FRONTEND_DIR) && npm run build

logs: ## Ver logs de Docker
	docker-compose logs -f

backup: ## Crear backup de base de datos
	@echo "Creando backup..."
	pg_dump $(DB_NAME) > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore: ## Restaurar backup (BACKUP=file.sql make restore)
	@echo "Restaurando backup..."
	psql $(DB_NAME) < $(BACKUP)