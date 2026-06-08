#!/bin/bash

# scripts/deploy_linux.sh
echo "============================================"
echo "DESPLIEGUE SISTEMA HOSPITALARIO VENEZOLANO"
echo "============================================"

echo "1. Verificar instalaciones necesarias..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js no encontrado. Instale Node.js v18+"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    exit 1
fi

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL no encontrado. Instale PostgreSQL 14+"
    echo "sudo apt update"
    echo "sudo apt install postgresql postgresql-contrib"
    exit 1
fi

echo "2. Configurar entorno..."
if [ ! -f "config.env" ]; then
    cp "config.env.example" "config.env"
    echo "Archivo config.env creado. Configure sus variables."
fi

echo "3. Instalar dependencias backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error instalando dependencias backend"
    exit 1
fi
echo "   Corrigiendo vulnerabilidades..."
npm audit fix --force 2>/dev/null || true

echo "4. Instalar dependencias frontend..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error instalando dependencias frontend"
    exit 1
fi
echo "   Corrigiendo vulnerabilidades..."
npm audit fix --force 2>/dev/null || true

echo "5. Configurar base de datos PostgreSQL..."
cd ..

# Verificar si PostgreSQL está corriendo
if ! pg_isready -h localhost -p 5432 &>/dev/null; then
    echo ""
    echo "⚠️  ADVERTENCIA: PostgreSQL no está corriendo en localhost:5432"
    echo ""
    echo "Opciones disponibles:"
    echo "  A) Usar Docker Compose (RECOMENDADO):"
    echo "     docker-compose up -d"
    echo "     ./scripts/deploy_linux.sh"
    echo ""
    echo "  B) Iniciar PostgreSQL localmente:"
    echo "     sudo systemctl start postgresql"
    echo "     ./scripts/deploy_linux.sh"
    echo ""
    exit 1
fi

echo "Creando base de datos..."
sudo -u postgres createdb clinica_venezuela 2>/dev/null || echo "Base de datos ya existe"

echo "Ejecutar esquema de base de datos..."
sudo -u postgres psql -d clinica_venezuela -f database/schema.sql || {
    echo "Error ejecutando esquema"
    exit 1
}

echo "Insertar datos iniciales..."
sudo -u postgres psql -d clinica_venezuela -f database/seed_data.sql || {
    echo "Error insertando datos iniciales"
    exit 1
}

echo "6. Iniciar servidor backend..."
cd backend
npm start &
BACKEND_PID=$!

echo "7. Iniciar servidor frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "============================================"
echo "Sistema instalado correctamente!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo "============================================"
echo "Presione Ctrl+C para detener los servidores"

# Función para limpiar procesos al salir
cleanup() {
    echo "Deteniendo servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar señales para limpiar
trap cleanup SIGINT SIGTERM

# Esperar indefinidamente
wait