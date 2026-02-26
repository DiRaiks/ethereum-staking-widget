/**
 * Global Fastify hooks — заменяют server.mjs cache-control override
 * и глобальные middleware из Next.js.
 */

import type { FastifyInstance } from 'fastify';
import { serverConfig } from '../config';
import { buildCspHeader } from './csp';

export const registerMiddlewareHooks = (app: FastifyInstance) => {
  // ── Cache-Control override ─────────────────────────────────────────────
  // Логика из server.mjs: если роут выставил x-cache-control,
  // подменяем им стандартный cache-control и удаляем служебный заголовок.
  app.addHook('onSend', async (_req, reply, _payload) => {
    const customCache = reply.getHeader('x-cache-control') as
      | string
      | undefined;
    if (customCache) {
      void reply.removeHeader('cache-control');
      void reply.header('cache-control', customCache);
      void reply.removeHeader('x-cache-control');
    }
  });

  // ── CSP Header (для non-IPFS режима) ──────────────────────────────────
  // В IPFS режиме CSP задаётся через <meta> тег в index.html
  app.addHook('onSend', async (req, reply, _payload) => {
    if (serverConfig.ipfsMode) return;

    // Не добавляем CSP к статическим ассетам (картинки, js, css)
    const isStaticAsset = /\.(js|css|png|jpg|svg|ico|woff2?)$/i.test(req.url);
    if (isStaticAsset) return;

    const cspHeader = buildCspHeader({
      trustedHosts: serverConfig.cspTrustedHosts,
      reportUri: serverConfig.cspReportUri,
      reportOnly: serverConfig.cspReportOnly,
    });

    const headerName = serverConfig.cspReportOnly
      ? 'content-security-policy-report-only'
      : 'content-security-policy';

    void reply.header(headerName, cspHeader);
  });

  // ── Global error handler ───────────────────────────────────────────────
  app.setErrorHandler(
    async (
      error: Error & { status?: number; statusCode?: number },
      req,
      reply,
    ) => {
      const status = error.status ?? error.statusCode ?? 500;

      req.log.error({ err: error, url: req.url }, 'Request error');

      if (reply.sent) return;

      return reply.code(status).send({
        statusCode: status,
        error: error.name ?? 'Internal Server Error',
        message: error.message || 'Internal Server Error',
      });
    },
  );
};
