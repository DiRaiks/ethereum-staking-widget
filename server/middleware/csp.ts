/**
 * CSP header builder — заменяет next-secure-headers + withSecureHeaders.
 * Логика перенесена из config/csp/index.ts без зависимости от Next.js.
 */

type CspOptions = {
  trustedHosts: string;
  reportUri: string;
  reportOnly: boolean;
  developmentMode?: boolean;
  ipfsMode?: boolean;
};

const buildDirectiveValue = (values: string[]): string => values.join(' ');

export const buildCspHeader = ({
  trustedHosts,
  reportUri,
  reportOnly: _reportOnly,
  developmentMode = false,
  ipfsMode = false,
}: CspOptions): string => {
  const trusted = trustedHosts
    ? trustedHosts.split(',').map((h) => h.trim())
    : [];

  const directives: Record<string, string[] | false> = {
    'default-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'font-src': ["'self'", 'data:'],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.walletconnect.org',
      'https://*.walletconnect.com',
    ],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      ...(developmentMode ? ["'unsafe-eval'"] : []),
      ...trusted,
    ],
    'connect-src': [
      "'self'",
      'https:',
      'wss:',
      ...(developmentMode ? ['ws:'] : []),
    ],
    'child-src': [
      "'self'",
      'https://*.walletconnect.org',
      'https://*.walletconnect.com',
    ],
    'worker-src': ["'none'"],
    // frame-ancestors и report-uri не работают в <meta> теге (IPFS),
    // поэтому добавляем только в HTTP заголовках
    ...(!ipfsMode && {
      'frame-ancestors': ['*'],
      ...(reportUri ? { 'report-uri': [reportUri] } : {}),
    }),
    ...(!ipfsMode && { 'base-uri': ["'none'"] }),
  };

  return Object.entries(directives)
    .filter(([, value]) => value !== false && value.length > 0)
    .map(([key, value]) => `${key} ${buildDirectiveValue(value as string[])}`)
    .join('; ');
};
