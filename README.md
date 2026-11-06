# My Collection — SONORA · Backend

TP Final DAI/EFSI 2026 — ORT Argentina

Backend de SONORA: gestión de biblioteca musical personal con canciones y álbumes de Spotify.

---

## Integrantes

| Nombre | Rama de trabajo | Responsabilidad principal |
|--------|----------------|---------------------------|
| Fidel Goldsman | `main` | Módulos de negocio, autenticación, estadísticas |
| Agustín (Agus) | `AgusRama` | Conexión a PostgreSQL (`env.js`, `pool.js`) |

---

## Tecnologías

- **Node.js** ≥ 20 · **Express** 4 · **PostgreSQL** 16
- **pg** 8 · **bcryptjs** · **jsonwebtoken** · **zod** · **cookie-parser**
- Spotify Web API (Client Credentials)

---

## Estructura del proyecto

```
src/
  app.js                  Express + middlewares + rutas
  server.js               Arranque con verificación de BD
  config/env.js           Variables de entorno validadas
  database/pool.js        Pool de conexiones pg
  middlewares/
    authenticate.js       Verifica JWT (cookie HttpOnly o header)
    validate.js           Zod: body, query, params
    errorHandler.js       Manejo centralizado de errores
  utils/
    hash.js               bcryptjs helpers
    jwt.js                sign/verify token + cookie options
    errors.js             ApiError + helpers (400/401/403/404/409)
    catchAsync.js         Wrapper async para Express 4
    withTransaction.js    BEGIN/COMMIT/ROLLBACK helper
  validators/params.js    Esquemas de parámetros de ruta
  modules/
    auth/                 Registro, login, logout, /me
    users/                Perfil: GET/PATCH /api/users/me
    catalog/              Búsqueda Spotify + upsert en contenidos
    library/              CRUD biblioteca_items + estados
    favorites/            Toggle es_favorito en biblioteca_items
    ratings/              Puntuación (1-5) en biblioteca_items
    reviews/              CRUD resenas
    collections/          CRUD colecciones + coleccion_items
    activity/             Registro y consulta de actividad
    statistics/           8 indicadores dinámicos con SQL
  tests/unit/             Pruebas unitarias (Node test runner)
db/
  migrate.js              Runner de migraciones
  migrations/
    001_init_v2.sql       Esquema de 7 tablas
    002_seed_prueba.sql   Cuenta demo (demo@sonora.app / demo1234)
    003_reproducciones.sql Migración aditiva (pendiente de aplicar)
```

---

## Variables de entorno

Copiá `.env.example` → `.env` y completá los valores.

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `PORT` | Puerto del servidor (default: 3000) | No |
| `NODE_ENV` | `development` / `production` | No |
| `DB_HOST` | Host de PostgreSQL | **Sí** |
| `DB_PORT` | Puerto de PostgreSQL (default: 5432) | No |
| `DB_NAME` | Nombre de la base (`my_collection`) | **Sí** |
| `DB_USER` | Usuario de PostgreSQL | **Sí** |
| `DB_PASSWORD` | Contraseña de PostgreSQL | **Sí** |
| `JWT_SECRET` | Secreto JWT (mínimo 32 caracteres) | **Sí** |
| `JWT_EXPIRES_IN` | Expiración del token (default: `7d`) | No |
| `FRONTEND_URL` | URL del frontend para CORS | **Sí** |
| `SPOTIFY_CLIENT_ID` | Client ID de Spotify | **Sí** para catálogo |
| `SPOTIFY_CLIENT_SECRET` | Client Secret de Spotify | **Sí** para catálogo |

---

## Instalación y ejecución local

```bash
# 1. Clonar y entrar al proyecto
git clone https://github.com/suculento666/TP-Final-DAI-EFSI.git
cd TP-Final-DAI-EFSI

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# editar .env con las credenciales locales

# 4. Crear la base de datos
createdb -U postgres my_collection

# 5. Aplicar el esquema
psql -U postgres -d my_collection -f db/migrations/001_init_v2.sql

# 6. Cargar datos de prueba (opcional, pero recomendado)
psql -U postgres -d my_collection -f db/migrations/002_seed_prueba.sql

# 7. Iniciar el servidor
npm run dev       # desarrollo (nodemon)
npm start         # producción
```

**Credenciales de la cuenta demo:**
- Email: `demo@sonora.app`
- Password: `demo1234`

---

## Credenciales de Spotify

1. Ir a https://developer.spotify.com/dashboard
2. Crear una aplicación
3. Copiar **Client ID** y **Client Secret** al `.env`

La autenticación usa **Client Credentials**: solo para buscar y consultar metadatos públicos. No accede al historial personal del usuario.

---

## Pruebas

```bash
npm test   # 66 pruebas unitarias (no requieren PostgreSQL)
```

Las pruebas de integración (register/login/endpoints de datos) requieren PostgreSQL. Se documentan en la sección de pruebas.

---

## Modelo de datos

