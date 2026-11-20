# MUSICMAN — My Collection

**Trabajo Práctico Final · DAI / EFSI 2026 · ORT**

## 1. Descripción

MUSICMAN es una aplicación web para explorar música y gestionar una biblioteca personal. Permite guardar canciones y álbumes, organizarlos por estado (quiero escuchar / escuchando / escuchado), marcar favoritos, puntuar, escribir reseñas, crear colecciones y registrar reproducciones. Incluye estadísticas dinámicas y un resumen musical personal estilo Spotify Wrapped.

## 2. Integrantes y responsabilidades

Fidel Goldsman: Backend
Ciro Perazzo: Frontend
Agustín Aiello: BD
Ignacio Kohn: QA Tester

## 3. Tecnologías

- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express
- **Base de datos:** PostgreSQL (acceso directo con `pg`, sin ORM)
- **Autenticación:** JWT + cookie HttpOnly, bcrypt
- **API externa:** Spotify Web API (Client Credentials)
- **Diseño:** Figma

## 4. Arquitectura

El frontend consulta Spotify para explorar canciones y álbumes, y se comunica con el backend propio para gestionar los datos personales de cada usuario.

El backend está organizado en módulos independientes: autenticación, usuarios, catálogo, biblioteca, favoritos, puntuaciones, reseñas, colecciones, actividad, reproducciones y estadísticas. Cada módulo tiene sus rutas, controlador, servicio, repositorio y validador.

PostgreSQL almacena toda la información de los usuarios. Cada operación privada filtra por el `usuario_id` extraído del JWT, nunca por un valor enviado desde el cliente.

## 5. Modelo de datos

| Tabla               | Responsabilidad                                     |
|---------------------|-----------------------------------------------------|
| `usuarios`          | Cuentas y perfiles                                  |
| `contenidos`        | Canciones y álbumes (catálogo compartido)           |
| `biblioteca_items`  | Estado, favoritos y puntuaciones por usuario        |
| `resenas`           | Reseñas personales (una por usuario y contenido)    |
| `colecciones`       | Colecciones creadas por los usuarios                |
| `coleccion_items`   | Contenidos de cada colección                        |
| `actividad`         | Historial de acciones del usuario                   |
| `reproducciones`    | Historial de reproducciones (reales o simuladas)    |
| `schema_migrations` | Registro interno de migraciones aplicadas           |

La estructura completa está en `db/migrations/001_init_v2.sql` y `003_reproducciones.sql`.

## 6. Instalación local

**Requisitos:** Node.js >= 20, npm, PostgreSQL.

```bash
git clone https://github.com/suculento666/TP-Final-DAI-EFSI.git
cd TP-Final-DAI-EFSI
npm install
```

