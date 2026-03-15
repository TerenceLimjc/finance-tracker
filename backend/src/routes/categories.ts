import type { FastifyInstance } from 'fastify';

/**
 * Category routes
 *
 * GET /api/categories           — list all categories
 */
export async function categoryRoutes(fastify: FastifyInstance) {
    // TODO: implement route handlers — see docs/system-architecture.md API Design
    fastify.log.info('Category routes registered');
}
