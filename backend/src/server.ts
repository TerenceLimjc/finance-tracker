import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { uploadRoutes } from './routes/uploads';
import { transactionRoutes } from './routes/transactions';
import { categoryRoutes } from './routes/categories';
import { analyticsRoutes } from './routes/analytics';
import { appConfig } from './config/app';

const server = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true },
        },
    },
});

async function bootstrap() {
    // Security
    await server.register(helmet);
    await server.register(cors, { origin: `http://localhost:${appConfig.frontendPort}` });

    // Multipart (for file uploads)
    await server.register(multipart, {
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    });

    // Routes
    await server.register(uploadRoutes, { prefix: '/api/uploads' });
    await server.register(transactionRoutes, { prefix: '/api/transactions' });
    await server.register(categoryRoutes, { prefix: '/api/categories' });
    await server.register(analyticsRoutes, { prefix: '/api/analytics' });

    // Health check
    server.get('/health', async () => ({ status: 'ok' }));

    await server.listen({ port: appConfig.port, host: '0.0.0.0' });
    server.log.info(`Backend running at http://localhost:${appConfig.port}`);
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
