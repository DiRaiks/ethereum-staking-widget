/**
 * Fastify plugin для сбора Prometheus метрик времени ответа.
 * Заменяет responseTimeMetric() wrapper из utilsApi/nextApiWrappers.ts.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { getStatusLabel } from '@lidofinance/api-metrics';
import Metrics from 'utilsApi/metrics';

export const metricsPlugin = fp(async (app: FastifyInstance) => {
  app.addHook('onResponse', async (req, reply) => {
    // routeOptions.url содержит шаблон маршрута (напр. '/api/rpc'),
    // а не реальный URL с параметрами
    const route = req.routeOptions?.url ?? req.url ?? 'unknown';

    // Только API маршруты
    if (!route.startsWith('/api/')) return;

    const status = getStatusLabel(reply.statusCode); // '2xx', '4xx', '5xx'
    const duration = reply.elapsedTime / 1000; // Histogram ожидает секунды

    Metrics.request.apiTimings.observe({ route, status }, duration);
  });
});
