# MUSICMAN — My Collection

**Trabajo Práctico Final · DAI / EFSI 2026 · ORT**

## 1. Descripción

MUSICMAN es una aplicación web para explorar música y gestionar una biblioteca personal. Permite guardar canciones y álbumes, organizarlos por estado, marcar favoritos, crear colecciones, puntuar contenidos, escribir reseñas y registrar reproducciones. También ofrece estadísticas dinámicas y un resumen musical personal estilo Spotify Wrapped.

## 2. Integrantes

- **Fidel Goldsman:** Backend.
- **Agustín [apellido]:** [Responsabilidad].
- **Ignacio [apellido]:** [Responsabilidad].

## 3. Tecnologías

- **Frontend:** React, React Router y Axios.
- **Backend:** Node.js y Express.
- **Base de datos:** PostgreSQL.
- **Autenticación:** JWT, cookies HttpOnly y bcrypt.
- **API externa:** Spotify Web API.
- **Diseño:** Figma.

## 4. Arquitectura

El frontend consulta Spotify para explorar canciones y álbumes, y se comunica con nuestro backend para gestionar los datos personales.

El backend está desarrollado con Express y organizado en módulos: autenticación, usuarios, catálogo, biblioteca, favoritos, puntuaciones, reseñas, colecciones, actividad, reproducciones y estadísticas.

PostgreSQL almacena la información de los usuarios y sus contenidos. Cada operación privada se asocia al usuario autenticado mediante el ID extraído del JWT.

## 5. Modelo de datos

La base de datos cuenta con ocho tablas:

| Tabla               | Responsabilidad                                     |
|---------------------|-----------------------------------------------------|
| `usuarios`          | Cuentas y perfiles                                  |
| `contenidos`        | Canciones y álbumes (catálogo compartido)           |
| `biblioteca_items`  | Estado, favoritos y puntuaciones por usuario        |
| `resenas`           | Reseñas personales                                  |
| `colecciones`       | Colecciones creadas por los usuarios                |
| `coleccion_items`   | Contenidos de cada colección                        |
| `actividad`         | Historial de acciones del usuario                   |
| `reproducciones`    | Historial de reproducciones (reales o simuladas)    |

La estructura y los datos iniciales están en `db/migrations/`. El migrador aplica automáticamente solo las migraciones pendientes usando la tabla `schema_migrations`.

## 6. Instalación

**Requisitos:** Node.js >= 20, npm y PostgreSQL.

```bash
git clone https://github.com/suculento666/TP-Final-DAI-EFSI.git
cd TP-Final-DAI-EFSI
npm install
```

Crear un archivo `.env` con las siguientes variables (sin valores secretos):

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=my_collection
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

Crear la base de datos y ejecutar las migraciones:

```bash
createdb my_collection
npm run migrate
npm run dev
```

El comando `npm run migrate` es idempotente: aplica solo las migraciones que todavía no fueron ejecutadas. Se puede correr varias veces sin riesgo.

Para resetear desde cero:

```bash
dropdb my_collection && createdb my_collection && npm run migrate
```

## 7. Endpoints de la API

Todas las rutas usan el prefijo `/api`. Las rutas marcadas con 🔒 requieren autenticación mediante cookie HttpOnly o header `Authorization: Bearer <token>`.

### Autenticación

| Método | Ruta              | Auth | Body                                              | Descripción                        |
|--------|-------------------|------|---------------------------------------------------|------------------------------------|
| POST   | /api/auth/register | —   | `{ username, email, password, passwordConfirm }` | Registra un nuevo usuario          |
| POST   | /api/auth/login    | —   | `{ email, password }`                             | Inicia sesión, devuelve JWT        |
| POST   | /api/auth/logout   | 🔒  | —                                                 | Cierra sesión, borra la cookie     |
| GET    | /api/auth/me       | 🔒  | —                                                 | Devuelve el usuario autenticado    |

### Perfil

