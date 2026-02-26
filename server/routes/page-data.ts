/**
 * /api/page-data — новый endpoint, заменяет getStaticProps со всех страниц.
 *
 * Возвращает:
 * - ___prefetch_manifest___ — внешний манифест (feature flags, конфиги)
 * - __validation_file__ — список адресов для sanctions check
 *
 * Кэшируется на сервере с TTL = DEFAULT_REVALIDATION (аналог ISR).
 */

import type { FastifyInstance } from 'fastify';
import { Cache } from 'memory-cache';

import { fetchExternalManifest } from 'utilsApi/fetch-external-manifest';
import { loadValidationFile } from 'utilsApi/load-validation-file';
import { config } from 'config';

const CACHE_KEY = 'page-data';
// TTL берём из конфига (то же значение что было в revalidate getStaticProps)
const CACHE_TTL = config.DEFAULT_REVALIDATION * 1000;

const cache = new Cache<string, unknown>();

const loadPageData = async () => {
  const [manifest, validationFile] = await Promise.all([
    fetchExternalManifest(),
    loadValidationFile(),
  ]);

  return {
    ___prefetch_manifest___: manifest.___prefetch_manifest___,
    __validation_file__: validationFile,
  };
};

export const pageDataRoute = async (app: FastifyInstance) => {
  app.get('/api/page-data', async (_req, reply) => {
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return reply
        .header(
          'x-cache-control',
          // Совпадает с ISR: s-max-age = revalidate, stale-while-revalidate = 2 дня
          `public, max-age=15, s-max-age=${config.DEFAULT_REVALIDATION}, stale-if-error=604800, stale-while-revalidate=172800`,
        )
        .send(cached);
    }

    const data = await loadPageData();
    cache.put(CACHE_KEY, data, CACHE_TTL);

    return reply
      .header(
        'x-cache-control',
        `public, max-age=15, s-max-age=${config.DEFAULT_REVALIDATION}, stale-if-error=604800, stale-while-revalidate=172800`,
      )
      .send(data);
  });
};
