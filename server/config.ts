/**
 * Server-side config for Fastify server.
 * Replaces `next/config` → `serverRuntimeConfig` pattern from Next.js.
 * Reads directly from process.env — no framework dependency.
 */

import { toBoolean } from 'config/helpers';

const splitRpcUrls = (raw: string | undefined): [string, ...string[]] => {
  const urls = raw?.split(',').filter(Boolean) ?? [];
  return urls as [string, ...string[]];
};

export const serverConfig = {
  port: Number(process.env.PORT) || 3000,

  // Chains
  defaultChain: Number(process.env.DEFAULT_CHAIN) || 560048,

  // ETH RPC URLs — array, first is primary
  rpcUrls_1: splitRpcUrls(process.env.EL_RPC_URLS_1),
  rpcUrls_17000: splitRpcUrls(process.env.EL_RPC_URLS_17000),
  rpcUrls_560048: splitRpcUrls(process.env.EL_RPC_URLS_560048),
  rpcUrls_11155111: splitRpcUrls(process.env.EL_RPC_URLS_11155111),

  // L2 RPC URLs
  rpcUrls_10: splitRpcUrls(process.env.EL_RPC_URLS_10),
  rpcUrls_11155420: splitRpcUrls(process.env.EL_RPC_URLS_11155420),
  rpcUrls_1868: splitRpcUrls(process.env.EL_RPC_URLS_1868),
  rpcUrls_1946: splitRpcUrls(process.env.EL_RPC_URLS_1946),
  rpcUrls_130: splitRpcUrls(process.env.EL_RPC_URLS_130),
  rpcUrls_1301: splitRpcUrls(process.env.EL_RPC_URLS_1301),

  // CSP
  cspTrustedHosts: process.env.CSP_TRUSTED_HOSTS ?? '',
  cspReportUri: process.env.CSP_REPORT_URI ?? '',
  cspReportOnly: toBoolean(process.env.CSP_REPORT_ONLY),

  // Rate limiting
  rateLimit: Number(process.env.RATE_LIMIT) || 100,
  rateLimitTimeFrame: Number(process.env.RATE_LIMIT_TIME_FRAME) || 60,

  // External APIs
  ethAPIBasePath: process.env.ETH_API_BASE_PATH ?? '',
  rewardsBackendAPI: process.env.REWARDS_BACKEND ?? '',
  validationAPI: process.env.VALIDATION_SERVICE_BASE_PATH ?? '',
  validationFilePath: process.env.VALIDATION_FILE_PATH ?? '',

  // Feature flags
  collectMetrics: process.env.COLLECT_METRICS === 'true',
  runStartupChecks: process.env.RUN_STARTUP_CHECKS === 'true',
  developmentMode: process.env.NODE_ENV !== 'production',
  ipfsMode: process.env.IPFS_MODE === 'true',

  // Cache-control header для статических страниц (из next.config.mjs)
  cacheDefaultHeaders:
    'public, max-age=15, s-max-age=30, stale-if-error=604800, stale-while-revalidate=172800',

  // RPC validation settings
  providerMaxBatch: Number(process.env.PROVIDER_MAX_BATCH) || 20,

  // Base path
  basePath: process.env.BASE_PATH ?? '',

  // Manifest override (for testing)
  manifestOverride: process.env.MANIFEST_OVERRIDE ?? '',
} as const;

// Dynamic rpcUrls lookup по chainId (для RPC handler)
export const getRpcUrlsByChainId = (
  chainId: number | string,
): string[] | undefined => {
  const key = `rpcUrls_${chainId}` as keyof typeof serverConfig;
  const value = serverConfig[key];
  if (Array.isArray(value)) return value as string[];
  return undefined;
};
