# scripts/deploy_windows.bat
@echo off
echo ============================================
echo DESPLIEGUE SISTEMA HOSPITALARIO VENEZOLANO
echo ============================================

echo 1. Verificar instalaciones necesarias...

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js no encontrado. Instale Node.js v18+
    echo https://nodejs.org/download/
    pause
    exit /b 1
)

REM Verificar PostgreSQL
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo PostgreSQL no encontrado. Instale PostgreSQL 14+
    echo https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo 2. Configurar entorno...
if not exist "config.env" (
    copy "config.env.example" "config.env"
    echo Archivo config.env creado. Configure sus variables.
)

echo 3. Instalar dependencias backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error instalando dependencias backend
    pause
    exit /b 1
)

echo 4. Instalar dependencias frontend...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo Error instalando dependencias frontend
    pause
    exit /b 1
)

echo 5. Configurar base de datos PostgreSQL...
cd ..
echo Creando base de datos...
psql -U postgres -c "CREATE DATABASE clinica_venezuela;" || (
    echo Error creando base de datos
    pause
    exit /b 1
)

echo Ejecutar esquema de base de datos...
psql -U postgres -d clinica_venezuela -f database/schema.sql || (
    echo Error ejecutando esquema
    pause
    exit /b 1
)

echo Insertar datos iniciales...
psql -U postgres -d clinica_venezuela -f database/seed_data.sql || (
    echo Error insertando datos iniciales
    pause
    exit /b 1
)

echo 6. Iniciar servidor backend...
cd backend
start npm start

echo 7. Iniciar servidor frontend...
cd ../frontend
start npm start

echo ============================================
echo Sistema instalado correctamente!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo ============================================
echo Presione cualquier tecla para continuar...
pause >nul