/**
 * /api/rpc — JSON-RPC proxy с валидацией.
 * Заменяет pages/api/rpc.ts.
 */

import type { FastifyInstance } from 'fastify';
import { handleRpc } from '../rpc/rpc-handler';

export const rpcRoute = async (app: FastifyInstance) => {
  app.post('/api/rpc', handleRpc);
};
