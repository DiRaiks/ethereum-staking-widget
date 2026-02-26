/**
 * /api/validation — прокси к сервису валидации адресов с SSRF-защитой.
 * Заменяет pages/api/validation.ts.
 */

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { isAddress } from 'viem';
import { serverConfig } from '../config';
import { createFastifyCachedProxy } from '../utils/cached-proxy';
import { getExternalConfig } from 'utilsApi/get-external-config';
import { config } from 'config';

// Валидация адреса — защита от SSRF-атак
const validateEthereumAddress = (address: unknown): string | null => {
  if (typeof address !== 'string' || !address) return null;
  if (!isAddress(address)) return null;
  return address.toLowerCase();
};

export const validationRoute = async (app: FastifyInstance) => {
  if (!serverConfig.validationAPI) {
    app.log.info(
      '[api/validation] Skipped setup: validationAPI is not configured',
    );
    app.get('/api/validation', async (_req, reply) => {
      return reply.code(404).send({ error: 'Validation API not configured' });
    });
    return;
  }

  const proxy = createFastifyCachedProxy({
    proxyUrl: async (req: FastifyRequest) => {
      const manifestConfig = await getExternalConfig();
      const version = manifestConfig?.config.api?.validation?.version ?? '1';

      const query = req.query as Record<string, string>;
      const validatedAddress = validateEthereumAddress(query.address);
      if (!validatedAddress) throw new Error('Invalid Ethereum address');

      return `${serverConfig.validationAPI}/v${version}/check/${validatedAddress}`;
    },
    cacheTTL: 1000,
    ignoreParams: true, // адрес уже в пути, не в query
    metricsHost: serverConfig.validationAPI,
    timeout: 10_000,
  });

  app.get('/api/validation', async (req, reply) => {
    const query = req.query as Record<string, string>;
    const validatedAddress = validateEthereumAddress(query.address);

    if (!validatedAddress) {
      return reply.code(400).send({
        error: 'Invalid Ethereum address',
        message: 'Address must be a valid checksummed Ethereum address',
      });
    }

    void reply.header('x-cache-control', config.CACHE_VALIDATION_HEADERS);
    await proxy(req, reply);
  });
};
