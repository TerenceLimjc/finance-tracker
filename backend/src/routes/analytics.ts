import type { FastifyInstance } from 'fastify';

/**
 * Analytics routes
 *
 * GET /api/analytics/spending   — monthly summary + category breakdown
 * GET /api/analytics/categories — category totals for a period
 */
export async function analyticsRoutes(fastify: FastifyInstance) {
    // TODO: implement route handlers — see docs/system-architecture.md API Design
    fastify.log.info('Analytics routes registered');
}
