import type { FastifyInstance } from 'fastify';
import { TransactionService } from '../services/transactionService';

const svc = new TransactionService();

/**
 * Analytics routes
 *
 * GET /api/analytics/spending?month=YYYY-MM  — monthly summary + category breakdown
 */
export async function analyticsRoutes(fastify: FastifyInstance) {
    fastify.get<{
        Querystring: { month?: string };
    }>('/spending', async (req, reply) => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const month = req.query.month ?? currentMonth;

        if (!/^\d{4}-\d{2}$/.test(month)) {
            return reply.status(400).send({ error: 'month must be YYYY-MM' });
        }

        const summary = svc.getMonthlySummary(month);
        return reply.send(summary);
    });
}
