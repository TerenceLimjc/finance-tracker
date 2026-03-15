import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

/**
 * Global error handler for Fastify.
 * Returns a consistent JSON error envelope to the client.
 */
export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    success: false,
    statusCode,
    error: error.name ?? 'InternalServerError',
    message: error.message ?? 'An unexpected error occurred',
  });
}
