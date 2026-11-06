# MUSICMAN — My Collection · Backend

TP Final DAI/EFSI 2026 — ORT Argentina

<!-- COMPLETAR: una o dos oraciones propias explicando qué es MUSICMAN,
     qué problema resuelve y qué puede hacer el usuario en la app. -->

---

## Integrantes y responsabilidades

<!-- COMPLETAR: reemplazá esta tabla con los nombres reales, las ramas
     que efectivamente tienen en GitHub y lo que hizo cada uno.
     No pongan ramas que todavía no existen. -->

| Nombre | Rama | Responsabilidad |
|--------|------|-----------------|
| Fidel Goldsman | `main` | <!-- qué implementaste vos --> |
| Agustín | `AgusRama` | Conexión a PostgreSQL (`env.js`, `pool.js`) |
| Ignacio | <!-- rama --> | <!-- qué aportó --> |

---

## Tecnologías

**Backend:** Node.js ≥ 20, Express 4, PostgreSQL 16, pg 8, bcryptjs, jsonwebtoken, zod, cookie-parser, dotenv

**API externa:** Spotify Web API (Client Credentials) — búsqueda y metadatos de canciones y álbumes

<!-- COMPLETAR: tecnologías del frontend cuando estén definidas -->

---

## Arquitectura

<!-- COMPLETAR: explicar con sus palabras cómo se comunican React, Express,
     PostgreSQL y Spotify. No tiene que ser largo: tres o cuatro oraciones
     sobre la responsabilidad de cada capa alcanzan. -->

---

## Instalación local

### Requisitos previos

- Node.js ≥ 20
- PostgreSQL 16 corriendo localmente
- Credenciales de Spotify (ver sección Credenciales de Spotify)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/suculento666/TP-Final-DAI-EFSI.git
cd TP-Final-DAI-EFSI

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales reales (ver Variables de entorno)

# 4. Crear la base de datos
createdb -U postgres my_collection

# 5. Aplicar el esquema (solo sobre una base vacía)
psql -U postgres -d my_collection -f db/migrations/001_init_v2.sql

# 6. Cargar datos de demostración
psql -U postgres -d my_collection -f db/migrations/002_seed_prueba.sql

# 7. Iniciar el servidor
npm run dev    # desarrollo con nodemon
npm start      # producción
```

### Nota sobre re-inicialización

Si necesitás aplicar las migraciones sobre una base existente, el runner detecta las tablas y aborta con un mensaje de ayuda. Para empezar desde cero:

```bash
dropdb my_collection && createdb my_collection
npm run migrate
```

---

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores. **Nunca commitees `.env`.**

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `PORT` | Puerto del servidor (default: 3000) | No |
| `NODE_ENV` | `development` o `production` | No |
| `DB_HOST` | Host de PostgreSQL | Sí |
| `DB_PORT` | Puerto de PostgreSQL (default: 5432) | No |
| `DB_NAME` | Nombre de la base (`my_collection`) | Sí |
| `DB_USER` | Usuario de PostgreSQL | Sí |
| `DB_PASSWORD` | Contraseña de PostgreSQL | Sí |
| `JWT_SECRET` | Secreto JWT, mínimo 32 caracteres | Sí |
| `JWT_EXPIRES_IN` | Expiración del token (default: `7d`) | No |
| `FRONTEND_URL` | URL del frontend (para CORS) | Sí |
| `SPOTIFY_CLIENT_ID` | Client ID de la app de Spotify | Para catálogo |
| `SPOTIFY_CLIENT_SECRET` | Client Secret de la app de Spotify | Para catálogo |

---

## Credenciales de Spotify

1. Crear una aplicación en https://developer.spotify.com/dashboard
2. Copiar el Client ID y el Client Secret al `.env`

La autenticación usa **Client Credentials**: permite buscar y consultar metadatos públicos de canciones y álbumes. No accede al historial personal de ningún usuario de Spotify.

---

## Modelo de datos

Siete tablas principales en PostgreSQL. Las eliminaciones de datos personales no borran el catálogo compartido.

```
usuarios
  Cuentas de usuario. Campos: id, username, email, password_hash,
  avatar_url, bio, generos_preferidos, creado_en.

contenidos
  Catálogo compartido de canciones y álbumes de Spotify.
  Identificados por spotify_id (único). Campos: id, spotify_id, tipo
  (track/album), titulo, artista, album, generos[], portada_url,
  duracion_ms, total_canciones, fecha_lanzamiento, creado_en.

biblioteca_items
  Relación personal usuario↔contenido. Almacena estado de escucha,
  favorito y puntuación. Unique (usuario_id, contenido_id).
  Estados: quiero_escuchar, escuchando, escuchado.
  Puntuación: 1 a 5 (nullable).

resenas
  Una reseña por usuario y contenido. Unique (usuario_id, contenido_id).

colecciones
  Playlists personales. Unique (usuario_id, nombre).

coleccion_items
  Contenidos dentro de una colección. PK compuesta (coleccion_id, contenido_id).

