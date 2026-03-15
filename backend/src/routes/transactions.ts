import type { FastifyInstance } from 'fastify';

/**
 * Transaction routes
 *
 * GET /api/transactions         — paginated, filtered list
 * PUT /api/transactions/:id     — update category (inline edit)
 */
export async function transactionRoutes(fastify: FastifyInstance) {
    // TODO: implement route handlers — see docs/system-architecture.md API Design
    fastify.log.info('Transaction routes registered');
}