Crear el archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=my_collection
DB_USER=postgres
DB_PASSWORD=tu_password_de_postgres
JWT_SECRET=una_clave_secreta_de_al_menos_32_caracteres_aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
SPOTIFY_CLIENT_ID=tu_client_id_de_spotify
SPOTIFY_CLIENT_SECRET=tu_client_secret_de_spotify
```

> `JWT_SECRET` debe tener al menos 32 caracteres o el servidor no arranca.
> `DB_PASSWORD` es obligatorio. Las credenciales de Spotify se obtienen en [developer.spotify.com](https://developer.spotify.com/dashboard).

Crear la base de datos y ejecutar las migraciones:

```bash
createdb my_collection
npm run migrate
```

Iniciar el servidor en modo desarrollo:

```bash
npm run dev
```

**El comando `npm run migrate` es idempotente.** Registra cada migración aplicada en la tabla `schema_migrations` y solo ejecuta las que todavía no fueron aplicadas. Se puede correr varias veces sin riesgo.

Para resetear la base desde cero:

```bash
dropdb my_collection && createdb my_collection && npm run migrate
```

## 7. Endpoints de la API



---

### Autenticación — `/api/auth`

#### `POST /api/auth/register`
Registra un nuevo usuario.

**Body:**
```json
{ "username": "demo", "email": "demo@sonora.app", "password": "demo1234", "passwordConfirm": "demo1234" }
```
**Respuesta 201:**
```json
{ "success": true, "data": { "user": { "id": 1, "username": "demo", "email": "demo@sonora.app" } } }
```

#### `POST /api/auth/login`
Inicia sesión. Establece la cookie `mc_token` y devuelve el usuario.

**Body:**
```json
{ "email": "demo@sonora.app", "password": "demo1234" }
```
**Respuesta 200:**
```json
{ "success": true, "data": { "user": { "id": 1, "username": "demo", "email": "demo@sonora.app" } } }
```

#### `POST /api/auth/logout`
Cierra sesión borrando la cookie. No requiere autenticación.

**Respuesta 200:**
```json
{ "success": true, "data": { "message": "Sesión cerrada" } }
```

#### `GET /api/auth/me` 🔒
Devuelve el usuario autenticado.

**Respuesta 200:**
```json
{ "success": true, "data": { "user": { "id": 1, "username": "demo", "email": "demo@sonora.app", "avatar_url": "...", "bio": "...", "generos_preferidos": ["pop", "rock"] } } }
```

---

### Perfil — `/api/users`

#### `GET /api/users/me` 🔒
Devuelve el perfil completo del usuario autenticado.

**Respuesta 200:**
```json
{ "success": true, "data": { "user": { "id": 1, "username": "demo", "email": "demo@sonora.app", "avatar_url": "...", "bio": "...", "generos_preferidos": ["pop"] } } }
```

#### `PATCH /api/users/me` 🔒
Edita el perfil. Todos los campos son opcionales (parche parcial).

**Body (ejemplo parcial):**
```json
{ "bio": "Nueva bio", "generos_preferidos": ["indie", "rock"] }
```
**Respuesta 200:**
```json
{ "success": true, "data": { "user": { "id": 1, "username": "demo", "bio": "Nueva bio" } } }
```

---

### Catálogo — `/api/catalog`

#### `GET /api/catalog/search` 🔒
Busca canciones y/o álbumes en Spotify.

**Query:** `?q=radiohead&tipo=both&limit=20` (tipo: `track` | `album` | `both`)

**Respuesta 200:**
```json
{ "success": true, "data": { "tracks": [...], "albums": [...] } }
```

#### `GET /api/catalog/:spotifyId` 🔒
Devuelve el detalle de una canción o álbum por su ID de Spotify. Persiste el contenido en la base.

**Query:** `?tipo=track` o `?tipo=album`

**Respuesta 200:**
```json
{ "success": true, "data": { "item": { "id": 5, "spotify_id": "4iV5W9uYEdYUVa79Axb7Rh", "tipo": "track", "titulo": "Mr. Brightside", "artista": "The Killers" } } }
```

---

### Biblioteca — `/api/library`

#### `GET /api/library` 🔒
Lista la biblioteca del usuario. Soporta filtros.

**Query:** `?estado=escuchado&favorito=true&orderBy=titulo`

**Respuesta 200:**
```json
{ "success": true, "data": { "items": [ { "id": 1, "estado": "escuchado", "es_favorito": true, "puntuacion": 5, "spotify_id": "...", "titulo": "Mr. Brightside" } ] } }
```

#### `POST /api/library` 🔒
Agrega un contenido a la biblioteca. Los metadatos vienen del cliente (ya obtenidos de Spotify).

**Body:**
```json
{ "contenido": { "spotify_id": "4iV5W9uYEdYUVa79Axb7Rh", "tipo": "track", "titulo": "Mr. Brightside", "artista": "The Killers" }, "estado": "quiero_escuchar" }
```
**Respuesta 201:**
```json
{ "success": true, "data": { "item": { "id": 1, "estado": "quiero_escuchar", "contenido": { ... } } } }
```

#### `PATCH /api/library/:contenidoId` 🔒
Cambia el estado de un ítem.

**Body:** `{ "estado": "escuchado" }`

**Respuesta 200:**
```json
{ "success": true, "data": { "item": { "id": 1, "estado": "escuchado" } } }
```

#### `DELETE /api/library/:contenidoId` 🔒
Quita el contenido de la biblioteca.

**Respuesta 200:**
```json
{ "success": true, "data": { "contenido_id": 5 } }
```

---

### Favoritos — `/api/favorites`

#### `GET /api/favorites` 🔒
Lista los contenidos marcados como favoritos.

**Respuesta 200:**
```json
{ "success": true, "data": { "items": [ { "id": 1, "es_favorito": true, "titulo": "Mr. Brightside" } ] } }
```

#### `POST /api/favorites/:contenidoId` 🔒
Marca un contenido como favorito. Si no está en la biblioteca, lo agrega automáticamente.

**Respuesta 200:**
```json
{ "success": true, "data": { "item": { "es_favorito": true } } }
```

#### `DELETE /api/favorites/:contenidoId` 🔒
Quita de favoritos.

**Respuesta 200:**
```json
{ "success": true, "data": { "item": { "es_favorito": false } } }
```

---

### Puntuaciones — `/api/ratings`

#### `GET /api/ratings` 🔒
Lista los contenidos con puntuación asignada.

**Respuesta 200:**
```json
{ "success": true, "data": { "items": [ { "titulo": "Mr. Brightside", "puntuacion": 5 } ] } }
```

#### `PUT /api/ratings/:contenidoId` 🔒
Asigna o actualiza la puntuación (1–5). Si el contenido no está en la biblioteca, lo agrega.

**Body:** `{ "puntuacion": 5 }`

**Respuesta 200:**
```json
{ "success": true, "data": { "item": { "puntuacion": 5 } } }
```

#### `DELETE /api/ratings/:contenidoId` 🔒
Elimina la puntuación (pone `null`).

**Respuesta 200:**
```json
{ "success": true, "data": { "item": { "puntuacion": null } } }
```

---

### Reseñas — `/api/reviews`

#### `GET /api/reviews` 🔒
Lista todas las reseñas propias.

**Respuesta 200:**
```json
{ "success": true, "data": { "items": [ { "id": 1, "texto": "Clásico indiscutible.", "contenido_id": 5 } ] } }
```

#### `GET /api/reviews/:contenidoId` 🔒
Devuelve la reseña del usuario para un contenido específico.

**Respuesta 200:**
```json
{ "success": true, "data": { "review": { "id": 1, "texto": "Clásico indiscutible." } } }
```

#### `POST /api/reviews/:contenidoId` 🔒
Crea una reseña. Solo una por usuario y contenido.

**Body:** `{ "texto": "Excelente canción." }`

**Respuesta 201:**
```json
{ "success": true, "data": { "review": { "id": 2, "texto": "Excelente canción." } } }
```

#### `PATCH /api/reviews/:contenidoId` 🔒
Edita la reseña existente.

**Body:** `{ "texto": "Texto actualizado." }`

**Respuesta 200:**
```json
{ "success": true, "data": { "review": { "id": 2, "texto": "Texto actualizado." } } }
```

#### `DELETE /api/reviews/:contenidoId` 🔒
Elimina la reseña.

**Respuesta 200:**
```json
{ "success": true, "data": { "message": "Reseña eliminada" } }
```

---

### Colecciones — `/api/collections`

#### `GET /api/collections` 🔒
Lista las colecciones del usuario.

**Respuesta 200:**
```json
{ "success": true, "data": { "items": [ { "id": 1, "nombre": "Clásicos de Rock", "color": "#E63946", "contenidos": 3 } ] } }
```

#### `POST /api/collections` 🔒
Crea una colección.

**Body:** `{ "nombre": "Mi playlist", "descripcion": "Opcional", "color": "#457B9D" }`

**Respuesta 201:**
```json
{ "success": true, "data": { "collection": { "id": 4, "nombre": "Mi playlist" } } }
```

#### `GET /api/collections/:id` 🔒
Detalle de la colección con sus contenidos.

**Respuesta 200:**
```json
{ "success": true, "data": { "collection": { "id": 1, "nombre": "Clásicos de Rock" }, "items": [ { "titulo": "Mr. Brightside" } ] } }
```

#### `PATCH /api/collections/:id` 🔒
Edita nombre, descripción o color.

**Body:** `{ "nombre": "Nuevo nombre" }`

**Respuesta 200:**
```json
{ "success": true, "data": { "collection": { "id": 1, "nombre": "Nuevo nombre" } } }
```

#### `DELETE /api/collections/:id` 🔒
Elimina la colección.

**Respuesta 200:**
```json
{ "success": true, "data": { "id": 1 } }
```

#### `POST /api/collections/:id/items` 🔒
Agrega un contenido a la colección.

**Body:** `{ "contenidoId": 5 }`

**Respuesta 201:**
```json
{ "success": true, "data": { "added": true } }
```

#### `DELETE /api/collections/:id/items/:contenidoId` 🔒
Quita un contenido de la colección.

**Respuesta 200:**
```json
{ "success": true, "data": { "removed": true } }
```

---

### Actividad — `/api/activity`

#### `GET /api/activity` 🔒
Historial de acciones del usuario.

**Query:** `?limit=50&tipo=agregar_biblioteca`

**Respuesta 200:**
```json
{ "success": true, "data": { "items": [ { "id": 1, "tipo": "agregar_biblioteca", "contenido_id": 5, "creado_en": "2026-11-01T20:00:00Z" } ] } }
```

---

### Reproducciones — `/api/plays`

#### `GET /api/plays/wrapped` 🔒
Resumen tipo Spotify Wrapped: artistas top, canciones top, géneros top y hábitos de escucha por hora (hora Argentina).

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "artistas_mas_escuchados": [ { "artista": "The Killers", "reproducciones": 5 } ],
    "canciones_mas_reproducidas": [ { "titulo": "Mr. Brightside", "artista": "The Killers", "reproducciones": 5 } ],
    "generos_mas_escuchados": [ { "genero": "indie rock", "reproducciones": 9 } ],
    "habitos_por_hora": [ { "hora": 22, "reproducciones": 7 } ]
  }
}
```

