# SETUP.md - Guía de Despliegue Local

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta  | Versión Mínima | Verificación              |
|--------------|----------------|---------------------------|
| Node.js      | 18.x           | `node --version`          |
| npm          | 9.x            | `npm --version`           |
| PostgreSQL   | 14.x           | `psql --version`          |
| Git          | 2.x            | `git --version`           |

### Instalación de Requisitos

#### Node.js

Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

macOS (Homebrew)
brew install node@18

Windows
Descargar desde https://nodejs.org/


#### PostgreSQL

Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

Windows
Descargar desde https://www.postgresql.org/download/windows/

## Clonación del Repositorio

git clone https://github.com/jumartinezfer/iot-fleet-monitoring.git

cd iot-fleet-monitoring

## Configuración del Backend

### 1. Navegar a la carpeta del backend

cd backend

### 2. Instalar dependencias

npm install

### 3. Configurar Base de Datos

#### Crear base de datos en PostgreSQL

Acceder a PostgreSQL
sudo -u postgres psql

Dentro del prompt de PostgreSQL:
CREATE DATABASE fleet_monitoring;
CREATE USER fleet_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE fleet_monitoring TO fleet_user;
\q

#### Crear tablas (ejecutar script de schema)

Si tienes un archivo schema.sql en la carpeta database/
psql -U fleet_user -d fleet_monitoring -f database/schema.sql

Alternativamente, conectar manualmente:
psql -U fleet_user -d fleet_monitoring

**Schema SQL** (si no existe el archivo, crear `database/schema.sql`):

### 4. Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

.env
NODE_ENV=development
PORT=3000

Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_monitoring
DB_USER=fleet_user
DB_PASSWORD=tu_password_seguro

JWT
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion_min_32_caracteres
JWT_EXPIRES_IN=24h

CORS (dominio del frontend)
CORS_ORIGIN=http://localhost:5173

## Configuración del Frontend

### 1. Navegar a la carpeta del frontend

cd frontend

### 2. Instalar dependencias

npm install

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `frontend/`:

.env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000

### 4. Iniciar el Frontend

npm run dev

La aplicación estará disponible en: [**http://localhost:5173**](http://localhost:5173)

