import type { FastifyInstance } from 'fastify';

export const healthRoute = async (app: FastifyInstance) => {
  app.get('/api/health', async (_req, reply) => {
    return reply.send({ status: 'ok' });
  });
};