#### `POST /api/plays` 🔒
Registra una reproducción.

**Body:** `{ "contenidoId": 5, "duracionSeg": 223 }`

**Respuesta 201:**
```json
{ "success": true, "data": { "play": { "id": 24, "contenido_id": 5, "reproducido_en": "2026-11-13T23:00:00Z" } } }
```

#### `GET /api/plays` 🔒
Historial de reproducciones del usuario.

**Query:** `?limit=50&offset=0`

**Respuesta 200:**
```json
{ "success": true, "data": { "plays": [ { "id": 1, "titulo": "Mr. Brightside", "reproducido_en": "2026-11-11T23:00:00Z" } ] } }
```

---

### Estadísticas — `/api/statistics`

#### `GET /api/statistics` 🔒
Devuelve 11 indicadores calculados en tiempo real con SQL.

**Respuesta 200:**
```json
{
  "success": true,
  "data": {
    "totales_por_tipo": [ { "tipo": "track", "total": 8 }, { "tipo": "album", "total": 4 } ],
    "distribucion_estados": [ { "estado": "escuchado", "total": 6 } ],
    "favoritos": 5,
    "promedio_puntuaciones": { "promedio": "4.50", "puntuados": 8 },
    "generos_frecuentes": [ { "genero": "indie rock", "total": 5 } ],
    "total_resenas": 3,
    "colecciones": [ { "id": 1, "nombre": "Clásicos de Rock", "contenidos": 3 } ],
    "actividad_por_mes": [ { "mes": "2026-11", "acciones": 12 } ],
    "artistas_mas_escuchados": [ { "artista": "The Killers", "reproducciones": 5 } ],
    "canciones_mas_reproducidas": [ { "titulo": "Mr. Brightside", "reproducciones": 5 } ],
    "generos_mas_escuchados": [ { "genero": "indie rock", "reproducciones": 9 } ]
  }
}
```

