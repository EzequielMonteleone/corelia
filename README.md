# Corelia

Aplicación de administración de consorcios y edificios: edificios, unidades, usuarios, roles, gastos, períodos y pagos.

## Stack

| Capa      | Tecnologías |
|-----------|-------------|
| **Backend** | Node.js, Express 5, TypeScript, Prisma, PostgreSQL, JWT |
| **Frontend** | Next.js 16, React 19, TanStack Query, Zustand, next-intl, Tailwind CSS 4 |

## Requisitos

- **Node.js** 18+
- **PostgreSQL** (local o remoto)
- **pnpm** (recomendado) o npm/yarn

## Estructura del proyecto

```
corelia/
├── backend/          # API REST (Express + Prisma)
├── frontend/         # App web (Next.js)
└── README.md
```

## Configuración rápida

### 1. Base de datos

Crea una base PostgreSQL y anota la URL de conexión, por ejemplo:

```text
postgresql://usuario:contraseña@localhost:5432/corelia
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` y configura:

| Variable       | Descripción                          | Ejemplo |
|----------------|--------------------------------------|---------|
| `DATABASE_URL` | URL de PostgreSQL                    | `postgresql://user:pass@localhost:5432/corelia` |
| `JWT_SECRET`   | Secreto para firmar tokens (mín. 256 bits) | Una frase larga y aleatoria |
| `PORT`         | Puerto del servidor (opcional)       | `4000` (evitar conflicto con frontend en 3001) |
| `JWT_EXPIRES_IN` | Caducidad del token (opcional)     | `7d`    |
| `XAI_API_KEY`  | Clave de la API de xAI para el chat y los embeddings | La de grok.com/dashboard/api-keys |
| `CHAT_MODEL`   | Modelo de chat (opcional)          | `grok-4-1-fast-non-reasoning` |

Instala dependencias, genera el cliente de Prisma y aplica migraciones:

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

Opcional: poblar roles, permisos y un edificio de demo (unidades, usuarios, amenities, expensas y pagos). Si **Torre Palermo** ya existe, el seed no vuelve a insertar esos datos.

```bash
pnpm exec prisma db seed
```

Credenciales de demo:

| Email | Contraseña | Rol |
| --- | --- | --- |
| `superadmin@corelia.local` | `Admin123!` | Superadmin |
| `admin@torre-palermo.local` | `Demo123!` | Admin del edificio |
| `lucia.fernandez@torre-palermo.local` | `Demo123!` | Propietaria (1A) |
| `martin.gomez@torre-palermo.local` | `Demo123!` | Propietario (2A) |
| `sofia.rios@torre-palermo.local` | `Demo123!` | Propietaria (3B) |
| `diego.acosta@torre-palermo.local` | `Demo123!` | Propietario (4B) |
| `camila.nunez@torre-palermo.local` | `Demo123!` | Inquilina (1A) |
| `julian.perez@torre-palermo.local` | `Demo123!` | Inquilino (2B) |

`pnpm run create-test-user` sigue creando solo el superadmin, sin el edificio de demo.

Arranca el servidor:

```bash
pnpm run dev
```

El API quedará en `http://localhost:4000` (o el `PORT` que hayas puesto).

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
```

En `frontend/.env.local` define la URL del backend:

| Variable              | Descripción        | Ejemplo |
|-----------------------|--------------------|---------|
| `NEXT_PUBLIC_API_URL` | URL base del API   | `http://localhost:4000` |

Instala y arranca:

```bash
pnpm install
pnpm run dev
```

La app se abre en **http://localhost:3001**.

## Scripts principales

### Backend (`backend/`)

- `pnpm run dev` — Servidor en modo desarrollo (tsx watch).
- `pnpm run create-test-user` — Crea un usuario de prueba.
- `pnpm exec prisma migrate dev` — Crea/aplica migraciones en desarrollo.
- `pnpm exec prisma db seed` — Roles, permisos y dataset de demo (Torre Palermo).

### Frontend (`frontend/`)

- `pnpm run dev` — Next.js en http://localhost:3001.
- `pnpm run build` — Build de producción.
- `pnpm run start` — Servidor de producción.

## Funcionalidades

- **Autenticación**: login con email/contraseña, JWT, roles globales (Superadmin / Usuario).
- **Edificios**: CRUD de edificios, direcciones, datos fiscales.
- **Unidades**: unidades por edificio, coeficientes, relación propietario/inquilino.
- **Usuarios y roles**: usuarios por edificio, roles y permisos.
- **Gastos y pagos**: períodos de gastos, gastos por unidad, estados (impago/pendiente/pagado) y pagos.
- **Amenities**: amenities por edificio (configurables).
- **i18n**: soporte multiidioma con next-intl.

## CORS y producción

En producción, configura en el backend:

- `CORS_ORIGIN` o `FRONTEND_URL`: origen permitido del frontend (ej. `https://app.tudominio.com`).

Así el API solo acepta peticiones desde tu frontend desplegado.

## Licencia

ISC
