/**
 * Регистрация всех API маршрутов Fastify.
 * Заменяет pages/api/ из Next.js.
 */

import type { FastifyInstance } from 'fastify';
import { metricsPlugin } from '../middleware/metrics-plugin';
import { healthRoute } from './health';
import { cspReportRoute } from './csp-report';
import { metricsRoute } from './metrics';
import { rewardsRoute } from './rewards';
import { validationRoute } from './validation';
import { rpcRoute } from './rpc';
import { vaultsAprRoute } from './earn/vaults-apr';
import { vaultsTvlRoute } from './earn/vaults-tvl';
import { pageDataRoute } from './page-data';
import { windowEnvRoute } from './window-env';

export const registerRoutes = async (app: FastifyInstance) => {
  // Metrics collection plugin (timing per route)
  await app.register(metricsPlugin);

  // Health & monitoring
  await app.register(healthRoute);
  await app.register(metricsRoute);

  // Security
  await app.register(cspReportRoute);

  // Data proxies
  await app.register(rewardsRoute);
  await app.register(validationRoute);

  // RPC proxy (самый сложный)
  await app.register(rpcRoute);

  // Earn vaults data
  await app.register(vaultsAprRoute);
  await app.register(vaultsTvlRoute);

  // Page data (заменяет getStaticProps)
  await app.register(pageDataRoute);

  // Runtime window env (заменяет build-time scripts/build-dynamics.mjs)
  await app.register(windowEnvRoute);
};
