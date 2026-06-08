# Sistema de Administración Hospitalaria Venezolano

Sistema completo de gestión hospitalaria diseñado específicamente para Venezuela, cumpliendo con las normativas del Ministerio del Poder Popular para la Salud (MPPS), Servicio Nacional Integrado de Administración Aduanera y Tributaria (SENIAT) y Ley de Protección de Datos Personales.

## 🚀 Características Principales

- **Historia Clínica Electrónica** completa con soporte MPPS
- **Gestión de Pacientes** con validación de cédula venezolana
- **Sistema de Citas** y agenda médica
- **Farmacia e Inventario** integrable con Farmapatria
- **Laboratorio e Imágenes** médicas
- **Facturación Electrónica** compatible con SENIAT
- **Reportes Epidemiológicos** y MPPS
- **Auditoría y Seguridad** completa
- **Interfaz Web Moderna** con React

## 📋 Requisitos del Sistema

### Backend
- Node.js v18+
- PostgreSQL v14+
- npm o yarn

### Frontend
- Node.js v18+
- npm o yarn

## 🛠️ Instalación y Despliegue

### ⚡ Opción Recomendada: Docker Compose (MEJOR para desarrollo)
```bash
# Requisito: Docker y Docker Compose instalados

# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

Acceso:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- PostgreSQL: localhost:5432

### Opción 1: Scripts Automáticos (requiere PostgreSQL local)

#### Requisito previo: PostgreSQL debe estar corriendo
```bash
# Linux/macOS
sudo systemctl start postgresql

# O instalar si no existe
sudo apt update && sudo apt install -y postgresql postgresql-contrib
```

#### Windows
```bash
# Hacer ejecutable el script (solo primera vez)
# Ejecutar el script de despliegue
scripts/deploy_windows.bat
```

#### Linux/macOS
```bash
# Hacer ejecutable el script (solo primera vez)
chmod +x scripts/deploy_linux.sh

# Ejecutar el script de despliegue
./scripts/deploy_linux.sh
```

### Opción 2: Instalación Manual (control total)

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sistema-hospitalario-venezolano
```

2. **Configurar entorno**
```bash
# Copiar archivo de configuración
cp config.env.example config.env

# Editar config.env con sus valores
nano config.env
```

3. **Instalar dependencias**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. **Configurar base de datos**
```bash
# Crear base de datos
createdb clinica_venezuela

# Ejecutar esquema
psql -d clinica_venezuela -f database/schema.sql

# Insertar datos iniciales
psql -d clinica_venezuela -f database/seed_data.sql
```

5. **Iniciar servicios**
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

## 🐳 Despliegue con Docker

### Requisitos
- Docker y Docker Compose instalados
- Puertos 3000, 3001, 5432 disponibles

### Despliegue Rápido
```bash
# Construir e iniciar servicios (lo hace todo automáticamente)
make docker-up

# O usando docker-compose directamente
docker-compose up -d
```

### Servicios Incluidos
- **PostgreSQL**: Base de datos (puerto 5432) - se inicializa automáticamente
- **Backend**: API (puerto 3000)
- **Frontend**: Aplicación web (puerto 3001)

### Comandos útiles
```bash
docker-compose logs -f backend     # Ver logs del backend
docker-compose logs -f frontend    # Ver logs del frontend
docker-compose ps                   # Ver estado de servicios
docker-compose down                 # Detener y limpiar
```

## 🔧 Troubleshooting

### Error: "connection to server on socket ... failed"
**Causa**: PostgreSQL no está corriendo

**Solución**:
```bash
# Si usas Docker Compose (recomendado)
docker-compose up -d

# O si PostgreSQL está instalado localmente
sudo systemctl start postgresql
```

### Error: "npm audit" con vulnerabilidades
**Causa**: Dependencias desactualizadas

**Solución**:
```bash
cd backend && npm audit fix --force
cd ../frontend && npm audit fix --force
```

