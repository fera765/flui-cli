export const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'secret',
  database: process.env.DATABASE_URL || 'postgresql://localhost/db'
};