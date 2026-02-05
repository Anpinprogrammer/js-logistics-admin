# Cargo Guardian - Backend Node.js

Backend completo en Node.js/Express para el sistema de gestión de entregas Cargo Guardian.

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **PostgreSQL** v14 o superior
- **npm** o **yarn**

## 🚀 Instalación

### 1. Clonar y acceder al directorio

```bash
cd backend-nodejs
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y edita con tus datos:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cargo_guardian
DB_USER=postgres
DB_PASSWORD=tu_password

PORT=3001
JWT_SECRET=un_secreto_muy_seguro_aqui
```

### 4. Crear la base de datos

```bash
# Crear la base de datos en PostgreSQL
createdb cargo_guardian

# O desde psql:
# CREATE DATABASE cargo_guardian;
```

### 5. Inicializar el schema y usuario admin

```bash
npm run db:init
```

Esto creará todas las tablas y un usuario admin por defecto:
- 📧 Email: `admin@cargoguardian.com`
- 🔑 Password: `admin123`
- ⚠️ **Cambia esta contraseña en producción**

### 6. Iniciar el servidor

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

El servidor estará en: `http://localhost:3001`

## 📡 Endpoints de la API

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | ❌ |
| POST | `/api/auth/login` | Iniciar sesión | ❌ |
| GET | `/api/auth/me` | Usuario actual | ✅ |

### Clientes

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | `/api/clients` | Listar todos | ✅ | Todos |
| GET | `/api/clients/:id` | Obtener uno | ✅ | Todos |
| GET | `/api/clients/with-debt` | Con deuda | ✅ | Admin |
| GET | `/api/clients/:id/statement` | Estado de cuenta | ✅ | Todos |
| POST | `/api/clients` | Crear | ✅ | Todos |
| PUT | `/api/clients/:id` | Actualizar | ✅ | Todos |
| DELETE | `/api/clients/:id` | Eliminar | ✅ | Admin |

### Entregas

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | `/api/deliveries` | Listar (con filtros) | ✅ | Todos |
| GET | `/api/deliveries/:id` | Obtener una | ✅ | Todos |
| GET | `/api/deliveries/audit-log` | Log de auditoría | ✅ | Admin |
| POST | `/api/deliveries` | Crear | ✅ | Todos |
| PUT | `/api/deliveries/:id` | Actualizar | ✅ | Todos |
| PATCH | `/api/deliveries/:id/status` | Cambiar estado | ✅ | Todos |
| DELETE | `/api/deliveries/:id` | Eliminar | ✅ | Admin |

**Filtros disponibles en GET /api/deliveries:**
- `client_id` - Filtrar por cliente
- `courier_id` - Filtrar por mensajero
- `status` - Filtrar por estado
- `date` - Filtrar por fecha
- `week_start` / `week_end` - Filtrar por semana

### Mensajeros

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/couriers` | Listar todos | ✅ |
| GET | `/api/couriers/:id/stats` | Estadísticas | ✅ |
| GET | `/api/couriers/:id/summary` | Resumen diario | ✅ |

### Liquidaciones Diarias

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | `/api/daily-settlements` | Listar | ✅ | Todos |
| POST | `/api/daily-settlements` | Crear | ✅ | Admin |
| PATCH | `/api/daily-settlements/:id/settle` | Liquidar | ✅ | Admin |
| POST | `/api/daily-settlements/base-money` | Asignar base | ✅ | Admin |
| POST | `/api/daily-settlements/partial-delivery` | Entrega parcial | ✅ | Admin |

### Liquidaciones Semanales

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | `/api/weekly-settlements` | Listar | ✅ | Todos |
| POST | `/api/weekly-settlements` | Crear | ✅ | Admin |
| PATCH | `/api/weekly-settlements/:id/settle` | Liquidar | ✅ | Admin |

### Gastos Operacionales

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | `/api/operational-charges` | Listar | ✅ | Todos |
| POST | `/api/operational-charges` | Crear | ✅ | Admin |
| DELETE | `/api/operational-charges/:id` | Eliminar | ✅ | Admin |

### Anticipos de Salario

| Método | Ruta | Descripción | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | `/api/salary-advances` | Listar | ✅ | Todos |
| POST | `/api/salary-advances` | Crear | ✅ | Admin |
| DELETE | `/api/salary-advances/:id` | Eliminar | ✅ | Admin |

## 🔐 Autenticación

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <tu_jwt_token>
```

El token se obtiene al hacer login o registro.

## 📦 Estructura del Proyecto

```
backend-nodejs/
├── package.json
├── .env.example
├── README.md
└── src/
    ├── app.js                          # Entrada principal
    ├── config/
    │   └── database.js                 # Conexión PostgreSQL
    ├── middleware/
    │   ├── auth.js                     # JWT + roles
    │   └── cors.js                     # CORS config
    ├── controllers/
    │   ├── authController.js           # Auth (login/register)
    │   ├── clientsController.js        # CRUD clientes
    │   ├── couriersController.js       # Mensajeros + stats
    │   ├── deliveriesController.js     # CRUD entregas + audit
    │   ├── dailySettlementsController.js
    │   ├── weeklySettlementsController.js
    │   ├── operationalChargesController.js
    │   └── salaryAdvancesController.js
    ├── routes/
    │   ├── auth.js
    │   ├── clients.js
    │   ├── couriers.js
    │   ├── deliveries.js
    │   ├── dailySettlements.js
    │   ├── weeklySettlements.js
    │   ├── operationalCharges.js
    │   └── salaryAdvances.js
    └── db/
        ├── schema.sql                  # Schema completo
        └── init.js                     # Script de inicialización
```

## 🔄 Conectar el Frontend

Para conectar el frontend React a este backend, consulta la guía de migración en el README principal del proyecto, sección "Integrar un Backend Externo".

En resumen:
1. Agrega `VITE_API_URL=http://localhost:3001/api` al `.env` del frontend
2. Crea `src/services/api.ts` con Axios
3. Migra los hooks de Supabase a usar el servicio API
