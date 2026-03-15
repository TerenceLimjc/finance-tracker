import type { FastifyInstance } from 'fastify';
import { UploadService } from '../services/uploadService';

const ALLOWED_MIMETYPES = new Set([
    'application/pdf',
    'text/csv',
    'text/plain',                            // some banks export CSV with text/plain
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const ALLOWED_EXTS = new Set(['.pdf', '.csv', '.xlsx', '.xls', '.ofx', '.qif']);

const svc = new UploadService();

/**
 * Upload routes
 *
 * POST   /api/uploads     — upload a new bank statement file
 * GET    /api/uploads     — list upload history (paginated)
 * DELETE /api/uploads/:id — delete upload + cascade transactions
 */
export async function uploadRoutes(fastify: FastifyInstance) {
    // POST /api/uploads
    fastify.post('/', async (req, reply) => {
        const data = await req.file();
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        const ext = data.filename.substring(data.filename.lastIndexOf('.')).toLowerCase();
        if (!ALLOWED_MIMETYPES.has(data.mimetype) && !ALLOWED_EXTS.has(ext)) {
            return reply.status(400).send({
                error: `Unsupported file type. Allowed: PDF, CSV, XLSX, XLS, OFX, QIF`,
            });
        }

        const buffer = await data.toBuffer();
        const upload = await svc.create(data.filename, data.mimetype, buffer);
        return reply.status(201).send(upload);
    });

    // GET /api/uploads
    fastify.get<{
        Querystring: { page?: string; pageSize?: string };
    }>('/', async (req, reply) => {
        const page = req.query.page !== undefined ? Number(req.query.page) : 1;
        const pageSize = req.query.pageSize !== undefined ? Number(req.query.pageSize) : 20;
        return reply.send(svc.list(page, pageSize));
    });

    // DELETE /api/uploads/:id
    fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return reply.status(400).send({ error: 'Invalid id' });
        }
        const deleted = svc.delete(id);
        if (!deleted) {
            return reply.status(404).send({ error: 'Upload not found' });
        }
        return reply.status(204).send();
    });
}
