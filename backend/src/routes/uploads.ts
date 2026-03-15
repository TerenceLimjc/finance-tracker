import type { FastifyInstance } from 'fastify';

/**
 * Upload routes
 *
 * POST   /api/uploads          — upload a new bank statement file
 * GET    /api/uploads          — list upload history (paginated)
 * DELETE /api/uploads/:id      — delete upload + cascade transactions
 */
export async function uploadRoutes(fastify: FastifyInstance) {
  // TODO: implement route handlers — see docs/system-architecture.md API Design
  fastify.log.info('Upload routes registered');
}
