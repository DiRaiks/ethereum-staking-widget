import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import { resolve as pathResolve, dirname as pathDirname } from 'node:path';
import { fileURLToPath } from 'url';

import { serverConfig } from './config';
import { registerMiddlewareHooks } from './middleware/hooks';
import { registerRoutes } from './routes';
import { startupCheckRPCs } from './startup-checks/rpc';
import { startupCheckValidationFile } from './startup-checks/validation-file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
    trustProxy: true, // корректный IP при rate limiting за nginx/CDN
  });

  // ── Security headers (заменяет next-secure-headers) ──────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // управляем вручную в middleware/csp.ts
    hsts: {
      maxAge: 63_072_000, // 2 года
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'same-origin' },
  });

  // ── CORS ──────────────────────────────────────────────────────────────────
  await app.register(fastifyCors, {
    origin: true, // отражает Origin запроса; точный список — в роутах при необходимости
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // ── Rate limiting (заменяет @lidofinance/next-ip-rate-limit) ─────────────
  await app.register(fastifyRateLimit, {
    max: serverConfig.rateLimit,
    timeWindow: serverConfig.rateLimitTimeFrame * 1000, // в миллисекундах
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry in ${context.after}`,
    }),
  });

  // ── Custom middleware hooks ───────────────────────────────────────────────
  registerMiddlewareHooks(app);

  // ── API routes ───────────────────────────────────────────────────────────
  await registerRoutes(app);

  // ── Serve SPA static files ───────────────────────────────────────────────
  // dist/ генерируется командой `yarn build:client`
  const distPath = pathResolve(__dirname, '../dist');
  await app.register(fastifyStatic, {
    root: distPath,
    prefix: '/',
    decorateReply: false,
    // не кидать ошибку если dist/ не существует (в dev режиме)
    allowedPath: () => true,
  });

  // SPA fallback: любой не-API маршрут → index.html
  app.setNotFoundHandler(async (req, reply) => {
    if (req.url.startsWith('/api/')) {
      return reply.code(404).send({ statusCode: 404, error: 'Not Found' });
    }
    try {
      return reply.sendFile('index.html');
    } catch {
      // dist/ ещё не собран (dev режим без client build)
      return reply.code(200).send('SPA not built yet. Run `yarn build:client`');
    }
  });

  return app;
};

// ── Entry point ───────────────────────────────────────────────────────────
const start = async () => {
  const app = await buildApp();

  try {
    await app.listen({
      port: serverConfig.port,
      host: '0.0.0.0',
    });

    app.log.info(`Server listening on port ${serverConfig.port}`);

    // Startup checks запускаются после старта сервера (не блокируют)
    if (serverConfig.runStartupChecks) {
      void Promise.all([
        startupCheckRPCs(serverConfig),
        startupCheckValidationFile(serverConfig.validationFilePath),
      ]).catch((err) => app.log.error({ err }, 'Startup checks failed'));
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
