# MUSICMAN — My Collection

Trabajo Práctico Final de DAI / EFSI · ORT · 2026

MUSICMAN es una aplicación para explorar música y organizar una biblioteca personal. Permite guardar canciones y álbumes, marcar favoritos, asignar puntuaciones, escribir reseñas, crear colecciones y consultar estadísticas.

## Integrantes

| Integrante | Responsabilidad |
|---|---|
| Fidel Goldsman | Backend |
| Ciro Perazzo | Frontend |
| Agustín Aiello | Base de datos |
| Ignacio Kohn | QA / Testing |

## Repositorios y diseño

- [Frontend](https://github.com/CiroPerazzo/TPFINAL-frontend)
- [Backend](https://github.com/suculento666/TP-Final-DAI-EFSI)
- [Diseño en Figma](https://www.figma.com/design/G1RyXAZtJXpfVL4aAhOHIk/My-Collection-%E2%80%94-dise%C3%B1o-musical?node-id=0-1&t=p1GdJ4t54yxEzZYD-1)
- [Tablero de Trello](https://trello.com/b/S8CQYIuy/final-dai-efsi)

## Tecnologías

- **Frontend:** React, Vite y React Router.
- **Backend:** Node.js y Express.
- **Base de datos:** PostgreSQL.
- **Autenticación:** JWT, cookies HttpOnly y bcryptjs.
- **Validaciones:** Zod.
- **Catálogo musical:** Spotify Web API.

## Cómo funciona

El frontend consume la API REST del backend. El backend se ocupa de la autenticación, las reglas de negocio y el acceso a PostgreSQL. También consulta Spotify para buscar canciones y álbumes. Las credenciales de Spotify se guardan únicamente en el backend.

## Instalación local

### Requisitos

- Node.js 20 o superior.
- npm.
- PostgreSQL.
- Credenciales de Spotify Web API.

### 1. Backend

Cloná el repositorio e instalá las dependencias:

```bash
git clone https://github.com/suculento666/TP-Final-DAI-EFSI.git
cd TP-Final-DAI-EFSI
npm install
```

Creá una base de datos llamada `my_collection` en PostgreSQL.

Copiá `.env.example` como `.env` y completá los datos de PostgreSQL, JWT y Spotify. Después ejecutá:

```bash
npm run migrate
npm run dev
```

Por defecto, el backend se inicia en `http://localhost:3000`.

### 2. Frontend

En otra terminal, cloná el repositorio del frontend:

```bash
git clone https://github.com/CiroPerazzo/TPFINAL-frontend.git
cd TPFINAL-frontend
npm install
```

Copiá `.env.example` como `.env`. Para desarrollo local, el proxy está configurado para comunicarse con `http://localhost:3000`.

Iniciá la aplicación:

```bash
npm run dev
```

Vite muestra en la terminal la dirección local; por defecto es `http://localhost:5173`.

## Variables de entorno

### Backend

| Variable | Para qué se usa |
|---|---|
| `PORT` | Puerto del servidor. |
| `NODE_ENV` | Entorno de ejecución. |
| `DB_HOST`, `DB_PORT` | Dirección y puerto de PostgreSQL. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Datos de conexión a la base. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y duración del token. |
| `FRONTEND_URL` | Origen permitido para el frontend. |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Acceso a Spotify Web API. |

No subas el archivo `.env` ni publiques sus valores.

### Frontend

| Variable | Para qué se usa |
|---|---|
| `VITE_API_URL` | URL base de la API. Por defecto, `/api`. |
| `API_PROXY_TARGET` | Dirección del backend para el proxy de Vite. |

## Endpoints principales

Las rutas de la API (excepto `/health`) usan el prefijo `/api`. Las rutas privadas requieren una sesión válida.

| Módulo | Rutas |
|---|---|
| Estado | `GET /health` |
| Autenticación | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Perfil | `GET /api/users/me`, `PATCH /api/users/me` |
| Catálogo | `GET /api/catalog/search`, `GET /api/catalog/:spotifyId` |
| Biblioteca | `GET /api/library`, `POST /api/library`, `PATCH /api/library/:contenidoId`, `DELETE /api/library/:contenidoId` |
| Favoritos | `GET /api/favorites`, `POST /api/favorites/:contenidoId`, `DELETE /api/favorites/:contenidoId` |
| Puntuaciones | `GET /api/ratings`, `PUT /api/ratings/:contenidoId`, `DELETE /api/ratings/:contenidoId` |
| Reseñas | `GET /api/reviews`, `GET /api/reviews/:contenidoId`, `POST /api/reviews/:contenidoId`, `PATCH /api/reviews/:contenidoId`, `DELETE /api/reviews/:contenidoId` |
| Colecciones | `GET /api/collections`, `POST /api/collections`, `GET /api/collections/:id`, `PATCH /api/collections/:id`, `DELETE /api/collections/:id`, `POST /api/collections/:id/items`, `DELETE /api/collections/:id/items/:contenidoId` |
| Actividad | `GET /api/activity` |
| Estadísticas | `GET /api/statistics` |
| Reproducciones | `GET /api/plays`, `POST /api/plays`, `GET /api/plays/wrapped` |

## Base de datos

La base utiliza PostgreSQL. Sus tablas principales son:

- `usuarios`: cuentas y perfiles.
- `contenidos`: canciones y álbumes.
- `biblioteca_items`: biblioteca, estados, favoritos y puntuaciones.
- `resenas`: reseñas.
- `colecciones` y `coleccion_items`: colecciones y sus contenidos.
- `actividad`: acciones de los usuarios.
- `reproducciones`: historial de reproducciones.

Las migraciones están en `db/migrations/` y se ejecutan con `npm run migrate`.

## Autenticación

Las contraseñas se guardan hasheadas con bcrypt. Al iniciar sesión, el backend genera un JWT y lo guarda en una cookie HttpOnly. Las rutas privadas usan ese token para identificar al usuario y limitar cada consulta a sus propios datos.

## Datos de demostración

El proyecto cuenta con migraciones con datos iniciales para probar la aplicación. Los datos de acceso de demostración se comparten por el canal indicado por los docentes; no se publican en este repositorio.

## Documentación relacionada

La [guía técnica del frontend](https://github.com/CiroPerazzo/TPFINAL-frontend/blob/master/docs/frontend.md) describe las pantallas, los servicios y la comunicación con la API.
