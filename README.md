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

Instala dependencias, genera el cliente de Prisma y aplica migraciones:

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

Opcional: poblar datos iniciales (roles, permisos, etc.):

```bash
pnpm exec prisma db seed
```

Usuario de prueba:

```bash
pnpm run create-test-user
```

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
- `pnpm exec prisma db seed` — Ejecuta el seed.

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
