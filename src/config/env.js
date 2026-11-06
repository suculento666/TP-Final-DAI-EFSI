import 'dotenv/config';

// Función auxiliar: si la variable no existe, lanza un error claro
function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable de entorno faltante: ${key}`);
  }
  return value;
}

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

 db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
  },

  jwt: {
    secret: (() => {
      const s = required('JWT_SECRET');
      if (s.length < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
      }
      return s;
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export default config;
