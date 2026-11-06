# MUSICMAN — My Collection

**Trabajo Práctico Final · DAI / EFSI 2026 · ORT**

## 1. Descripción

MUSICMAN es una aplicación web para explorar música y gestionar una biblioteca personal. Permite guardar canciones y álbumes, organizarlos por estado, marcar favoritos, crear colecciones, puntuar contenidos y escribir reseñas. También ofrece estadísticas basadas en la información de cada usuario.

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

El backend está desarrollado con Express y organizado en módulos: autenticación, usuarios, catálogo, biblioteca, favoritos, puntuaciones, reseñas, colecciones, actividad y estadísticas.

PostgreSQL almacena la información de los usuarios y sus contenidos. Cada operación privada se asocia al usuario autenticado.

## 5. Modelo de datos

La base de datos cuenta con siete tablas principales:

- `usuarios`: cuentas y perfiles.
- `contenidos`: canciones y álbumes.
- `biblioteca_items`: estados, favoritos y puntuaciones.
- `resenas`: reseñas personales.
- `colecciones`: colecciones creadas por los usuarios.
- `coleccion_items`: contenidos de cada colección.
- `actividad`: historial de acciones.

La estructura y los datos iniciales se encuentran en `db/migrations/`.

## 6. Instalación

**Requisitos:** Node.js, npm y PostgreSQL.

```bash
git clone https://github.com/suculento666/TP-Final-DAI-EFSI.git
cd TP-Final-DAI-EFSI
npm install
```

Crear un archivo `.env` con las siguientes variables:

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

Crear la base de datos `my_collection` y ejecutar:

```bash
npm run migrate
npm run dev
```

## 7. API y autenticación

La API REST utiliza el prefijo `/api` y cuenta con endpoints para:

- Registro, login, logout y usuario autenticado.
- Consulta y edición del perfil.
- Búsqueda y consulta del catálogo musical.
- Biblioteca, favoritos y puntuaciones.
- Reseñas y colecciones.
- Historial de actividad y estadísticas.

La autenticación utiliza JWT con expiración definida. Las contraseñas se almacenan mediante hash y las rutas privadas verifican la identidad del usuario en el servidor.

## 8. Estadísticas

El backend calcula ocho indicadores a partir de los datos guardados en PostgreSQL: contenidos por tipo, distribución de estados, favoritos, puntuaciones, géneros frecuentes, reseñas, colecciones y actividad mensual.

No se utilizan valores fijos. Los rankings de reproducciones todavía no están implementados.

## 9. Datos de demostración

La migración `002_seed_prueba.sql` carga una cuenta con perfil, 12 contenidos, 5 favoritos, contenidos en tres estados, 8 puntuaciones, 3 reseñas, 3 colecciones y actividad reciente.

Las credenciales se entregan por el canal indicado por los docentes.

## 10. Pruebas

Para ejecutar las pruebas unitarias:

```bash
npm test
```

El proyecto cuenta con 70 pruebas unitarias. Las pruebas que requieren PostgreSQL deben verificarse con la base de datos en funcionamiento.

## 11. Despliegue y organización

- **Frontend:** [URL]
- **Backend:** [URL]
- **Repositorio:** https://github.com/suculento666/TP-Final-DAI-EFSI
- **Figma:** [LINK]
- **Trello:** [LINK]

El desarrollo se organiza mediante ramas individuales y Pull Requests. Trello se utiliza para asignar responsables y hacer seguimiento de las tareas.

---

**MUSICMAN · ORT 2026**