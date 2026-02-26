/**
 * GET /runtime/window-env.js — публичный runtime конфиг для клиента.
 *
 * Заменяет scripts/build-dynamics.mjs, который генерировал
 * public/runtime/window-env.js при сборке Next.js.
 *
 * Теперь файл генерируется динамически при каждом запросе, что позволяет
 * инжектировать env-переменные в Docker-контейнер без пересборки образа.
 *
 * Содержит ТОЛЬКО публичные переменные (не секреты).
 * RPC URLs, CSP ключи и прочие секреты НЕ попадают сюда.
 */

import type { FastifyInstance } from 'fastify';

const toBoolean = (val: string | undefined): boolean =>
  val?.toLowerCase() === 'true' || val === '1';

/**
 * Генерирует содержимое window.__env__ из текущего process.env.
 * Структура повторяет env-dynamics.mjs — клиентский код читает оттуда же.
 */
const generateWindowEnv = (): string => {
  const env = {
    ipfsMode: toBoolean(process.env.IPFS_MODE),

    // Origins (публичные URL без секретов)
    selfOrigin: process.env.SELF_ORIGIN || 'https://stake.lido.fi',
    rootOrigin: process.env.ROOT_ORIGIN || 'https://lido.fi',
    docsOrigin: process.env.DOCS_ORIGIN || 'https://docs.lido.fi',
    helpOrigin: process.env.HELP_ORIGIN || 'https://help.lido.fi',
    researchOrigin: process.env.RESEARCH_ORIGIN || 'https://research.lido.fi',
    blogOrigin: process.env.BLOG_ORIGIN || 'https://blog.lido.fi',

    // Chains
    defaultChain: parseInt(process.env.DEFAULT_CHAIN || '560048', 10),
    supportedChains: process.env.SUPPORTED_CHAINS
      ? process.env.SUPPORTED_CHAINS.split(',').map(Number)
      : [560048],

    // Manifest override (for testing/staging)
    manifestOverride: process.env.MANIFEST_OVERRIDE,

    // Prefill unsafe RPC URLs (only for dev/QA — never for production)
    prefillUnsafeElRpcUrls1:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_1?.split(',') ?? [],
    prefillUnsafeElRpcUrls17000:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_17000?.split(',') ?? [],
    prefillUnsafeElRpcUrls560048:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_560048?.split(',') ?? [],
    prefillUnsafeElRpcUrls11155111:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_11155111?.split(',') ?? [],
    prefillUnsafeElRpcUrls10:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_10?.split(',') ?? [],
    prefillUnsafeElRpcUrls11155420:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_11155420?.split(',') ?? [],
    prefillUnsafeElRpcUrls1868:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_1868?.split(',') ?? [],
    prefillUnsafeElRpcUrls1946:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_1946?.split(',') ?? [],
    prefillUnsafeElRpcUrls130:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_130?.split(',') ?? [],
    prefillUnsafeElRpcUrls1301:
      process.env.PREFILL_UNSAFE_EL_RPC_URLS_1301?.split(',') ?? [],

    // Feature flags
    enableQaHelpers: toBoolean(process.env.ENABLE_QA_HELPERS),

    // External service URLs (публичные — не секреты)
    walletconnectProjectId: process.env.WALLETCONNECT_PROJECT_ID,
    matomoHost: process.env.MATOMO_URL,
    ethAPIBasePath: process.env.ETH_API_BASE_PATH,
    wqAPIBasePath: process.env.WQ_API_BASE_PATH,
    rewardsBackendBasePath: process.env.REWARDS_BACKEND_BASE_PATH,

    // Devnet overrides (JSON string for local dev)
    devnetOverrides: process.env.DEVNET_OVERRIDES,

    // Derived flags (не секреты, вычисляются из наличия vars)
    addressApiValidationEnabled: !!process.env.VALIDATION_SERVICE_BASE_PATH,
    validationFilePath: process.env.VALIDATION_FILE_PATH,
  };

  return `window.__env__=${JSON.stringify(env)}`;
};

export const windowEnvRoute = async (app: FastifyInstance) => {
  app.get('/runtime/window-env.js', async (_req, reply) => {
    return (
      reply
        .header('content-type', 'application/javascript; charset=utf-8')
        // no-store: всегда генерируем актуальный конфиг (Docker env может меняться)
        .header('cache-control', 'no-store')
        .send(generateWindowEnv())
    );
  });
};
