import { toBoolean } from './helpers';

// In the Vite SPA build, server secrets are managed by server/config.ts (Fastify).
// This file provides a process.env-based fallback for compatibility.
// On the client side, all these values will be undefined (which is correct — secrets
// should never be exposed to the browser).

const splitRpcUrls = (val: string | undefined): [string, ...string[]] =>
  (val?.split(',') ?? []) as [string, ...string[]];

export type SecretConfigType = {
  defaultChain: number;
  devnetOverrides: string;

  rpcUrls_1: [string, ...string[]];
  rpcUrls_17000: [string, ...string[]];
  rpcUrls_560048: [string, ...string[]];
  rpcUrls_11155111: [string, ...string[]];
  rpcUrls_10: [string, ...string[]];
  rpcUrls_11155420: [string, ...string[]];
  rpcUrls_1868: [string, ...string[]];
  rpcUrls_1946: [string, ...string[]];
  rpcUrls_130: [string, ...string[]];
  rpcUrls_1301: [string, ...string[]];
  [key: `rpcUrls_${number}`]: string[];

  cspTrustedHosts: string | undefined;
  cspReportUri: string | undefined;
  cspReportOnly: boolean;

  rateLimit: number;
  rateLimitTimeFrame: number;

  ethAPIBasePath: string | undefined;
  rewardsBackendAPI: string | undefined;
  validationAPI: string | undefined;
  validationFilePath: string | undefined;
};

export const getSecretConfig = (): SecretConfigType => {
  const env = process.env;
  return {
    defaultChain: Number(env.DEFAULT_CHAIN) || 560048,
    devnetOverrides: env.DEVNET_OVERRIDES ?? '',

    rpcUrls_1: splitRpcUrls(env.EL_RPC_URLS_1),
    rpcUrls_17000: splitRpcUrls(env.EL_RPC_URLS_17000),
    rpcUrls_560048: splitRpcUrls(env.EL_RPC_URLS_560048),
    rpcUrls_11155111: splitRpcUrls(env.EL_RPC_URLS_11155111),
    rpcUrls_10: splitRpcUrls(env.EL_RPC_URLS_10),
    rpcUrls_11155420: splitRpcUrls(env.EL_RPC_URLS_11155420),
    rpcUrls_1868: splitRpcUrls(env.EL_RPC_URLS_1868),
    rpcUrls_1946: splitRpcUrls(env.EL_RPC_URLS_1946),
    rpcUrls_130: splitRpcUrls(env.EL_RPC_URLS_130),
    rpcUrls_1301: splitRpcUrls(env.EL_RPC_URLS_1301),

    cspTrustedHosts: env.CSP_TRUSTED_HOSTS,
    cspReportUri: env.CSP_REPORT_URI,
    cspReportOnly: toBoolean(env.CSP_REPORT_ONLY),

    rateLimit: Number(env.RATE_LIMIT) || 100,
    rateLimitTimeFrame: Number(env.RATE_LIMIT_TIME_FRAME) || 60,

    ethAPIBasePath: env.ETH_API_BASE_PATH,
    rewardsBackendAPI: env.REWARDS_BACKEND_API,
    validationAPI: env.VALIDATION_API,
    validationFilePath: env.VALIDATION_FILE_PATH,
  };
};

export const secretConfig = getSecretConfig();
