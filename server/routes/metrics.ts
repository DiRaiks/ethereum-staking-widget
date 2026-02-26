import type { FastifyInstance } from 'fastify';
import Metrics from 'utilsApi/metrics';

export const metricsRoute = async (app: FastifyInstance) => {
  // Prometheus /metrics endpoint.
  // Заменяет metricsFactory() из @lidofinance/next-pages.
  app.get('/api/metrics', async (_req, reply) => {
    const content = await Metrics.registry.metrics();
    return reply
      .header('content-type', Metrics.registry.contentType)
      .send(content);
  });
};