| Método | Ruta              | Auth | Body                                                        | Descripción            |
|--------|-------------------|------|-------------------------------------------------------------|------------------------|
| GET    | /api/users/profile | 🔒  | —                                                           | Consulta el perfil     |
| PATCH  | /api/users/profile | 🔒  | `{ username?, avatar_url?, bio?, generos_preferidos? }`     | Edita el perfil        |

### Catálogo (Spotify)

| Método | Ruta                       | Auth | Parámetros                                  | Descripción                            |
|--------|----------------------------|------|---------------------------------------------|----------------------------------------|
| GET    | /api/catalog/search        | 🔒  | `?q=&tipo=track\|album\|both&limit=`        | Busca en Spotify                       |
| GET    | /api/catalog/tracks/:id    | 🔒  | —                                           | Detalle de una canción                 |
| GET    | /api/catalog/albums/:id    | 🔒  | —                                           | Detalle de un álbum                    |

### Biblioteca

| Método | Ruta                              | Auth | Body / Parámetros                                      | Descripción                          |
|--------|-----------------------------------|------|--------------------------------------------------------|--------------------------------------|
| GET    | /api/library                      | 🔒  | `?estado=&favorito=&orderBy=`                          | Lista la biblioteca del usuario      |
| POST   | /api/library                      | 🔒  | `{ contenido: { spotify_id, tipo, titulo, ... }, estado? }` | Agrega a la biblioteca          |
| PATCH  | /api/library/:contenidoId         | 🔒  | `{ estado }`                                           | Cambia el estado                     |
| DELETE | /api/library/:contenidoId         | 🔒  | —                                                      | Quita de la biblioteca               |

### Favoritos

| Método | Ruta                            | Auth | Body                   | Descripción                     |
|--------|---------------------------------|------|------------------------|---------------------------------|
| GET    | /api/favorites                  | 🔒  | —                      | Lista los favoritos             |
| POST   | /api/favorites/:contenidoId     | 🔒  | —                      | Marca como favorito             |
| DELETE | /api/favorites/:contenidoId     | 🔒  | —                      | Quita de favoritos              |

### Puntuaciones

| Método | Ruta                           | Auth | Body               | Descripción                      |
|--------|--------------------------------|------|--------------------|----------------------------------|
| GET    | /api/ratings                   | 🔒  | —                  | Lista contenidos puntuados       |
| PUT    | /api/ratings/:contenidoId      | 🔒  | `{ puntuacion }`   | Asigna o actualiza puntuación    |
| DELETE | /api/ratings/:contenidoId      | 🔒  | —                  | Elimina la puntuación            |

### Reseñas

| Método | Ruta                           | Auth | Body          | Descripción                      |
|--------|--------------------------------|------|---------------|----------------------------------|
| GET    | /api/reviews                   | 🔒  | —             | Lista las reseñas propias        |
| POST   | /api/reviews/:contenidoId      | 🔒  | `{ texto }`   | Crea una reseña                  |
| PUT    | /api/reviews/:contenidoId      | 🔒  | `{ texto }`   | Edita la reseña                  |
| DELETE | /api/reviews/:contenidoId      | 🔒  | —             | Elimina la reseña                |

### Colecciones

| Método | Ruta                                           | Auth | Body                                 | Descripción                           |
|--------|------------------------------------------------|------|--------------------------------------|---------------------------------------|
| GET    | /api/collections                               | 🔒  | —                                    | Lista las colecciones                 |
| POST   | /api/collections                               | 🔒  | `{ nombre, descripcion?, color? }`   | Crea una colección                    |
| GET    | /api/collections/:id                           | 🔒  | —                                    | Detalle con contenidos                |
| PATCH  | /api/collections/:id                           | 🔒  | `{ nombre?, descripcion?, color? }`  | Edita nombre/descripción/color        |
| DELETE | /api/collections/:id                           | 🔒  | —                                    | Elimina la colección                  |
| POST   | /api/collections/:id/items                     | 🔒  | `{ contenidoId }`                    | Agrega contenido a la colección       |
| DELETE | /api/collections/:id/items/:contenidoId        | 🔒  | —                                    | Quita contenido de la colección       |

