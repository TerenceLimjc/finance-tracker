import type { FastifyInstance } from 'fastify';
import { TransactionService } from '../services/transactionService';

const svc = new TransactionService();

/**
 * Transaction routes
 *
 * GET    /api/transactions      — paginated, filtered list
 * PUT    /api/transactions/:id  — update category (inline edit)
 * DELETE /api/transactions/:id  — delete a single transaction
 */
export async function transactionRoutes(fastify: FastifyInstance) {
    // GET /api/transactions
    fastify.get<{
        Querystring: {
            month?: string;
            categoryId?: string;
            searchText?: string;
            spender?: string;
            sortField?: string;
            sortOrder?: string;
            page?: string;
            pageSize?: string;
        };
    }>('/', async (req, reply) => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const {
            month = currentMonth,
            categoryId,
            searchText,
            spender,
            sortField,
            sortOrder,
            page,
            pageSize,
        } = req.query;

        const result = svc.list({
            month,
            categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
            searchText,
            spender,
            sortField: (sortField as 'transactionDate' | 'amount') ?? 'transactionDate',
            sortOrder: (sortOrder as 'asc' | 'desc') ?? 'desc',
            page: page !== undefined ? Number(page) : 1,
            pageSize: pageSize !== undefined ? Number(pageSize) : 25,
        });

        return reply.send(result);
    });

    // PUT /api/transactions/:id
    fastify.put<{
        Params: { id: string };
        Body: { categoryId: number };
    }>('/:id', async (req, reply) => {
        const id = Number(req.params.id);
        const { categoryId } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return reply.status(400).send({ error: 'Invalid transaction id' });
        }
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return reply.status(400).send({ error: 'Invalid categoryId' });
        }

        const updated = svc.updateCategory(id, categoryId);
        if (!updated) {
            return reply.status(404).send({ error: 'Transaction not found' });
        }
        return reply.status(204).send();
    });

    // DELETE /api/transactions/:id
    fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return reply.status(400).send({ error: 'Invalid transaction id' });
        }
        const deleted = svc.delete(id);
        if (!deleted) {
            return reply.status(404).send({ error: 'Transaction not found' });
        }
        return reply.status(204).send();
    });
}
