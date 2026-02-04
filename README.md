# Cargo Guardian - Sistema de Gestión de Entregas

## Arquitectura Frontend-Backend

### Comunicación con el Backend

El frontend se comunica con **Lovable Cloud** (backend integrado) usando el cliente oficial de Supabase JS:

```typescript
import { supabase } from "@/integrations/supabase/client";

// Ejemplo de consulta
const { data, error } = await supabase
  .from('deliveries')
  .select('*')
  .eq('status', 'pending');
```

### ¿Por qué NO usar Axios?

**No se recomienda usar Axios** para consultas al backend de Lovable Cloud porque:

1. **Autenticación automática**: El cliente Supabase maneja tokens JWT automáticamente
2. **Tipado TypeScript**: Los tipos se generan automáticamente desde el esquema de la base de datos
3. **Realtime incluido**: Soporte nativo para suscripciones en tiempo real
4. **RLS (Row Level Security)**: Las políticas de seguridad se aplican automáticamente

**Cuándo SÍ usar Axios:**
- Para conectar con APIs externas (ej: pasarelas de pago, servicios de terceros)
- Para webhooks o integraciones con sistemas externos

### Estructura de Comunicación

```
Frontend (React)
    │
    ├── @/integrations/supabase/client.ts  → Cliente Supabase configurado
    │
    ├── @/hooks/useDeliveries.ts           → React Query + Supabase
    ├── @/hooks/useClients.ts              → React Query + Supabase
    ├── @/hooks/useCouriers.ts             → React Query + Supabase
    │
    └── Lovable Cloud (Supabase)
        ├── Base de datos PostgreSQL
        ├── Autenticación
        ├── Row Level Security (RLS)
        └── Edge Functions (si se necesitan)
```

## Integrar un Backend Externo (API Propia)

Si deseas conectar este proyecto a tu propio backend (Node.js, Python, etc.), aquí está la estructura recomendada:

### Estructura del Backend

```
mi-backend/
├── src/
│   ├── controllers/
│   │   ├── deliveriesController.js
│   │   ├── clientsController.js
│   │   └── couriersController.js
│   ├── routes/
│   │   ├── deliveries.js
│   │   ├── clients.js
│   │   └── couriers.js
│   ├── middleware/
│   │   ├── auth.js          # Validar JWT tokens
│   │   └── cors.js          # Configuración CORS
│   ├── services/
│   │   └── database.js      # Conexión a BD
│   └── app.js
├── .env
└── package.json
```

### Endpoints Requeridos

Tu API debe exponer estos endpoints para ser compatible:

```
# Clientes
GET    /api/clients              # Listar clientes
POST   /api/clients              # Crear cliente
PUT    /api/clients/:id          # Actualizar cliente
DELETE /api/clients/:id          # Eliminar cliente

# Entregas
GET    /api/deliveries           # Listar entregas (con filtros)
POST   /api/deliveries           # Crear entrega
PUT    /api/deliveries/:id       # Actualizar entrega
PATCH  /api/deliveries/:id/status # Cambiar estado

# Mensajeros
GET    /api/couriers             # Listar mensajeros
GET    /api/couriers/:id/stats   # Estadísticas del mensajero

# Autenticación
POST   /api/auth/login           # Iniciar sesión
POST   /api/auth/register        # Registrar usuario
GET    /api/auth/me              # Obtener usuario actual
```

### Headers CORS Requeridos

```javascript
// Tu backend debe permitir estos headers
const corsOptions = {
  origin: ['https://tu-dominio.lovable.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
```

### Ejemplo de Respuesta

```json
// GET /api/clients
{
  "data": [
    {
      "id": "uuid",
      "name": "Cliente Ejemplo",
      "phone": "3001234567",
      "address": "Calle 123",
      "balance": 0,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "error": null
}
```

### Conectar desde el Frontend

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Tu backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Variables de Entorno

Agrega en tu `.env` local:
```
VITE_API_URL=https://tu-backend.com/api
```

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
