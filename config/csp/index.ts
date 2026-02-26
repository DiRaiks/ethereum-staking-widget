import type { ContentSecurityPolicyOption } from 'next-secure-headers/lib/rules';

// Don't use absolute import here!
// code'''
//    import { config, secretConfig } from 'config';
// '''
// otherwise you will get something like a cyclic error!
import { config } from '../get-config';
import { secretConfig } from '../get-secret-config';

const trustedHosts = secretConfig.cspTrustedHosts
  ? secretConfig.cspTrustedHosts.split(',')
  : [];

const developmentMode = process.env.NODE_ENV === 'development';

export const contentSecurityPolicy: ContentSecurityPolicyOption = {
  directives: {
    'default-src': ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'", 'data:'],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://*.walletconnect.org',
      'https://*.walletconnect.com',
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      ...(developmentMode ? ["'unsafe-eval'"] : []), // for HMR
      ...trustedHosts,
    ],

    // Allow fetch connections to any secure host
    connectSrc: [
      "'self'",
      'https:',
      'wss:',
      ...(developmentMode ? ['ws:'] : []), // for HMR
    ],

    ...(!config.ipfsMode && {
      // CSP directive 'frame-ancestors' is ignored when delivered via a <meta> element.
      // CSP directive 'report-uri' is ignored when delivered via a <meta> element.
      frameAncestors: ['*'],
      reportURI: secretConfig.cspReportUri,
    }),
    childSrc: [
      "'self'",
      'https://*.walletconnect.org',
      'https://*.walletconnect.com',
    ],
    workerSrc: ["'none'"],
    'base-uri': config.ipfsMode ? undefined : ["'none'"],
  },
  reportOnly: secretConfig.cspReportOnly,
};

// withCsp was a Next.js HOC – CSP is now handled by Fastify (server/middleware/csp.ts)
