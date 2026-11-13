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

### Frontend conectado

El frontend está en [CiroPerazzo/TPFINAL-frontend](https://github.com/CiroPerazzo/TPFINAL-frontend).
Usar ambos repositorios como carpetas hermanas. La integración se implementa en
los servicios y pantallas del frontend; requiere conservar también sus cambios.

1. En este backend, configurar `.env`, ejecutar `npm install` y, en una base nueva,
   `npm run migrate`. Iniciar con `npm run dev` (puerto 3000).
2. En `../TPFINAL-frontend`, ejecutar `npm install` y `npm run dev`.
3. Abrir `http://localhost:5173` y registrarse o iniciar sesión.

El frontend usa `/api` y Vite reenvía las solicitudes a `http://localhost:3000`.
No necesita secretos ni tokens de Spotify. Para otro puerto del backend, copiar
el `.env.example` del frontend a `.env` y ajustar `API_PROXY_TARGET`.
La sesión se conserva en la cookie HttpOnly `mc_token` y todas las llamadas
del frontend incluyen credenciales. Las rutas privadas requieren iniciar sesión.

Para hosting separado, configurar `VITE_API_URL=https://HOST_BACKEND/api` antes
de compilar el frontend y `FRONTEND_URL=https://HOST_FRONTEND` en el backend,
con `NODE_ENV=production` y HTTPS. El hosting del frontend debe resolver las
rutas de React hacia `index.html`; el proxy de Vite solo funciona en desarrollo
y en la previsualización local.

La búsqueda y consulta de nuevos contenidos requieren credenciales válidas de
Spotify en el `.env` del backend. Si Node informa `SELF_SIGNED_CERT_IN_CHAIN`
en esta máquina, Node 24 permite usar los certificados del sistema con
`$env:NODE_USE_SYSTEM_CA="1"` en PowerShell antes de iniciar el backend.
No desactivar la verificación TLS. Un error `SPOTIFY_TOKEN_ERROR` posterior
requiere revisar `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET`.

Verificación de ambos repositorios:

```bash
npm test
npm run test:frontend
npm run test:integration
```

`test:frontend` carga los servicios del frontend hermano y su configuración real
de Vite. Verifica autenticación, perfil y CRUD mediante HTTP y PostgreSQL en un
esquema temporal que se elimina al terminar. Solo Spotify usa una respuesta de
prueba; no es una prueba visual de navegador. Si el frontend está en otra carpeta,
configurar `FRONTEND_DIR` con su ruta. `test:integration` también consulta Spotify
real y requiere acceso de red y credenciales válidas.

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