actividad
  Registro de acciones del usuario dentro de la app (agregar a biblioteca,
  cambiar estado, puntuar, reseñar, gestionar colecciones, etc.).
  contenido_id y coleccion_id son FK nullable con ON DELETE SET NULL.
```

Relaciones de eliminación:
- Borrar un usuario elimina en cascada sus datos personales (biblioteca, reseñas, colecciones, actividad).
- Borrar un contenido del catálogo elimina en cascada las referencias personales, pero el catálogo no se borra por acciones del usuario.
- Borrar un registro de actividad no borra el contenido ni la colección referenciada.

---

## Estrategia de autenticación y seguridad

- **Contraseñas:** hasheadas con bcryptjs (10 rondas). Nunca se devuelven en respuestas.
- **JWT:** firmado con secreto de mínimo 32 caracteres y expiración configurable.
- **Cookie:** HttpOnly, Secure en producción, `SameSite=None` en producción (para frontend y backend en dominios distintos), `SameSite=Lax` en desarrollo.
- **Autorización:** `req.user.id` siempre viene del JWT verificado, nunca del body.
- **Aislamiento:** todas las queries filtran por `usuario_id = req.user.id`.
- **Validación:** Zod en todos los endpoints (body, query params, route params).
- **SQL:** consultas parametrizadas en todos los módulos.
- **CORS:** limitado al `FRONTEND_URL` configurado.

---

## API REST

### Convención de respuestas

Éxito:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Descripción" } }
```

### Autenticación

| Método | Ruta | Auth | Body | Respuesta |
|--------|------|------|------|-----------|
| POST | `/api/auth/register` | — | `{ username, email, password, passwordConfirm }` | `{ user }` + cookie JWT |
| POST | `/api/auth/login` | — | `{ email, password }` | `{ user }` + cookie JWT |
| POST | `/api/auth/logout` | — | — | `{ message }` + limpia cookie |
| GET | `/api/auth/me` | ✅ | — | `{ user }` |

### Perfil

| Método | Ruta | Auth | Body | Respuesta |
|--------|------|------|------|-----------|
| GET | `/api/users/me` | ✅ | — | `{ user }` |
| PATCH | `/api/users/me` | ✅ | `{ avatar_url?, bio?, generos_preferidos? }` | `{ user }` actualizado |

### Catálogo (Spotify)

| Método | Ruta | Auth | Query / Body | Respuesta |
|--------|------|------|------|-----------|
| GET | `/api/catalog/search` | ✅ | `?q=texto&tipo=track\|album\|both&limit=20` | `{ tracks: [], albums: [] }` |
| GET | `/api/catalog/:spotifyId` | ✅ | `?tipo=track\|album` | `{ contenido }` persistido en BD |

### Biblioteca

| Método | Ruta | Auth | Body / Query | Respuesta |
|--------|------|------|------|-----------|
| GET | `/api/library` | ✅ | `?estado=&favorito=true\|false&orderBy=` | `{ items: [] }` |
| POST | `/api/library` | ✅ | `{ contenido: { spotify_id, tipo, titulo, ... }, estado? }` | `{ item }` 201 |
| PATCH | `/api/library/:contenidoId` | ✅ | `{ estado }` | `{ item }` actualizado |
| DELETE | `/api/library/:contenidoId` | ✅ | — | `{ contenido_id }` |

### Favoritos

| Método | Ruta | Auth | Respuesta |
|--------|------|------|-----------|
| GET | `/api/favorites` | ✅ | `{ items: [] }` |
| POST | `/api/favorites/:contenidoId` | ✅ | `{ item }` con `es_favorito: true` |
| DELETE | `/api/favorites/:contenidoId` | ✅ | `{ item }` con `es_favorito: false` |

### Puntuaciones

| Método | Ruta | Auth | Body | Respuesta |
|--------|------|------|------|-----------|
| GET | `/api/ratings` | ✅ | — | `{ items: [] }` |
| PUT | `/api/ratings/:contenidoId` | ✅ | `{ puntuacion }` (1–5, entero) | `{ item }` |
| DELETE | `/api/ratings/:contenidoId` | ✅ | — | `{ item }` con `puntuacion: null` |

### Reseñas

| Método | Ruta | Auth | Body | Respuesta |
|--------|------|------|------|-----------|
| GET | `/api/reviews` | ✅ | — | `{ items: [] }` |
| GET | `/api/reviews/:contenidoId` | ✅ | — | `{ review }` o `null` |
| POST | `/api/reviews/:contenidoId` | ✅ | `{ texto }` | `{ review }` 201 |
| PATCH | `/api/reviews/:contenidoId` | ✅ | `{ texto }` | `{ review }` actualizada |
| DELETE | `/api/reviews/:contenidoId` | ✅ | — | `{ contenido_id }` |

### Colecciones

