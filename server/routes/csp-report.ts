import type { FastifyInstance } from 'fastify';

export const cspReportRoute = async (app: FastifyInstance) => {
  app.post('/api/csp-report', async (req, reply) => {
    let violation: Record<string, unknown> = {};

    if (req.body && typeof req.body === 'object') {
      violation = req.body as Record<string, unknown>;
    } else if (typeof req.body === 'string') {
      try {
        violation = JSON.parse(req.body);
      } catch {
        // тело не JSON — логируем как есть
        violation = { raw: req.body };
      }
    }

    req.log.warn({ type: 'CSP Violation', ...violation });
    return reply.send({ status: 'ok' });
  });
};
