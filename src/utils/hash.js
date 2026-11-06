import bcrypt from 'bcryptjs';

// bcryptjs: 10 rondas es un balance razonable entre seguridad y tiempo.
const SALT_ROUNDS = 10;

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
