# JS Logistics - Sistema de Gestión de Entregas y Mensajería

Sistema completo de logística para administrar entregas, mensajeros, clientes, cuadres diarios y nómina semanal. Incluye panel de administrador y vista de mensajero.

---

## 📋 Tabla de Contenidos

- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Frontend (React)](#-frontend-react)
  - [Páginas](#páginas)
  - [Contextos](#contextos)
  - [Hooks](#hooks)
  - [Componentes de Administrador](#componentes-de-administrador)
  - [Componentes de Mensajero](#componentes-de-mensajero)
  - [Componentes de Entregas](#componentes-de-entregas)
  - [Componentes de Autenticación](#componentes-de-autenticación)
  - [Layout](#layout)
  - [Componentes UI](#componentes-ui)
- [Backend Node.js (Réplica)](#-backend-nodejs-réplica)
- [Base de Datos](#-base-de-datos)
- [Roles y Permisos](#-roles-y-permisos)
- [Flujos Principales](#-flujos-principales)
- [Instalación](#-instalación)

---

## 🛠 Tecnologías

| Tecnología | Uso |
|---|---|
| **React 18** | Framework de UI |
| **TypeScript** | Tipado estático |
| **Vite** | Bundler y dev server |
| **Tailwind CSS** | Estilos utilitarios |
| **shadcn/ui** | Librería de componentes UI (Radix + Tailwind) |
| **TanStack React Query** | Manejo de estado del servidor, caché y refetch |
| **Supabase (Lovable Cloud)** | Base de datos PostgreSQL, autenticación JWT, RLS y storage |
| **React Router DOM** | Navegación SPA con persistencia de pestaña vía query params |
| **Recharts** | Gráficos y visualización de datos |
| **date-fns** | Formateo y manejo de fechas |
| **Sonner** | Notificaciones toast |
| **Lucide React** | Iconografía |
| **SweetAlert2** | Diálogos de confirmación |

---

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/
│   │   ├── admin/              # Componentes del panel de administrador
│   │   │   └── deliveries/     # Sub-módulo de gestión de entregas
│   │   ├── auth/               # Formularios de login
│   │   ├── courier/            # Vista del mensajero
│   │   ├── delivery/           # Componentes compartidos de entregas
│   │   ├── layout/             # Layout principal (sidebar + contenido)
│   │   └── ui/                 # Componentes base de shadcn/ui
│   ├── contexts/               # Contextos de React (autenticación)
│   ├── hooks/                  # Custom hooks (lógica de negocio + datos)
│   ├── integrations/supabase/  # Cliente y tipos auto-generados de Supabase
│   ├── pages/                  # Páginas de la aplicación
│   ├── lib/                    # Utilidades generales
│   └── main.tsx                # Punto de entrada
├── backend-nodejs/             # Réplica del backend en Node.js/Express
│   └── src/
│       ├── controllers/        # Lógica de cada módulo
│       ├── routes/             # Definición de endpoints REST
│       ├── middleware/         # Auth JWT y CORS
│       ├── config/             # Conexión a base de datos
│       └── db/                 # Esquema SQL e inicialización
├── supabase/                   # Configuración y migraciones de Supabase
└── public/                     # Archivos estáticos
```

---

## 🖥 Frontend (React)

### Páginas

| Archivo | Descripción |
|---|---|
| `src/pages/Index.tsx` | Página principal. Gestiona la autenticación, detecta el rol del usuario (admin/mensajero) y renderiza la vista correspondiente. Persiste la pestaña activa en la URL (`?page=`) para sobrevivir al refresh. |
| `src/pages/NotFound.tsx` | Página 404 para rutas no encontradas. |

### Contextos

| Archivo | Descripción |
|---|---|
| `src/contexts/AuthContext.tsx` | Proveedor de autenticación. Gestiona el estado del usuario, login/logout con Supabase Auth, y expone los flags `isAdmin` e `isCourier` consultando la tabla `user_roles`. |

### Hooks

Todos los hooks usan **React Query** para caché, refetch automático e invalidación.

| Archivo | Descripción |
|---|---|
| `useDeliveries.ts` | CRUD completo de entregas. Incluye filtros por semana, creación con reapertura automática de cuadres cerrados, actualización de estado, eliminación y reasignación de mensajero. Exporta `getCurrentWeekDates()` para calcular la semana actual (lunes a domingo). |
| `useClients.ts` | CRUD de clientes. Crear, editar, eliminar y listar clientes con búsqueda. |
| `useCouriers.ts` | Obtiene la lista de mensajeros con sus perfiles desde `profiles` + `user_roles`. |
| `useClientStatement.ts` | Genera el estado de cuenta de un cliente: entregas filtradas por rango de fechas con totales por método de pago. |
| `useCourierSummary.ts` | Resumen financiero del mensajero logueado: entregas completadas, efectivo recaudado, transferencias. |
| `useDailyOperations.ts` | Lógica de cuadres diarios: base de caja, entregas parciales, cálculo de balance esperado, liquidación y reapertura automática de cuadres. También gestiona cobros operacionales. |
| `useRegisterDelivery.ts` | Registra la finalización de una entrega por parte del mensajero: cambia estado, guarda monto recibido, nombre del receptor y foto del comprobante. |
| `useAdminCompleteDelivery.ts` | Permite al admin completar entregas directamente sin foto de comprobante. |
| `use-mobile.tsx` | Detecta si el viewport es móvil (< 768px). |
| `use-toast.ts` | Hook para el sistema de notificaciones toast. |

### Componentes de Administrador

| Archivo | Descripción |
|---|---|
| `AdminDashboard.tsx` | Dashboard principal con métricas: total de entregas, efectivo pendiente, entregas por estado, gráficos con Recharts. |
| `AdminNewDeliveryForm.tsx` | Formulario para crear nuevas entregas desde el panel admin (versión standalone). |
| `CouriersList.tsx` | Lista de mensajeros con estadísticas semanales (entregas, efectivo, transferencias). Incluye diálogo para **agregar nuevos mensajeros** (crea usuario + perfil). |
| `ClientsManager.tsx` | Gestión completa de clientes: lista, búsqueda, crear, editar, eliminar. Incluye acceso al estado de cuenta por cliente. |
| `ClientStatementView.tsx` | Vista detallada del estado de cuenta de un cliente con filtro por fechas y desglose por método de pago. |
| `ClientReportPDF.tsx` | Generación de reporte PDF del estado de cuenta de un cliente. |
| `DailySettlements.tsx` | Cuadres diarios por mensajero. Muestra base de caja, cobrado, entregas parciales, balance esperado vs real. **Responsivo**: tabla en escritorio, tarjetas en móvil. |
| `WeeklyPayroll.tsx` | Nómina semanal: resumen por mensajero con entregas, efectivo, transferencias, anticipos descontados y balance final. **Responsivo**: tabla en escritorio, tarjetas en móvil. |
| `ConsolidatedCash.tsx` | Caja consolidada: visión global del efectivo y transferencias de todos los mensajeros. |
| `AuditLog.tsx` | Registro de auditoría: historial de cambios en entregas (creación, edición, eliminación, reasignación) con detalle de valores anteriores y nuevos. |
| `SettingsPage.tsx` | Configuración del sistema: valor del servicio por defecto y otros ajustes. |

#### Sub-módulo de Entregas (`admin/deliveries/`)

| Archivo | Descripción |
|---|---|
| `Deliveries.tsx` | Componente principal de la pestaña "Entregas". Integra pestañas, filtros, búsqueda y la tabla/lista de entregas. |
| `DomisTab.tsx` | Pestaña individual que muestra las entregas filtradas por estado con acciones contextuales. |
| `ModalDomis.tsx` | Modal para crear nuevas entregas: selección de cliente, mensajero, monto, método de pago. Al crear, reabre automáticamente el cuadre diario si ya estaba cerrado. |
| `ModalDomisEjemplo.tsx` | Versión de ejemplo/referencia del modal de entregas. |
| `BusquedaCliente.tsx` | Componente de búsqueda y selección de cliente dentro del modal de creación. |
| `ClientInfo.tsx` | Muestra información resumida del cliente seleccionado en el formulario de entrega. |
| `DeliveryInfo.tsx` | Campos del formulario de entrega: monto, método de pago, notas. |
| `DeliveryDetailModal.tsx` | Modal de detalle completo de una entrega: datos del cliente, mensajero, montos, estado, foto del comprobante. |
| `EditDeliveryModal.tsx` | Modal para editar una entrega existente: modificar monto, método de pago, cliente o notas. |
| `DeleteDeliveryModal.tsx` | Diálogo de confirmación para eliminar una entrega con registro en auditoría. |
| `ReassignDeliveryModal.tsx` | Modal para reasignar una entrega a otro mensajero. |

### Componentes de Mensajero

| Archivo | Descripción |
|---|---|
| `CourierSummary.tsx` | Resumen del día para el mensajero: entregas realizadas, efectivo recaudado, balance. |
| `CourierTodayDeliveries.tsx` | Lista de entregas asignadas al mensajero para el día actual con acciones (completar, reportar no entrega). |
| `NewDeliveryForm.tsx` | Formulario para que el mensajero registre una nueva entrega desde su vista. |
| `RegisterDeliveryDialog.tsx` | Diálogo para que el mensajero registre la finalización de una entrega: monto recibido, nombre del receptor y foto del comprobante. |

### Componentes de Entregas (compartidos)

| Archivo | Descripción |
|---|---|
| `DeliveryList.tsx` | Lista de entregas pendientes para el mensajero con tarjetas interactivas. |
| `DeliveryCard.tsx` | Tarjeta individual de entrega: muestra cliente, monto, método de pago, estado y acciones disponibles según el rol. |
| `EditDeliveryDialog.tsx` | Diálogo de edición de entrega (usado por mensajeros). |
| `CancelDeliveryDialog.tsx` | Diálogo para cancelar/reportar no-entrega con selección de motivo. |

### Componentes de Autenticación

| Archivo | Descripción |
|---|---|
| `LoginForm.tsx` | Formulario de login base. |
| `LoginFormTest.tsx` | Formulario de login activo con validación y manejo de errores. |

### Layout

| Archivo | Descripción |
|---|---|
| `AppLayout.tsx` | Layout principal de la aplicación. Incluye **sidebar** con navegación contextual según el rol (admin vs mensajero), sección de usuario, botón de logout. Responsivo: sidebar colapsable en móvil con overlay. |

### Componentes UI

La carpeta `src/components/ui/` contiene **componentes base de shadcn/ui** (Button, Card, Dialog, Input, Select, Table, Tabs, Badge, etc.). No contienen lógica de negocio, solo presentación y estilos.

---

## 🔧 Backend Node.js (Réplica)

Réplica completa del backend en **Node.js/Express** con PostgreSQL, sincronizada con la lógica del frontend.

```
backend-nodejs/src/
├── app.js                          # Servidor Express, registro de rutas
├── config/
│   └── database.js                 # Pool de conexión PostgreSQL
├── middleware/
│   ├── auth.js                     # Validación de JWT y extracción de usuario
│   └── cors.js                     # Configuración CORS
├── db/
│   ├── schema.sql                  # Esquema completo de la base de datos
│   └── init.js                     # Script de inicialización de tablas
├── controllers/
│   ├── authController.js           # Login, registro, perfil del usuario
│   ├── clientsController.js        # CRUD de clientes
│   ├── couriersController.js       # Listado y creación de mensajeros
│   ├── deliveriesController.js     # CRUD de entregas + reasignación + reapertura de cuadres
│   ├── dailySettlementsController.js  # Cuadres diarios: cálculo, liquidación y reapertura
│   ├── weeklySettlementsController.js # Nómina semanal: cálculo y liquidación
│   ├── salaryAdvancesController.js    # Anticipos de salario
│   └── operationalChargesController.js # Cobros operacionales
└── routes/
    ├── auth.js                     # POST /login, /register, GET /me
    ├── clients.js                  # GET, POST, PUT, DELETE /api/clients
    ├── couriers.js                 # GET, POST /api/couriers
    ├── deliveries.js               # GET, POST, PUT, PATCH, DELETE /api/deliveries
    ├── dailySettlements.js         # GET, POST, PATCH /api/daily-settlements
    ├── weeklySettlements.js        # GET, POST /api/weekly-settlements
    ├── salaryAdvances.js           # GET, POST /api/salary-advances
    └── operationalCharges.js       # GET, POST /api/operational-charges
```

### Endpoints principales

```
POST   /api/auth/login              # Iniciar sesión
POST   /api/auth/register           # Registrar usuario
GET    /api/auth/me                 # Obtener usuario autenticado

GET    /api/clients                 # Listar clientes
POST   /api/clients                 # Crear cliente
PUT    /api/clients/:id             # Actualizar cliente
DELETE /api/clients/:id             # Eliminar cliente

GET    /api/deliveries              # Listar entregas (filtros por semana, estado, mensajero)
POST   /api/deliveries              # Crear entrega (+ reapertura de cuadre si aplica)
PUT    /api/deliveries/:id          # Editar entrega
PATCH  /api/deliveries/:id/status   # Cambiar estado de entrega
DELETE /api/deliveries/:id          # Eliminar entrega
PATCH  /api/deliveries/:id/reassign # Reasignar a otro mensajero

GET    /api/couriers                # Listar mensajeros
POST   /api/couriers                # Crear mensajero (usuario + perfil + rol)

GET    /api/daily-settlements       # Obtener cuadres del día
POST   /api/daily-settlements/settle # Liquidar cuadre
PATCH  /api/daily-settlements/reopen # Reabrir cuadre cerrado

GET    /api/weekly-settlements      # Obtener nómina semanal
POST   /api/weekly-settlements/settle # Liquidar nómina

GET    /api/salary-advances         # Listar anticipos
POST   /api/salary-advances         # Crear anticipo

GET    /api/operational-charges     # Listar cobros operacionales
POST   /api/operational-charges     # Crear cobro operacional
```

---

## 🗄 Base de Datos

### Tablas principales

| Tabla | Descripción |
|---|---|
| `profiles` | Perfil de usuario: nombre completo, teléfono. Vinculado a `auth.users` por `user_id`. |
| `user_roles` | Rol del usuario: `admin` o `courier`. |
| `clients` | Clientes: nombre, teléfono, dirección, empresa, cédula/NIT, balance, notas. |
| `deliveries` | Entregas: cliente, mensajero, monto, valor del servicio, total a cobrar, método de pago, estado, semana, foto de comprobante, nombre del receptor. |
| `daily_base_money` | Base de caja asignada al mensajero por día. |
| `daily_settlements` | Cuadre diario: base, cobrado, entregas parciales, balance esperado, balance real, diferencia, estado de liquidación. |
| `partial_deliveries` | Entregas parciales de efectivo durante el día. |
| `weekly_settlements` | Nómina semanal: totales por mensajero, anticipos, balance final. |
| `salary_advances` | Anticipos de salario por mensajero por semana. |
| `operational_charges` | Gastos operacionales diarios. |
| `delivery_audit_log` | Log de auditoría: cada cambio en entregas con valores anteriores y nuevos. |
| `system_settings` | Configuración del sistema (ej: valor del servicio por defecto). |

### Enums

| Enum | Valores |
|---|---|
| `app_role` | `admin`, `courier` |
| `delivery_status` | `pending`, `completed`, `cancelled`, `not_delivered_collected`, `not_delivered_no_collection` |
| `payment_method` | `cash`, `transfer_to_courier`, `transfer_to_client` |

---

## 👥 Roles y Permisos

### Administrador (`admin`)
- Ver dashboard con métricas globales
- Crear, editar, eliminar y reasignar entregas
- Gestionar clientes (CRUD completo)
- Crear mensajeros
- Liquidar cuadres diarios y nómina semanal
- Ver caja consolidada
- Ver auditoría completa
- Configurar ajustes del sistema

### Mensajero (`courier`)
- Ver resumen personal del día
- Ver entregas asignadas
- Registrar finalización de entregas (con foto de comprobante)
- Reportar no-entregas
- Crear entregas desde su vista

---

## 🔄 Flujos Principales

### Flujo de una entrega
1. Admin o mensajero crea la entrega asignándola a un cliente y mensajero
2. Si el cuadre del mensajero para ese día ya estaba cerrado, se reabre automáticamente
3. El mensajero ve la entrega en su lista de pendientes
4. El mensajero la completa: ingresa monto recibido, nombre del receptor y sube foto del comprobante
5. La entrega cambia a estado `completed` y se refleja en el cuadre diario

### Flujo de cuadre diario
1. Admin asigna base de caja al mensajero
2. Durante el día se registran entregas y entregas parciales de efectivo
3. Al final del día, el admin liquida el cuadre comparando balance esperado vs real
4. Si hay diferencia negativa, se registra automáticamente como anticipo de salario

### Flujo de nómina semanal
1. Se calculan automáticamente los totales por mensajero (entregas, efectivo, transferencias)
2. Se descuentan los anticipos de la semana
3. El admin liquida la nómina semanal

---

## 🚀 Instalación

### Frontend

```bash
# Clonar el repositorio
git clone <URL_DEL_REPO>
cd <NOMBRE_DEL_PROYECTO>

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Backend Node.js (opcional)

```bash
cd backend-nodejs

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y JWT_SECRET

# Iniciar servidor
npm start
```

### Variables de entorno del frontend

Las siguientes variables son auto-configuradas por Lovable Cloud:
- `VITE_SUPABASE_URL` — URL del proyecto
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Clave pública (anon key)
- `VITE_SUPABASE_PROJECT_ID` — ID del proyecto

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.
