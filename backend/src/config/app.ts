import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  FRONTEND_PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default('../database/finance.db'),
  UPLOADS_PATH: z.string().default('../uploads'),
  LOGS_PATH: z.string().default('../logs'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const env = envSchema.parse(process.env);

export const appConfig = {
  port: env.PORT,
  frontendPort: env.FRONTEND_PORT,
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  databasePath: env.DATABASE_PATH,
  uploadsPath: env.UPLOADS_PATH,
  logsPath: env.LOGS_PATH,
};
