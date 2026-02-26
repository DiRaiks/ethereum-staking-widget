import { maxUint112, maxUint24 } from 'viem';

import { PartnerVedaIcon } from 'assets/earn';

import type { GGV_DEPOSIT_TOKENS } from './deposit/form-context/types';

export const GGV_TOKEN_SYMBOL = 'GG';

export const GGV_DEPOSABLE_TOKENS: GGV_DEPOSIT_TOKENS[] = [
  'ETH',
  'wETH',
  'stETH',
  'wstETH',
];

export const INFINITE_DEPOSIT_CAP = maxUint112;
export const MAX_REQUEST_DEADLINE = Number(maxUint24);

export const GGV_VAULT_DESCRIPTION =
  'Lido GGV (Golden Goose Vault) utilizes tried and tested strategies with premier DeFi protocols for increased rewards on deposits of ETH or (w)stETH.';

export const GGV_PARTNERS = [
  { role: 'Curated by', icon: <PartnerVedaIcon />, text: 'Veda' },
  {
    role: 'Infra provider',
    icon: <PartnerVedaIcon />,
    text: 'Veda',
  },
];

export { GGV_START_DATE, GGV_INCENTIVES, GGV_STATS_ORIGIN } from './consts.server';
