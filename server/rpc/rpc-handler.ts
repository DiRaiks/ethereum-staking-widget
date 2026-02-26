/**
 * RPC proxy handler для Fastify.
 *
 * Заменяет связку rpcFactory(@lidofinance/next-pages) + trackedFetchRpcFactory(@lidofinance/api-rpc).
 *
 * Реализует:
 * - Whitelist RPC методов
 * - Whitelist адресов контрактов (eth_call / eth_getLogs)
 * - Ограничение размера ответа (1MB)
 * - Ограничение диапазона истории getLogs (20k блоков)
 * - Ограничение batch-запросов
 * - Prometheus метрики времени запроса к RPC
 * - Fallback по списку RPC URL
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { Histogram } from 'prom-client';
import { serverConfig, getRpcUrlsByChainId } from '../config';
import { METRICS_PREFIX } from 'consts/metrics';
import Metrics from 'utilsApi/metrics';
import {
  METRIC_CONTRACT_ADDRESSES,
  METRIC_CONTRACT_EVENT_ADDRESSES,
  getMetricContractAbi,
  type MetricContractName,
} from 'utilsApi/contractAddressesMetricsMap';
import { getAddress, toFunctionSelector } from 'viem';
import { getStatusLabel } from '@lidofinance/api-metrics';

// ── Allowed RPC methods whitelist ─────────────────────────────────────────
export const ALLOWED_RPC_METHODS = new Set([
  'test',
  'eth_call',
  'eth_gasPrice',
  'eth_getCode',
  'eth_estimateGas',
  'eth_getBlockByNumber',
  'eth_feeHistory',
  'eth_maxPriorityFeePerGas',
  'eth_getBalance',
  'eth_blockNumber',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getTransactionCount',
  'eth_sendRawTransaction',
  'eth_getLogs',
  'eth_chainId',
  'net_version',
]);

const MAX_RESPONSE_SIZE = 1_000_000; // 1MB
const MAX_GET_LOGS_RANGE = 20_000; // блоков

// ── RPC Timing Histogram ──────────────────────────────────────────────────
// Регистрируется один раз (singleton через globalThis как в оригинале)
const g = globalThis as Record<string, unknown>;

const getRpcTimingHistogram = (): Histogram<string> => {
  if (!g.__rpcTimingHistogram__) {
    g.__rpcTimingHistogram__ = new Histogram({
      name: `${METRICS_PREFIX}rpc_request_duration_seconds`,
      help: 'Duration of RPC requests in seconds',
      labelNames: ['chain', 'method', 'status'],
      registers: [Metrics.registry],
    });
  }
  return g.__rpcTimingHistogram__ as Histogram<string>;
};

// ── JSON-RPC request validation ───────────────────────────────────────────
type JsonRpcCall = {
  method: string;
  params?: unknown[];
  id?: unknown;
  jsonrpc?: string;
};

const validateRpcMethod = (call: JsonRpcCall): string | null => {
  if (!ALLOWED_RPC_METHODS.has(call.method)) {
    return `Method not allowed: ${call.method}`;
  }
  return null;
};

const getAllowedCallAddresses = (chainId: number): Set<string> => {
  const addresses =
    METRIC_CONTRACT_ADDRESSES[
      chainId as keyof typeof METRIC_CONTRACT_ADDRESSES
    ];
  if (!addresses) return new Set();
  return new Set(Object.keys(addresses).map((a) => a.toLowerCase()));
};

const getAllowedLogsAddresses = (chainId: number): Set<string> => {
  const addresses =
    METRIC_CONTRACT_EVENT_ADDRESSES[
      chainId as keyof typeof METRIC_CONTRACT_EVENT_ADDRESSES
    ];
  if (!addresses) return new Set();
  return new Set(Object.keys(addresses).map((a) => a.toLowerCase()));
};

const validateEthCall = (call: JsonRpcCall, chainId: number): string | null => {
  if (call.method !== 'eth_call') return null;
  const params = call.params as Array<{ to?: string; data?: string }>;
  const to = params?.[0]?.to?.toLowerCase();
  if (!to) return null; // контракт без адреса — разрешаем

  const allowed = getAllowedCallAddresses(chainId);
  if (allowed.size > 0 && !allowed.has(to)) {
    return `eth_call to address ${to} is not allowed`;
  }
  return null;
};

const validateEthGetLogs = (
  call: JsonRpcCall,
  chainId: number,
): string | null => {
  if (call.method !== 'eth_getLogs') return null;
  const params = call.params as Array<{
    address?: string | string[];
    fromBlock?: string;
    toBlock?: string;
  }>;
  const filter = params?.[0];
  if (!filter) return 'Invalid eth_getLogs params';

  // Проверка address whitelist
  const addr = filter.address;
  if (addr) {
    const allowed = getAllowedLogsAddresses(chainId);
    if (allowed.size > 0) {
      const addresses = Array.isArray(addr) ? addr : [addr];
      const hasDisallowed = addresses.some(
        (a) => !allowed.has(a.toLowerCase()),
      );
      if (hasDisallowed) return 'eth_getLogs address not in allowed list';
    }
  } else {
    // Пустой address — блокируем (blockEmptyAddressGetLogs = true)
    return 'eth_getLogs without address filter is not allowed';
  }

  // Проверка диапазона блоков
  if (filter.fromBlock && filter.toBlock) {
    const from = parseInt(filter.fromBlock, 16);
    const to = parseInt(filter.toBlock, 16);
    if (!isNaN(from) && !isNaN(to) && to - from > MAX_GET_LOGS_RANGE) {
      return `eth_getLogs range exceeds ${MAX_GET_LOGS_RANGE} blocks`;
    }
  }

  return null;
};

// ── Tracked fetch to RPC endpoint ─────────────────────────────────────────
const trackedFetch = async (
  url: string,
  body: unknown,
  chainId: number,
  method: string,
): Promise<Response> => {
  const histogram = getRpcTimingHistogram();
  const end = histogram.startTimer({ chain: String(chainId), method });

  let status = '2xx';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    status = getStatusLabel(response.status);
    return response;
  } catch (err) {
    status = 'error';
    throw err;
  } finally {
    end({ status });
  }
};

// ── Fallback по списку RPC URL ────────────────────────────────────────────
const fetchWithFallback = async (
  urls: string[],
  body: unknown,
  chainId: number,
  method: string,
): Promise<Response> => {
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await trackedFetch(url, body, chainId, method);
      return response;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('All RPC endpoints failed');
};

// ── Collect eth_call address metrics ─────────────────────────────────────
const collectAddressMetrics = (
  calls: JsonRpcCall[],
  referer: string,
  chainId: number,
) => {
  const refererUrl = (() => {
    try {
      const u = new URL(referer);
      return `${u.origin}${u.pathname}`;
    } catch {
      return 'N/A';
    }
  })();

  for (const call of calls) {
    if (call.method !== 'eth_call') continue;
    const params = call.params as Array<{ to?: string; data?: string }>;
    const to = params?.[0]?.to;
    const data = params?.[0]?.data;
    if (!to) continue;

    try {
      const address = getAddress(to);
      const contractName =
        METRIC_CONTRACT_ADDRESSES?.[
          chainId as keyof typeof METRIC_CONTRACT_ADDRESSES
        ]?.[address];
      const methodEncoded = data?.slice(0, 10);

      let methodDecoded = 'N/A';
      if (contractName && methodEncoded?.length === 10) {
        const abi = getMetricContractAbi(contractName as MetricContractName);
        if (abi) {
          for (const item of abi) {
            if (item.type !== 'function') continue;
            const selector = toFunctionSelector(item);
            if (selector === methodEncoded) {
              methodDecoded = item.name;
              break;
            }
          }
        }
      }

      Metrics.request.ethCallToAddress
        .labels({
          address,
          referer: refererUrl,
          contractName: contractName ?? 'N/A',
          methodEncoded: methodEncoded ?? 'N/A',
          methodDecoded,
        })
        .inc(1);
    } catch {
      // не критично
    }
  }
};

// ── Main RPC handler ──────────────────────────────────────────────────────
export const handleRpc = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const query = req.query as Record<string, string>;
  const chainId = Number(query.chainId ?? serverConfig.defaultChain);

  const rpcUrls = getRpcUrlsByChainId(chainId);
  if (!rpcUrls || rpcUrls.length === 0) {
    return reply.code(400).send({
      error: `No RPC configured for chain ${chainId}`,
    });
    return;
  }

  const body = req.body as JsonRpcCall | JsonRpcCall[];
  const calls = Array.isArray(body) ? body : [body];

  // Проверка batch limit
  if (calls.length > serverConfig.providerMaxBatch) {
    return reply.code(400).send({
      error: `Batch size ${calls.length} exceeds maximum ${serverConfig.providerMaxBatch}`,
    });
    return;
  }

  // Валидация каждого вызова
  for (const call of calls) {
    const methodErr = validateRpcMethod(call);
    if (methodErr) {
      return reply.code(403).send({ error: methodErr });
      return;
    }

    const callErr = validateEthCall(call, chainId);
    if (callErr) {
      return reply.code(403).send({ error: callErr });
      return;
    }

    const logsErr = validateEthGetLogs(call, chainId);
    if (logsErr) {
      return reply.code(403).send({ error: logsErr });
      return;
    }
  }

  // Сбор метрик адресов (non-blocking)
  const referer = req.headers.referer ?? '';
  void collectAddressMetrics(calls, referer, chainId);

  // Отправка запроса к RPC с fallback
  const method = Array.isArray(body) ? 'batch' : body.method;
  const response = await fetchWithFallback(rpcUrls, body, chainId, method);

  // Проверка размера ответа
  const rawText = await response.text();
  if (rawText.length > MAX_RESPONSE_SIZE) {
    return reply.code(413).send({ error: 'RPC response too large' });
  }

  let responseData: unknown;
  try {
    responseData = JSON.parse(rawText);
  } catch {
    return reply.code(502).send({ error: 'Invalid JSON from RPC' });
  }

  return reply
    .code(response.status)
    .header('content-type', 'application/json')
    .send(responseData);
};
