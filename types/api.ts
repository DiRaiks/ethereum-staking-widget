import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Generic Fastify route handler type.
 * Replaces the old Next.js `API` type from Next.js.
 */
export type API<T = void> = (
  req: FastifyRequest,
  res: FastifyReply,
) => Promise<T>;