### El frontend no conecta con el backend
**Verificar**:
- Backend está corriendo en `http://localhost:3000`
- Frontend está corriendo en `http://localhost:3001`
- En Docker: frontend debe usar `http://backend:3000` internamente
- CORS habilitado en backend

## 🛠️ Comandos Útiles (Makefile)

```bash
make help          # Ver todos los comandos disponibles
make install       # Instalar dependencias
make start         # Iniciar servicios localmente
make stop          # Detener servicios
make clean         # Limpiar dependencias
make test          # Ejecutar tests
make db-setup      # Configurar base de datos
make db-reset      # Resetear base de datos
make dev           # Modo desarrollo completo
make docker-build  # Construir imágenes Docker
make docker-up     # Iniciar con Docker
make docker-down   # Detener Docker
make backup        # Backup de BD
make logs          # Ver logs de Docker
```

### Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| medico1 | medico123 | Médico |
| enfermera1 | enfermera123 | Enfermera |
| farmaceutico1 | farmacia123 | Farmacéutico |

## 📁 Estructura del Proyecto

```
sistema-hospitalario-venezolano/
├── backend/                    # API REST con Express.js
│   ├── server.js              # Servidor principal
│   ├── package.json           # Dependencias backend
│   └── .env                   # Configuración backend
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── App.js            # App principal
│   │   └── index.js          # Punto de entrada
│   ├── public/
│   └── package.json           # Dependencias frontend
├── database/                   # Base de datos PostgreSQL
│   ├── schema.sql            # Esquema de BD
│   └── seed_data.sql         # Datos iniciales
├── scripts/                    # Scripts de despliegue
│   ├── deploy_windows.bat    # Script Windows
│   └── deploy_linux.sh       # Script Linux
├── config.env.example         # Configuración de ejemplo
└── README.md                  # Esta documentación
```

## 🔧 Configuración

### Variables de Entorno (config.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clinica_venezuela
DB_USER=postgres
DB_PASSWORD=tu_password

# Servidor
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Seguridad
JWT_SECRET=tu_jwt_secret_seguro
BCRYPT_ROUNDS=10

# APIs externas (opcional)
MPPS_API_URL=https://api.mpps.gob.ve
SENIAT_API_URL=https://api.seniat.gob.ve
FARMAPATRIA_API_URL=https://api.farmapatria.gob.ve
```

## 📊 Funcionalidades

### 👥 Gestión de Pacientes
- Registro con validación de cédula venezolana
- Historia clínica completa
- Consentimiento de datos personales
- Integración con Carnet de la Patria

### 📅 Sistema de Citas
- Agenda médica por consultorio
- Validación de disponibilidad
- Recordatorios automáticos
- Estados de citas (programada, confirmada, atendida)

### 💊 Farmacia e Inventario
- Control de stock con alertas
- Integración Farmapatria
- Recetas médicas electrónicas
- Trazabilidad de lotes y vencimientos

### 🧪 Laboratorio
- Órdenes de laboratorio
- Resultados con valores de referencia
- Integración con equipos médicos
- Reportes automatizados

### 💰 Facturación
- Facturas electrónicas SENIAT
- Cálculo automático de IVA
- Múltiples formas de pago
- Reportes contables

### 📈 Reportes y Estadísticas
- Dashboard ejecutivo
- Reportes MPPS obligatorios
- Estadísticas epidemiológicas
- Reportes de facturación mensual

## 🔒 Seguridad y Cumplimiento

- **Autenticación JWT** con expiración
- **Encriptación bcrypt** para contraseñas
- **Rate limiting** para prevenir ataques
- **Auditoría completa** de todas las acciones
- **Validación de cédula venezolana**
- **Cumplimiento LGPDP** (Ley de Protección de Datos)
- **Integración MPPS** para reportes obligatorios
- **Facturación electrónica SENIAT**

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@clinica-venezuela.com
- Teléfono: +58 212-555-0123
- Sitio web: https://clinica-venezuela.com

---

**Desarrollado con ❤️ para el sistema de salud venezolano**
