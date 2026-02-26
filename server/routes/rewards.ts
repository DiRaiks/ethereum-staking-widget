/**
 * /api/rewards — прокси к внешнему rewards backend.
 * Заменяет pages/api/rewards.ts.
 */

import type { FastifyInstance } from 'fastify';
import { serverConfig } from '../config';
import { createFastifyCachedProxy } from '../utils/cached-proxy';
import { config } from 'config';

export const rewardsRoute = async (app: FastifyInstance) => {
  if (!serverConfig.rewardsBackendAPI) {
    app.log.info(
      '[api/rewards] Skipped setup: rewardsBackendAPI is not configured',
    );
    app.get('/api/rewards', async (_req, reply) => {
      return reply.code(404).send({ error: 'Rewards API not configured' });
    });
    return;
  }

  const proxy = createFastifyCachedProxy({
    proxyUrl: serverConfig.rewardsBackendAPI + '/',
    cacheTTL: 1000,
    ignoreParams: false,
    metricsHost: serverConfig.rewardsBackendAPI,
    timeout: 10_000,
  });

  app.get(
    '/api/rewards',
    {
      config: { rateLimit: { max: serverConfig.rateLimit } },
    },
    async (req, reply) => {
      void reply.header('x-cache-control', config.CACHE_REWARDS_HEADERS);
      await proxy(req, reply);
    },
  );
};
