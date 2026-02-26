/**
 * Startup check для RPC endpoints.
 * Перенесено из scripts/startup-checks/rpc.mjs в TypeScript.
 * Принимает serverConfig вместо чтения из process.env напрямую.
 */

import { createClient, http } from 'viem';
import { getChainId } from 'viem/actions';
import type { serverConfig as ServerConfigType } from '../config';

const BROKEN_URL = 'BROKEN_URL';
const RPC_TIMEOUT_MS = 10_000;
const MAX_RETRY_COUNT = 3;

type CheckResult = { domain: string; chainId: number; success: boolean };

const checkRPC = async (url: string, chainId: number): Promise<CheckResult> => {
  let domain: string = BROKEN_URL;
  try {
    domain = new URL(url).hostname;
  } catch {
    console.error(`[checkRPC] Invalid URL: ${url}`);
    return { domain, chainId, success: false };
  }

  try {
    const client = createClient({
      transport: http(url, {
        retryCount: MAX_RETRY_COUNT,
        timeout: RPC_TIMEOUT_MS,
      }),
    });

    const chainIdClient = await getChainId(client);
    if (chainIdClient === chainId) {
      console.info(`[checkRPC] [chainId=${chainId}] RPC ${domain} is working`);
      return { domain, chainId, success: true };
    }
    throw new Error(`Expected chainId ${chainId}, but got ${chainIdClient}`);
  } catch (err) {
    console.error(
      `[checkRPC] [chainId=${chainId}] Error checking RPC ${domain}: ${(err as Error).message}`,
    );
    return { domain, chainId, success: false };
  }
};

export const startupCheckRPCs = async (
  config: typeof ServerConfigType,
): Promise<void> => {
  // Собираем все chainId → urls из конфига
  const chains: Array<{ chainId: number; urls: string[] }> = [];

  const chainIds = [
    1, 17000, 560048, 11155111, 10, 11155420, 1868, 1946, 130, 1301,
  ];
  for (const chainId of chainIds) {
    const key = `rpcUrls_${chainId}` as keyof typeof config;
    const urls = config[key] as string[] | undefined;
    if (urls && urls.length > 0) {
      chains.push({ chainId, urls });
    }
  }

  if (chains.length === 0) {
    console.warn('[startupCheckRPCs] No RPC URLs configured');
    return;
  }

  const allChecks = chains.flatMap(({ chainId, urls }) =>
    urls.map((url) => checkRPC(url, chainId)),
  );

  const results = await Promise.allSettled(allChecks);
  const checks = results
    .filter(
      (r): r is PromiseFulfilledResult<CheckResult> => r.status === 'fulfilled',
    )
    .map((r) => r.value);

  const working = checks.filter((c) => c.success).length;
  const total = checks.length;

  console.info(`[startupCheckRPCs] Working RPCs: ${working}/${total}`);

  if (working === 0) {
    console.error('[startupCheckRPCs] No working RPC endpoints found!');
  }
};
