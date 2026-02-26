/**
 * Vite конфиг для IPFS сборки.
 * Аналог: IPFS_MODE=true yarn build && next export
 *
 * Ключевые отличия от обычной сборки:
 * - base: './'           → относительные пути к ассетам (assetPrefix: './')
 * - outDir: 'dist-ipfs'
 * - IPFS_MODE=true       → runtime флаг для условной логики
 * - window.__env__ inline → нет сервера чтобы отдать /runtime/window-env.js
 * - CSP meta tag         → нет HTTP заголовков, CSP только через <meta>
 */

import { defineConfig, mergeConfig } from 'vite';
import type { UserConfig } from 'vite';
import baseConfig from './vite.config';

// ── Читаем env-переменные на момент сборки ────────────────────────────────
// В IPFS режиме конфиг «запечён» в бандл — Docker runtime env не применима
const buildTimeEnv = {
  ipfsMode: true,
  selfOrigin: process.env.SELF_ORIGIN || 'https://stake.lido.fi',
  rootOrigin: process.env.ROOT_ORIGIN || 'https://lido.fi',
  docsOrigin: process.env.DOCS_ORIGIN || 'https://docs.lido.fi',
  helpOrigin: process.env.HELP_ORIGIN || 'https://help.lido.fi',
  researchOrigin: process.env.RESEARCH_ORIGIN || 'https://research.lido.fi',
  blogOrigin: process.env.BLOG_ORIGIN || 'https://blog.lido.fi',
  defaultChain: parseInt(process.env.DEFAULT_CHAIN || '1', 10),
  supportedChains: process.env.SUPPORTED_CHAINS
    ? process.env.SUPPORTED_CHAINS.split(',').map(Number)
    : [1],
  manifestOverride: process.env.MANIFEST_OVERRIDE,
  prefillUnsafeElRpcUrls1: [],
  prefillUnsafeElRpcUrls17000: [],
  prefillUnsafeElRpcUrls560048: [],
  prefillUnsafeElRpcUrls11155111: [],
  prefillUnsafeElRpcUrls10: [],
  prefillUnsafeElRpcUrls11155420: [],
  prefillUnsafeElRpcUrls1868: [],
  prefillUnsafeElRpcUrls1946: [],
  prefillUnsafeElRpcUrls130: [],
  prefillUnsafeElRpcUrls1301: [],
  enableQaHelpers: false,
  walletconnectProjectId: process.env.WALLETCONNECT_PROJECT_ID,
  matomoHost: process.env.MATOMO_URL,
  ethAPIBasePath: process.env.ETH_API_BASE_PATH,
  wqAPIBasePath: process.env.WQ_API_BASE_PATH,
  rewardsBackendBasePath: process.env.REWARDS_BACKEND_BASE_PATH,
  devnetOverrides: process.env.DEVNET_OVERRIDES,
  addressApiValidationEnabled: false, // нет validation сервиса в IPFS
  validationFilePath: undefined,
};

// ── IPFS CSP: frame-ancestors и report-uri не работают в <meta> ────────────
const ipfsCsp = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.walletconnect.org https://*.walletconnect.com",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https: wss:",
  "child-src 'self' https://*.walletconnect.org https://*.walletconnect.com",
  "worker-src 'none'",
].join('; ');

const ipfsConfig: UserConfig = defineConfig({
  base: './', // все пути относительные — для IPFS hash-based routing

  define: {
    'process.env.IPFS_MODE': JSON.stringify('true'),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },

  build: {
    outDir: 'dist-ipfs',
    sourcemap: false,
  },

  plugins: [
    {
      name: 'ipfs-html-transforms',
      transformIndexHtml(html: string) {
        // 1. Заменяем <script src="/runtime/window-env.js"> на inline window.__env__
        //    В IPFS нет сервера — env должен быть «запечён» в HTML при сборке
        html = html.replace(
          /<script src="\/runtime\/window-env\.js"><\/script>/,
          `<script>window.__env__=${JSON.stringify(buildTimeEnv)}</script>`,
        );

        // 2. Инжектируем CSP через <meta> (единственный способ в IPFS)
        const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${ipfsCsp}" />`;
        html = html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    ${cspMeta}`,
        );

        // 3. Вставляем IPFS base URL detection script (аналог InsertIpfsBaseScript)
        //    Скрипт определяет base URL из текущего location на IPFS-гейтвее
        const ipfsBaseScript = `<script>
  (function() {
    var path = window.location.pathname;
    var base = path.substring(0, path.lastIndexOf('/') + 1);
    if (base && base !== '/') {
      var el = document.createElement('base');
      el.setAttribute('href', base);
      document.head.insertBefore(el, document.head.firstChild);
    }
  })();
</script>`;
        html = html.replace('</head>', ipfsBaseScript + '\n  </head>');

        return html;
      },
    },
  ],
});

// Мерджим с базовым конфигом — IPFS настройки имеют приоритет
export default mergeConfig(baseConfig, ipfsConfig);
