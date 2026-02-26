/**
 * Fastify-версия cached-proxy из utilsApi/cached-proxy.ts.
 * Та же логика кэширования и проксирования, но без Next.js типов.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { Cache } from 'memory-cache';
import { responseTimeExternalMetricWrapper } from 'utilsApi/fetchApiWrapper';
import { standardFetcher } from 'utils/standardFetcher';
import { FetcherError } from 'utils/fetcherError';

type FastifyProxyOptions = {
  proxyUrl: string | ((req: FastifyRequest) => Promise<string>);
  cacheTTL: number;
  timeout?: number;
  ignoreParams?: boolean;
  transformData?: (data: unknown) => unknown;
  metricsHost?: string;
};

export const createFastifyCachedProxy = ({
  cacheTTL,
  proxyUrl,
  ignoreParams,
  timeout = 5000,
  transformData = (data) => data,
  metricsHost,
}: FastifyProxyOptions) => {
  const cache = new Cache<string, unknown>();

  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = req.query as Record<string, string | string[]>;

    const params =
      ignoreParams || Object.keys(query).length === 0
        ? null
        : new URLSearchParams(
            Object.entries(query).reduce(
              (obj, [k, v]) => {
                if (typeof v === 'string') obj[k] = v;
                return obj;
              },
              {} as Record<string, string>,
            ),
          );

    const proxyUrlString =
      typeof proxyUrl === 'function' ? await proxyUrl(req) : proxyUrl;

    const cacheKey = `${proxyUrlString}-${params?.toString() ?? ''}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return reply.send(cached);
    }

    const url = proxyUrlString + (params ? `?${params.toString()}` : '');

    try {
      const data = await responseTimeExternalMetricWrapper({
        payload: metricsHost ?? proxyUrlString,
        request: () =>
          standardFetcher(url, {
            signal: AbortSignal.timeout(timeout),
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          }),
      });

      const result = transformData(data) ?? data;
      cache.put(cacheKey, result, cacheTTL);
      return reply.send(result);
    } catch (e) {
      if (e instanceof FetcherError && e.status >= 400 && e.status < 500) {
        return reply.code(e.status).send({ error: e.message });
      }
      req.log.warn({ err: e, url }, '[CachedProxy] Failed to proxy');
      return reply.code(500).send({ error: 'Proxy error' });
    }
  };
};
