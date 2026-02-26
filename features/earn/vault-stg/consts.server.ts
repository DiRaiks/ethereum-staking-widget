// Server-safe constants — no SVG / React / browser dependencies.
// Imported by both server routes and client utils.

export const STG_STATS_ORIGIN = 'https://api.mellow.finance';

export const STG_COLLECTOR_CONFIG = {
  baseAssetFallback: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  oracleUpdateInterval: 86400n,
  redeemHandlingInterval: 3600n,
} as const;
