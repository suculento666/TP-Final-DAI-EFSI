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
git clone https://github.com/CiroPerazzo/TPFINAL-frontend.git
cd TPFINAL-frontend
npm install
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

**Evidencia de integración:** [https://docs.google.com/document/d/1JYM24q5HX2t4cEUaVLK6EMbp4EhMF1Sj-t7tZpILTbA/edit?pli=1&tab=t.hkfg5tqozx3j]

## 11. Compilación y pruebas

**Frontend:**

```bash
npm run build
npm run preview
```

**Backend:**

```bash
npm run migrate
npm run start
```

La documentación de endpoints y los repositorios vinculados permiten consultar la implementación de cada componente.

---

**MUSICMAN · ORT 2026**