---

### Health check

#### `GET /api/health`
Verifica que el servidor esté en línea.

**Respuesta 200:**
```json
{ "success": true, "data": { "status": "ok", "timestamp": "2026-11-13T12:00:00.000Z", "environment": "production" } }
```

---

## 8. Autenticación y seguridad

- JWT con expiración configurable (por defecto 7 días).
- Token almacenado en cookie HttpOnly, Secure y SameSite.
- Contraseñas con hash bcrypt (10 rondas). Nunca se devuelve `password_hash` al cliente.
- Las rutas privadas verifican el JWT en el servidor mediante middleware.
- Los datos de cada usuario están aislados: ninguna consulta permite acceder a información de otro usuario.
- `POST /api/auth/logout` no requiere token válido para poder cerrar sesión aunque el token haya vencido.

## 9. Estadísticas

El endpoint `/api/statistics` calcula 11 indicadores dinámicos a partir de los datos reales del usuario en PostgreSQL. Ningún valor es fijo.

El endpoint `/api/plays/wrapped` devuelve el resumen musical estilo Spotify Wrapped: artistas más escuchados, canciones más reproducidas, géneros predominantes y hábitos de escucha por hora del día (en hora de Argentina, UTC-3).

## 10. Datos de demostración

Las migraciones cargan automáticamente una cuenta demo con:

- Perfil con avatar, biografía y géneros preferidos.
- 12 contenidos en la biblioteca (canciones y álbumes).
- 5 favoritos y contenidos en los 3 estados disponibles.
- 8 puntuaciones y 3 reseñas.
- 3 colecciones con contenidos asignados.
- Actividad reciente.
- 23 reproducciones simuladas con hábitos realistas (horario nocturno argentino).

Las credenciales se entregan por el canal indicado por los docentes.

## 11. Pruebas

```bash
npm test
```

Pruebas unitarias para hash de contraseñas, JWT, validadores de todos los módulos y manejo de errores. Las operaciones que dependen de PostgreSQL se verifican con la base en funcionamiento.

## 12. Despliegue

- **Frontend:** [URL]
- **Backend:** [URL]
- **Repositorio:** https://github.com/suculento666/TP-Final-DAI-EFSI
- **Figma:** [LINK]
- **Trello:** [LINK]

El desarrollo se organiza mediante ramas individuales y Pull Requests. Trello se usa para asignar responsables y hacer seguimiento de las tareas.

---

**MUSICMAN · ORT 2026**