| Método | Ruta | Auth | Body | Respuesta |
|--------|------|------|------|-----------|
| GET | `/api/collections` | ✅ | — | `{ items: [] }` |
| POST | `/api/collections` | ✅ | `{ nombre, descripcion?, color? }` | `{ collection }` 201 |
| GET | `/api/collections/:id` | ✅ | — | `{ collection, items: [] }` |
| PATCH | `/api/collections/:id` | ✅ | `{ nombre?, descripcion?, color? }` | `{ collection }` |
| DELETE | `/api/collections/:id` | ✅ | — | `{ id }` |
| POST | `/api/collections/:id/items` | ✅ | `{ contenidoId }` | `{ added: true\|false }` |
| DELETE | `/api/collections/:id/items/:contenidoId` | ✅ | — | `{ removed: true }` |

### Actividad

| Método | Ruta | Auth | Query | Respuesta |
|--------|------|------|-------|-----------|
| GET | `/api/activity` | ✅ | `?limit=50&tipo=` | `{ items: [] }` |

Valores válidos de `tipo`: `agregar_biblioteca`, `quitar_biblioteca`, `cambiar_estado`, `marcar_favorito`, `quitar_favorito`, `puntuar`, `crear_reseña`, `editar_reseña`, `borrar_reseña`, `crear_coleccion`, `borrar_coleccion`, `agregar_a_coleccion`, `quitar_de_coleccion`.

### Estadísticas

| Método | Ruta | Auth | Respuesta |
|--------|------|------|-----------|
| GET | `/api/statistics` | ✅ | Objeto con 8 indicadores (ver sección Estadísticas) |

### Sistema

| Método | Ruta | Auth | Respuesta |
|--------|------|------|-----------|
| GET | `/api/health` | — | `{ status: "ok", timestamp, environment }` |

---

## Estadísticas

Ocho indicadores calculados en el momento con SQL real, filtrados por el usuario autenticado. Ningún valor es fijo en el código.

| # | Indicador | Fuente |
|---|-----------|--------|
| 1 | Total de canciones y álbumes en biblioteca, por tipo | `biblioteca_items` + `contenidos.tipo` |
| 2 | Distribución de estados de escucha | `biblioteca_items.estado` |
| 3 | Total de favoritos | `biblioteca_items.es_favorito = TRUE` |
| 4 | Promedio y cantidad de puntuaciones | `AVG(biblioteca_items.puntuacion)` |
| 5 | Géneros más frecuentes en la biblioteca | `unnest(contenidos.generos)` |
| 6 | Total de reseñas escritas | `resenas` |
| 7 | Colecciones y cantidad de contenidos en cada una | `colecciones` + `coleccion_items` |
| 8 | Acciones por mes (últimos 6 meses) | `actividad.creado_en` |

**Pendiente:** estadísticas de artistas más escuchados, canciones más reproducidas y reproducciones por período requieren la tabla `reproducciones` (definida en `pending_003_reproducciones.sql`). No están implementadas todavía.

---

## Pruebas

```bash
npm test
```

70 pruebas unitarias que no requieren PostgreSQL. Cubren: hashing de contraseñas, firma y verificación de JWT, validadores Zod de todos los módulos, manejo de errores, catchAsync, y normalización de respuestas de Spotify.

**No están automatizadas:** las pruebas de integración contra PostgreSQL (register/login, CRUD de cada módulo, aislamiento entre usuarios, persistencia). Estas se verifican manualmente con la base corriendo.

<!-- COMPLETAR: si realizaron pruebas manuales, documentar qué probaron
     y qué resultados obtuvieron. -->

---

## Cuenta de demostración

Los datos de demostración se cargan con `002_seed_prueba.sql` sobre una base limpia.

| Dato | Cantidad |
|------|----------|
| Contenidos en biblioteca | 12 (8 tracks + 4 álbumes) |
| Favoritos | 5 |
| Estados distintos | 3 (quiero_escuchar, escuchando, escuchado) |
| Puntuaciones cargadas | 8 |
| Reseñas | 3 |
| Colecciones | 3 (con contenidos en cada una) |
| Registros de actividad | 12 |

Las credenciales se entregan por el canal indicado por los docentes, no en el repositorio público.

---

## Despliegue

<!-- COMPLETAR: agregar las URLs públicas cuando el deploy esté listo.
     La consigna exige que tanto el frontend como el backend estén
     desplegados y accesibles. -->

- Frontend: (pendiente)
- Backend: (pendiente)
- Base de datos: PostgreSQL accesible desde el backend desplegado (pendiente)

---

## Organización del equipo

<!-- COMPLETAR: agregar el link al tablero de Trello. La consigna lo exige. -->

- Repositorio: https://github.com/suculento666/TP-Final-DAI-EFSI
- Tablero de Trello: (pendiente)

Ramas y PRs:
- `AgusRama` → PR #1 integrado en `main` (conexión a PostgreSQL)
- <!-- completar con los aportes de Ignacio cuando estén listos -->

---

## Notas para los evaluadores

<!-- COMPLETAR: si hay algo que el evaluador necesita saber antes de
     probar el sistema (configuración especial, pasos no obvios,
     limitaciones conocidas), documentarlo acá. -->
