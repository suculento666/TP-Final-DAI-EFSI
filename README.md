# MUSICMAN — My Collection

**Trabajo Práctico Final · DAI / EFSI · ORT 2026**

MUSICMAN es una aplicación web para explorar música y administrar una biblioteca personal. Permite guardar canciones y álbumes, organizarlos por estado, marcar favoritos, asignar puntuaciones, escribir reseñas, crear colecciones y consultar estadísticas personales.

## 1. Integrantes y responsabilidades

| Integrante | Responsabilidad |
|---|---|
| Fidel Goldsman | Backend |
| Ciro Perazzo | Frontend |
| Agustín Aiello | Base de datos |
| Ignacio Kohn | QA / Testing |

## 2. Repositorios y despliegue

- **Aplicación:** [URL pública de la aplicación]
- **Frontend:** https://github.com/CiroPerazzo/TPFINAL-frontend
- **Backend:** https://github.com/suculento666/TP-Final-DAI-EFSI
- **Figma:** [[LINK](https://www.figma.com/design/G1RyXAZtJXpfVL4aAhOHIk/My-Collection-%E2%80%94-dise%C3%B1o-musical?node-id=0-1&t=p1GdJ4t54yxEzZYD-1)]
- **Trello:** [[LINK](https://trello.com/b/S8CQYIuy/final-dai-efsi)]

El desarrollo se organiza mediante ramas individuales y Pull Requests para integrar los aportes de cada integrante.

## 3. Tecnologías y arquitectura

| Componente | Tecnologías |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Base de datos | PostgreSQL (`pg`) |
| Validaciones | Zod |
| Autenticación | JWT, cookies HttpOnly y bcryptjs |
| API externa | Spotify Web API |

**Arquitectura:**

1. El frontend presenta la aplicación y consume la API REST del backend.
2. El backend gestiona la lógica de negocio, autenticación y consultas a PostgreSQL.
3. El backend consulta Spotify Web API para buscar canciones y álbumes.
4. PostgreSQL almacena los usuarios, sus bibliotecas y toda su información personal.

Las credenciales de Spotify se mantienen exclusivamente en el backend.

## 4. Funcionalidades principales

- Registro, inicio y cierre de sesión.
- Búsqueda y detalle de canciones y álbumes.
- Biblioteca personal con estados: quiero escuchar, escuchando y escuchado.
- Favoritos, puntuaciones y reseñas.
- Creación y administración de colecciones.
- Historial de actividad y reproducciones.
- Estadísticas personales y resumen musical estilo Wrapped.

## 5. Instalación y ejecución local

**Requisitos:** Node.js 20 o superior, npm y PostgreSQL.

### Backend

```bash
git clone https://github.com/suculento666/TP-Final-DAI-EFSI.git
cd TP-Final-DAI-EFSI
npm install
```

Crear una base de datos PostgreSQL llamada `my_collection`.

Copiar `.env.example` a `.env` y completar las variables necesarias.

Ejecutar las migraciones e iniciar el servidor:

```bash
npm run migrate
npm run dev
```

El backend queda disponible en `http://localhost:3000`.

### Frontend

```bash
dropdb my_collection && createdb my_collection && npm run migrate
```

## 7. Endpoints de la API

Las rutas usan el prefijo `/api`. El símbolo 🔒 indica que la ruta requiere
un JWT válido en la cookie `mc_token` o en el encabezado
`Authorization: Bearer <token>`. Una solicitud sin token válido devuelve
`401` con el código `UNAUTHORIZED`.

Para verificar los endpoints localmente, usá `http://localhost:3000` (o el puerto
configurado) y conservá la cookie que devuelve el registro o el login. En el
cliente de pruebas podés confirmar la sesión con `GET /api/auth/me`. Las
solicitudes con JSON usan `Content-Type: application/json`. Una entrada que
falla la validación devuelve `400` con la estructura
`{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.

---

### Autenticación — `/api/auth`

#### `POST /api/auth/register`
Registra un nuevo usuario e inicia sesión con la cookie HttpOnly `mc_token`.

**Body:**
```json
{ "username": "demo", "email": "demo@sonora.app", "password": "demo1234", "passwordConfirm": "demo1234" }
```
**Respuesta 201:**
```json
{ "success": true, "data": { "user": { "id": 1, "username": "demo", "email": "demo@sonora.app" } } }
```

**Qué verificar**

- Con datos nuevos, devuelve `201`, el usuario público en `data.user` y la cookie en `Set-Cookie`. El email se guarda en minúsculas y el cuerpo omite el JWT y el hash de la contraseña.
- Devuelve `400` si el nombre, una vez recortado, queda fuera de 3 a 30 caracteres, si el email es inválido, si la contraseña queda fuera de 8 a 72 caracteres o si la confirmación falta o no coincide.
- Devuelve `409` con `EMAIL_TAKEN` o `USERNAME_TAKEN` al reutilizar el correo o el nombre de usuario, respectivamente. Probá cada caso con el otro campo disponible.

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

**Qué verificar**

- Con credenciales válidas y sin sesión previa, devuelve `200`, el usuario público en `data.user` y una cookie HttpOnly `mc_token`. También acepta el email registrado con mayúsculas o espacios alrededor.
- Devuelve `400` si el email es inválido o si falta la contraseña o está vacía. Devuelve `401` con `BAD_CREDENTIALS` tanto para un correo inexistente como para una contraseña incorrecta.

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

**Query:** `?q=radiohead&tipo=both&limit=10`

**Respuesta 200 sin coincidencias:**
```json
{ "success": true, "data": { "tracks": [], "albums": [] } }
```

**Qué verificar**

- Con sesión y un término como `radiohead`, devuelve `200` con los arreglos `data.tracks` y `data.albums`. Con `tipo=track`, `albums` queda vacío. Con `tipo=album`, `tracks` queda vacío. El tipo predeterminado es `both`.
- `limit` admite dígitos y su valor efectivo se limita a 10 por tipo. Si se omite o se envía `0`, se usa 10.
- Devuelve `400` si falta `q`, si se envía vacío, si `tipo` es inválido, si `limit` contiene caracteres distintos de dígitos o si se agrega un parámetro desconocido. Un `q` compuesto solo por espacios devuelve ambos arreglos vacíos con `200`.

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
Lista la biblioteca del usuario autenticado.

**Query:** `?estado=escuchado&favorito=true&orderBy=titulo`

**Respuesta 200:**
```json
{ "success": true, "data": { "items": [ { "id": 1, "estado": "escuchado", "es_favorito": true, "puntuacion": 5, "spotify_id": "...", "titulo": "Mr. Brightside" } ] } }
```

**Qué verificar**

- Devuelve `200` con `data.items`. Una biblioteca vacía devuelve `[]`. Con dos cuentas, verificá que cada una vea solo sus propios ítems.
- `estado` admite `quiero_escuchar`, `escuchando` y `escuchado`. `favorito` admite `true` y `false`. Si se combinan, los resultados cumplen ambos filtros.
- `orderBy` admite `agregado_en`, `actualizado_en` y `titulo`. El orden es descendente y por defecto usa `agregado_en`. Un valor inválido o un parámetro desconocido devuelve `400`.

#### `POST /api/library` 🔒
Agrega un contenido a la biblioteca con los metadatos que el servidor obtiene de Spotify. Si ya está guardado, actualiza su estado.

**Body:**
```json
{ "contenido": { "spotify_id": "4iV5W9uYEdYUVa79Axb7Rh", "tipo": "track" }, "estado": "quiero_escuchar" }
```
**Respuesta 201:**
```json
{ "success": true, "data": { "item": { "id": 1, "contenido_id": 5, "estado": "quiero_escuchar", "contenido": { "id": 5, "spotify_id": "4iV5W9uYEdYUVa79Axb7Rh", "tipo": "track" } } } }
```

**Qué verificar**

- Con un ID de Spotify válido y su tipo (`track` o `album`), devuelve `201` con `data.item` y los metadatos persistidos en `data.item.contenido`. Si se omite `estado`, usa `quiero_escuchar`. Confirmá el alta con `GET /api/library`.
- Repetir el alta con otro estado devuelve `201` y deja un único ítem con el estado actualizado. Si se envía un `titulo` válido en el cuerpo, se guarda el título de Spotify.
- Devuelve `400` si falta `contenido`, si el `spotify_id` está vacío o si el tipo o el estado son inválidos. Si Spotify indica que el contenido no existe, devuelve `404` con `SPOTIFY_NOT_FOUND`.

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

**Qué verificar**

- Enviá la solicitud sin cuerpo y usá el ID interno del contenido (`data.item.contenido_id` al guardarlo en la biblioteca). Devuelve `200` con `data.item.es_favorito: true`. Confirmalo con `GET /api/library?favorito=true`.
- Con un contenido persistido que todavía no está en la biblioteca de la cuenta autenticada, crea el ítem con estado `quiero_escuchar`. Si ya estaba guardado, conserva su estado. Repetir el POST mantiene el favorito marcado.
- Devuelve `400` si `contenidoId` no representa un entero positivo y `404` si el ID válido no existe en el catálogo local.

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

**Qué verificar**

- Con un nombre de 1 a 100 caracteres después de quitar espacios de los extremos, devuelve `201` con `data.collection`. Confirmá que figura en `GET /api/collections` para la misma cuenta.
- `descripcion` y `color` admiten omisión o `null`. Devuelve `400` para un nombre vacío o demasiado largo, una descripción de más de 300 caracteres, un color distinto de `#RRGGBB` o campos desconocidos.
- Devuelve `409` con `COLLECTION_NAME_TAKEN` al repetir el nombre en la misma cuenta. Otra cuenta puede crear una colección con ese nombre.

#### `GET /api/collections/:id` 🔒
Detalle de la colección con sus contenidos.

**Respuesta 200:**
```json
{ "success": true, "data": { "collection": { "id": 1, "nombre": "Clásicos de Rock" }, "items": [ { "titulo": "Mr. Brightside" } ] } }
```

Copiar `.env.example` a `.env`. Para desarrollo local, el proxy apunta por defecto al backend en `http://localhost:3000`.

Iniciar React:

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## 6. Variables de entorno

### Backend

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor |
| `NODE_ENV` | Entorno de ejecución |
| `DB_HOST`, `DB_PORT` | Dirección y puerto de PostgreSQL |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a la base de datos |
| `JWT_SECRET` | Secreto para firmar los tokens (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | Duración del token |
| `FRONTEND_URL` | URL del frontend para CORS |
| `SPOTIFY_CLIENT_ID` | Identificador de la aplicación Spotify |
| `SPOTIFY_CLIENT_SECRET` | Secreto de la aplicación Spotify |

### Frontend

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (por defecto `/api`) |
| `API_PROXY_TARGET` | Destino del proxy local de Vite |

Los archivos `.env` contienen información privada y no deben subirse al repositorio.

## 7. Endpoints del backend

Todas las rutas están bajo el prefijo `/api`. Las rutas marcadas como protegidas requieren autenticación.

| Módulo | Endpoints |
|---|---|
| Health | `GET /health` |
| Autenticación | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Usuarios | `GET /users/me`, `PATCH /users/me` |
| Catálogo | `GET /catalog/search`, `GET /catalog/:spotifyId` |
| Biblioteca | `GET /library`, `POST /library`, `PATCH /library/:contenidoId`, `DELETE /library/:contenidoId` |
| Favoritos | `GET /favorites`, `POST /favorites/:contenidoId`, `DELETE /favorites/:contenidoId` |
| Puntuaciones | `GET /ratings`, `PUT /ratings/:contenidoId`, `DELETE /ratings/:contenidoId` |
| Reseñas | `GET /reviews`, `GET /reviews/:contenidoId`, `POST /reviews/:contenidoId`, `PATCH /reviews/:contenidoId`, `DELETE /reviews/:contenidoId` |
| Colecciones | `GET /collections`, `POST /collections`, `GET /collections/:id`, `PATCH /collections/:id`, `DELETE /collections/:id`, `POST /collections/:id/items`, `DELETE /collections/:id/items/:contenidoId` |
| Actividad | `GET /activity` |
| Estadísticas | `GET /statistics` |
| Reproducciones | `GET /plays`, `POST /plays`, `GET /plays/wrapped` |

Los endpoints privados están protegidos mediante middleware de autenticación y operan sobre los datos del usuario autenticado.

## 8. Modelo de datos

La base de datos utiliza PostgreSQL y se organiza en las siguientes tablas:

| Tabla | Responsabilidad |
|---|---|
| `usuarios` | Cuentas y perfiles |
| `contenidos` | Catálogo de canciones y álbumes |
| `biblioteca_items` | Biblioteca, estados, favoritos y puntuaciones |
| `resenas` | Reseñas de los usuarios |
| `colecciones` | Colecciones personales |
| `coleccion_items` | Contenidos asociados a cada colección |
| `actividad` | Historial de acciones |
| `reproducciones` | Historial de reproducciones reales o simuladas |

Las relaciones entre usuarios y sus datos personales se gestionan mediante claves foráneas. Las migraciones se encuentran en `db/migrations/` y se ejecutan mediante `npm run migrate`.

## 9. Autenticación y seguridad

- Las contraseñas se almacenan mediante hash bcrypt.
- La autenticación utiliza JWT almacenado en una cookie HttpOnly.
- Las rutas privadas verifican la sesión mediante middleware.
- El backend identifica al usuario desde el token, no desde un ID enviado por el cliente.
- Las consultas privadas filtran los datos por el usuario autenticado.
- Las credenciales y secretos se almacenan en variables de entorno.

## 10. Datos de demostración e integración

Las migraciones incluyen datos iniciales para una cuenta de demostración: biblioteca con canciones y álbumes, favoritos, puntuaciones, reseñas, colecciones, actividad y reproducciones simuladas.

Las credenciales de acceso se entregan por el canal indicado por los docentes y no se publican en el repositorio.

El frontend está integrado con el backend para los flujos de autenticación, búsqueda de catálogo, biblioteca, favoritos, puntuaciones, reseñas, colecciones y estadísticas.

**Qué verificar**

- Devuelve `200` con los 11 indicadores de la cuenta autenticada. Con una cuenta nueva, los listados son `[]`, `favoritos` y `total_resenas` valen `0` y `promedio_puntuaciones` vale `{ "promedio": null, "puntuados": 0 }`.
- Compará dos respuestas tras agregar un contenido, marcarlo como favorito y crear una colección. Deben reflejar esos cambios en el total por tipo, la distribución por estado, el total de favoritos y la lista de colecciones. Los datos de otra cuenta quedan fuera del resumen.
- La actividad se agrupa por mes a partir de los últimos seis meses. Los rankings de artistas, canciones y géneros escuchados se calculan a partir de las reproducciones y devuelven hasta cinco filas cada uno.

---

## 11. Compilación y pruebas

**Frontend:**

```bash
npm run build
npm run preview
```

**Backend:**

```bash
node --test src/tests/unit/*.test.js
```

La documentación de endpoints y los repositorios vinculados permiten consultar la implementación de cada componente.

---

**MUSICMAN · ORT 2026**
