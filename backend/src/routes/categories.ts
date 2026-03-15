import type { FastifyInstance } from 'fastify';
import { getDb } from '../database/connection';

/**
 * Category routes
 *
 * GET /api/categories  — list all categories
 */
export async function categoryRoutes(fastify: FastifyInstance) {
    fastify.get('/', async (_req, reply) => {
        const db = getDb();
        const rows = db.prepare(`
            SELECT
                id,
                name,
                parent_id    AS parentId,
                color,
                icon,
                CASE is_custom WHEN 1 THEN 1 ELSE 0 END AS isCustom
            FROM categories
            ORDER BY name ASC
        `).all();
        return reply.send(rows);
    });
}
