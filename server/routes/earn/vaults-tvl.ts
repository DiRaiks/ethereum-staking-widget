/**
 * /api/earn/vaults-tvl — TVL агрегатор по vault-ам через blockchain вызовы.
 * Заменяет pages/api/earn/vaults-tvl.ts.
 *
 * Бизнес-логика перенесена без изменений.
 * Только обёртка Next.js → Fastify.
 */

import type { FastifyInstance } from 'fastify';
import { Cache, type CacheClass } from 'memory-cache';
import { createPublicClient, http, fallback } from 'viem';
import { mainnet } from 'viem/chains';
import { LidoSDKWrap } from '@lidofinance/lido-ethereum-sdk/wrap';

import { serverConfig } from '../../config';
import { config } from 'config';
import { CHAINS } from 'consts/chains';
import { getExternalConfig } from 'utilsApi/get-external-config';
import { fetchWithCache } from 'utilsApi';
import type { Manifest } from 'config/external-config/types';

import {
  getGGVAccountantContract,
  getGGVLensContract,
  getGGVVaultContract,
} from 'features/earn/vault-ggv/contracts';
import {
  getSTGCollectorContract,
  getSTGVaultContract,
} from 'features/earn/vault-stg/contracts';
import { STG_COLLECTOR_CONFIG } from 'features/earn/vault-stg/consts';
import type { STGCollectResponse } from 'features/earn/vault-stg/hooks/use-stg-collect';
import { getDVVVaultContract } from 'features/earn/vault-dvv/contracts';
import LocalManifestRaw from 'IPFS.json';

const DEFAULT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
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
  cacheKeys[vault.name] = `${vault.name}-tvl`;
  cacheTTL[vault.name] = DEFAULT_CACHE_TTL;
});

const fetchers: {
  [key: string]: () => Promise<{ tvlEthWei: string }>;
} = {
  dvv: async () => {
    const chain = mainnet;
    const publicClientMainnet = createPublicClient({
      chain,
      transport: fallback(serverConfig.rpcUrls_1.map((url) => http(url))),
    });

    const vault = getDVVVaultContract(publicClientMainnet);
    const tvlWsteth = await vault.read.totalAssets();

    const wrap = new LidoSDKWrap({
      chainId: chain.id,
      logMode: 'none',
      rpcProvider: publicClientMainnet,
    });

    const tvlSteth = await wrap.convertWstethToSteth(tvlWsteth);
    return { tvlEthWei: String(tvlSteth) };
  },

  ggv: async () => {
    const publicClientMainnet = createPublicClient({
      chain: mainnet,
      transport: fallback(serverConfig.rpcUrls_1.map((url) => http(url))),
    });

    const lens = getGGVLensContract(publicClientMainnet);
    const vault = getGGVVaultContract(publicClientMainnet);
    const accountant = getGGVAccountantContract(publicClientMainnet);

    const [, tvlWETH] = await lens.read.totalAssets([
      vault.address,
      accountant.address,
    ]);
    return { tvlEthWei: String(tvlWETH) };
  },

  strategy: async () => {
    const publicClientMainnet = createPublicClient({
      chain: mainnet,
      transport: fallback(serverConfig.rpcUrls_1.map((url) => http(url))),
    });

    const collector = getSTGCollectorContract(publicClientMainnet);
    const vaultContract = getSTGVaultContract(publicClientMainnet);

    const collectorResponse: STGCollectResponse = await collector.read.collect([
      '0x0000000000000000000000000000000000000000',
      vaultContract.address,
      STG_COLLECTOR_CONFIG,
    ]);

    return { tvlEthWei: String(collectorResponse.totalBase) };
  },
};

export const vaultsTvlRoute = async (app: FastifyInstance) => {
  app.get('/api/earn/vaults-tvl', async (_req, reply) => {
    const manifestConfig = await getExternalConfig();
    const vaultsFromConfig = manifestConfig?.config?.earnVaults ?? [];
    const vaults = vaultsFromConfig.filter((v) => v.name in fetchers);

    const fetchPromises = vaults.map((vault) => {
      if (!caches[vault.name]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        caches[vault.name] = new Cache<string, any>();
        cacheKeys[vault.name] = `${vault.name}-tvl`;
        cacheTTL[vault.name] = DEFAULT_CACHE_TTL;
      }
      return fetchWithCache({
        cacheKey: cacheKeys[vault.name],
        cacheTTL: cacheTTL[vault.name],
        failureTTL: FAILURE_CACHE_TTL,
        cache: caches[vault.name],
        fetcher: fetchers[vault.name],
      });
    });

    const settledPromises = await Promise.allSettled(fetchPromises);

    const data: Record<
      string,
      { tvlEthWei: string | undefined; timestamp: number | undefined }
    > = {};

    settledPromises.forEach((promise, index) => {
      const name = vaults[index].name;
      if (promise.status === 'fulfilled') {
        const fetchedCachedResult = promise.value;
        data[name] = {
          tvlEthWei: fetchedCachedResult?.value.tvlEthWei,
          timestamp: fetchedCachedResult?.timestamp,
        };
      }
    });

    return reply.header('x-cache-control', config.CACHE_DEFAULT_HEADERS).send({
      data,
      meta: { resTimestamp: Math.floor(Date.now() / 1000) },
    });
  });
};