```
usuarios                   — cuentas de usuario
contenidos                 — catálogo compartido (canciones y álbumes de Spotify)
biblioteca_items           — biblioteca personal (estado, es_favorito, puntuacion)
resenas                    — reseñas de usuario por contenido
colecciones                — playlists personales
coleccion_items            — contenidos dentro de una colección
actividad                  — historial de acciones
reproducciones (pendiente) — historial de reproducciones para estadísticas de escucha
```

---

## Endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Pública | Registro de usuario |
| POST | `/api/auth/login` | Pública | Inicio de sesión |
| POST | `/api/auth/logout` | Pública | Cierre de sesión |
| GET | `/api/auth/me` | ✅ | Usuario autenticado |

### Perfil

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/users/me` | ✅ | Consultar perfil |
| PATCH | `/api/users/me` | ✅ | Editar avatar, bio, generos_preferidos |

### Catálogo (Spotify)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/catalog/search?q=&tipo=track\|album\|both&limit=` | ✅ | Buscar canciones/álbumes |
| GET | `/api/catalog/:spotifyId?tipo=track\|album` | ✅ | Detalle y persistir en contenidos |

### Biblioteca

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/library?estado=&favorito=true\|false&orderBy=` | ✅ | Listar biblioteca |
| POST | `/api/library` | ✅ | Agregar contenido |
| PATCH | `/api/library/:contenidoId` | ✅ | Cambiar estado |
| DELETE | `/api/library/:contenidoId` | ✅ | Quitar de biblioteca |

### Favoritos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/favorites` | ✅ | Listar favoritos |
| POST | `/api/favorites/:contenidoId` | ✅ | Marcar favorito |
| DELETE | `/api/favorites/:contenidoId` | ✅ | Quitar favorito |

### Puntuaciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/ratings` | ✅ | Listar puntuados |
| PUT | `/api/ratings/:contenidoId` | ✅ | Crear/actualizar puntuación (1-5) |
| DELETE | `/api/ratings/:contenidoId` | ✅ | Eliminar puntuación |

### Reseñas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/reviews` | ✅ | Mis reseñas |
| GET | `/api/reviews/:contenidoId` | ✅ | Reseña para un contenido |
| POST | `/api/reviews/:contenidoId` | ✅ | Crear reseña |
| PATCH | `/api/reviews/:contenidoId` | ✅ | Editar reseña |
| DELETE | `/api/reviews/:contenidoId` | ✅ | Eliminar reseña |

### Colecciones

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/collections` | ✅ | Listar colecciones |
| POST | `/api/collections` | ✅ | Crear colección |
| GET | `/api/collections/:id` | ✅ | Detalle con contenidos |
| PATCH | `/api/collections/:id` | ✅ | Renombrar/editar |
| DELETE | `/api/collections/:id` | ✅ | Eliminar |
| POST | `/api/collections/:id/items` | ✅ | Agregar contenido |
| DELETE | `/api/collections/:id/items/:contenidoId` | ✅ | Quitar contenido |

### Actividad

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/activity?limite=&tipo=` | ✅ | Historial de actividad |

### Estadísticas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/statistics` | ✅ | 8 indicadores dinámicos |

### Sistema

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/health` | Pública | Estado del servidor |

---

## Estadísticas implementadas

1. **Totales por tipo** — canciones y álbumes en biblioteca (`biblioteca_items` + `contenidos`)
2. **Distribución de estados** — quiero_escuchar / escuchando / escuchado
3. **Total de favoritos** — `es_favorito = TRUE`
4. **Promedio y cantidad de puntuaciones** — `AVG(puntuacion)`
5. **Géneros más frecuentes** — unnest de `contenidos.generos`
6. **Total de reseñas** — `resenas`
7. **Colecciones y sus tamaños** — `colecciones` + `coleccion_items`
8. **Actividad por mes** — últimos 6 meses desde `actividad`

**Pendiente** (requiere aplicar `003_reproducciones.sql`):
- Artistas más escuchados
- Canciones más reproducidas
- Reproducciones por período

---

## Autenticación

- JWT almacenado en cookie **HttpOnly** (JS no puede leerla)
- Cookie `Secure` solo en producción, `SameSite=Lax`
- Fallback a header `Authorization: Bearer <token>` para herramientas de testing
- El `usuario_id` se obtiene siempre del token (`req.user.id`), nunca del body
- Expiración configurable vía `JWT_EXPIRES_IN`

---

## Seguridad

- Contraseñas hasheadas con bcryptjs (10 rondas)
- Consultas parametrizadas en todos los módulos (no hay interpolación de strings del cliente)
- Aislamiento por usuario en todas las queries (`WHERE usuario_id = req.user.id`)
- Control de propiedad en colecciones antes de modificar o eliminar
- Validación de entrada con Zod en todos los endpoints
- CORS limitado al `FRONTEND_URL` configurado

---

## Cuenta demo

| Campo | Valor |
|-------|-------|
| Email | `demo@sonora.app` |
| Password | `demo1234` |
| Contenidos | 12 (8 tracks + 4 álbumes) |
| Favoritos | 5 |
| Estados | 3 (quiero_escuchar, escuchando, escuchado) |
| Puntuaciones | 5 |
| Reseñas | 3 |
| Colecciones | 3 (con contenidos) |
| Actividad | 12 eventos en los últimos 30 días |