### Actividad

| Método | Ruta             | Auth | Parámetros      | Descripción                      |
|--------|------------------|------|-----------------|----------------------------------|
| GET    | /api/activity    | 🔒  | `?limit=&tipo=` | Historial de acciones            |

### Reproducciones

| Método | Ruta                   | Auth | Body / Parámetros              | Descripción                              |
|--------|------------------------|------|--------------------------------|------------------------------------------|
| POST   | /api/plays             | 🔒  | `{ contenidoId, duracionSeg? }` | Registra una reproducción               |
| GET    | /api/plays             | 🔒  | `?limit=&offset=`              | Historial de reproducciones             |
| GET    | /api/plays/wrapped     | 🔒  | —                              | Resumen tipo Spotify Wrapped            |

### Estadísticas

| Método | Ruta               | Auth | Descripción                                              |
|--------|--------------------|------|----------------------------------------------------------|
| GET    | /api/statistics    | 🔒  | Resumen con 11 indicadores dinámicos calculados en tiempo real |

### Health check

| Método | Ruta         | Auth | Descripción           |
|--------|--------------|------|-----------------------|
| GET    | /api/health  | —    | Estado del servidor   |

## 8. Estadísticas

El endpoint `/api/statistics` calcula 11 indicadores dinámicos a partir de los datos reales del usuario:

1. Contenidos por tipo (canciones vs álbumes)
2. Distribución de estados (quiero escuchar / escuchando / escuchado)
3. Total de favoritos
4. Promedio y cantidad de puntuaciones
5. Géneros más frecuentes en la biblioteca
6. Total de reseñas escritas
7. Colecciones y sus tamaños
8. Actividad mensual (últimos 6 meses)
9. Artistas más escuchados (basado en reproducciones)
10. Canciones más reproducidas (solo tracks)
11. Géneros más escuchados según reproducciones

El endpoint `/api/plays/wrapped` devuelve el resumen musical estilo Spotify Wrapped: artistas top, canciones top, géneros top y hábitos de escucha por hora del día (en hora de Argentina).

Ningún indicador usa valores fijos. Todo se calcula con SQL en tiempo real.

## 9. Autenticación

El backend genera un JWT con expiración configurable (por defecto 7 días). El token se almacena en una cookie HttpOnly, Secure y SameSite. Las rutas privadas verifican el token en el servidor mediante middleware. Las contraseñas se almacenan con hash bcrypt (10 rondas). Los datos de cada usuario están aislados: ninguna consulta permite acceder a información de otro usuario.

## 10. Datos de demostración

Las migraciones cargan automáticamente una cuenta demo con:

- Perfil con avatar, biografía y géneros preferidos.
- 12 contenidos en la biblioteca.
- 5 favoritos.
- Contenidos en los tres estados disponibles.
- 8 puntuaciones.
- 3 reseñas.
- 3 colecciones con contenidos.
- Actividad reciente.
- 23 reproducciones simuladas con hábitos de escucha realistas.

Las credenciales de acceso se entregan por el canal indicado por los docentes.

## 11. Pruebas

```bash
npm test
```

El proyecto cuenta con pruebas unitarias para hash, JWT, validadores y manejo de errores. Las operaciones que requieren PostgreSQL se verifican con la base en funcionamiento.

## 12. Despliegue y organización

- **Frontend:** [URL]
- **Backend:** [URL]
- **Repositorio:** https://github.com/suculento666/TP-Final-DAI-EFSI
- **Figma:** [LINK]
- **Trello:** [LINK]

El desarrollo se organiza mediante ramas individuales y Pull Requests. Trello se utiliza para asignar responsables y hacer seguimiento de las tareas.

---

**MUSICMAN · ORT 2026**
