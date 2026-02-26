/**
 * /api/earn/vaults-apr — агрегатор APR данных по vault-ам.
 * Заменяет pages/api/earn/vaults-apr.ts.
 *
 * Бизнес-логика перенесена без изменений.
 * Только обёртка Next.js → Fastify.
 */

import type { FastifyInstance } from 'fastify';
import { Cache, type CacheClass } from 'memory-cache';
import type { Address } from 'viem';

import { config } from 'config/get-config';
import { CHAINS } from 'consts/chains';
import { getExternalConfig } from 'utilsApi/get-external-config';
import { fetchWithCache, responseTimeExternalMetricWrapper } from 'utilsApi';
import { fetchSTGStatsApr } from 'features/earn/vault-stg/utils';
import { getGGVApy } from 'features/earn/vault-ggv/utils';
import { fetchDVVStatsApr } from 'features/earn/vault-dvv/utils';
import {
  type EarnVaultConfigEntry,
  type VaultAPYType,
  type Manifest,
} from 'config/external-config/types';
import { getContractAddress } from 'config/networks/contract-address';
import LocalManifestRaw from 'IPFS.json';
import { DVV_STATS_ORIGIN } from 'features/earn/vault-dvv/consts.server';
import { STG_STATS_ORIGIN } from 'features/earn/vault-stg/consts.server';
import { GGV_STATS_ORIGIN } from 'features/earn/vault-ggv/consts.server';

const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const FAILURE_CACHE_TTL = 10 * 1000;

const LocalManifest = LocalManifestRaw as unknown as Manifest;
const vaultsFromLocalManifest =
  LocalManifest[CHAINS.Mainnet]?.config?.earnVaults ?? [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const caches: Record<string, CacheClass<string, any>> = {};
const cacheKeys: Record<string, string> = {};
const cacheTTL: Record<string, number> = {};

vaultsFromLocalManifest.forEach((vault) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caches[vault.name] = new Cache<string, any>();
  cacheKeys[vault.name] = `${vault.name}-apr`;
  cacheTTL[vault.name] = DEFAULT_CACHE_TTL;
});

const fetchers: {
  [key: string]: (vault: EarnVaultConfigEntry) => Promise<{ apr: number }>;
} = {
  ggv: async () => {
    const ggvVaultAddress = getContractAddress(
      CHAINS.Mainnet,
      'ggvVault',
    ) as Address;

    const manifestConfig = await getExternalConfig();
    const ggvApyType = manifestConfig?.config?.earnVaults?.find(
      (v) => v.name === 'ggv',
    )?.apy?.type as VaultAPYType;

    return { apr: await getGGVApy(ggvVaultAddress, ggvApyType) };
  },
  dvv: async () => ({ apr: await fetchDVVStatsApr() }),
  strategy: async () => ({ apr: await fetchSTGStatsApr() }),
};

const fetchUrlsForMetrics: Record<string, string> = {
  ggv: GGV_STATS_ORIGIN,
  dvv: DVV_STATS_ORIGIN,
  strategy: STG_STATS_ORIGIN,
};

export const vaultsAprRoute = async (app: FastifyInstance) => {
  app.get('/api/earn/vaults-apr', async (_req, reply) => {
    const manifestConfig = await getExternalConfig();
    const vaultsFromConfig = manifestConfig?.config?.earnVaults ?? [];
    const vaults = vaultsFromConfig.filter((v) => v.name in fetchers);

    const fetchPromises = vaults.map((vault) => {
      if (!caches[vault.name]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        caches[vault.name] = new Cache<string, any>();
        cacheKeys[vault.name] = `${vault.name}-apr`;
        cacheTTL[vault.name] = DEFAULT_CACHE_TTL;
      }
      return fetchWithCache({
        cacheKey: cacheKeys[vault.name],
        cacheTTL: cacheTTL[vault.name],
        failureTTL: FAILURE_CACHE_TTL,
        cache: caches[vault.name],
        fetcher: async () =>
          responseTimeExternalMetricWrapper({
            payload: fetchUrlsForMetrics[vault.name],
            request: () => fetchers[vault.name](vault as EarnVaultConfigEntry),
          }),
      });
    });

    const settledPromises = await Promise.allSettled(fetchPromises);

    const data: Record<
      string,
      { apr: number | undefined; timestamp: number | undefined } | number
    > = { maxValue: 0 };
    let maxApr = 0;

    settledPromises.forEach((promise, index) => {
      const name = vaults[index].name;
      if (promise.status === 'fulfilled') {
        const fetchedCachedResult = promise.value;
        const apr = fetchedCachedResult?.value.apr;
        if (apr !== undefined && apr > maxApr) {
          maxApr = apr;
        }
        data[name] = {
          apr,
          timestamp: fetchedCachedResult?.timestamp,
        };
      }
    });
    data.maxValue = maxApr;

    return reply.header('x-cache-control', config.CACHE_DEFAULT_HEADERS).send({
      data,
      meta: { resTimestamp: Math.floor(Date.now() / 1000) },
    });
  });
};
