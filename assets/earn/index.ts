import styled, { css } from 'styled-components';

import { ReactComponent as Partner7SeasIcon } from './partner-7seas.svg?react';
import { ReactComponent as PartnerVedaIcon } from './partner-veda.svg?react';
import { ReactComponent as PartnerSteakhouseIcon } from './partner-steakhouse.svg?react';
import { ReactComponent as PartnerMellowIcon } from './partner-mellow.svg?react';
import { ReactComponent as PartnerRuntimeLabsIcon } from './partner-runtime-labs.svg?react';
import { ReactComponent as PartnerRuntimeLabsIconInverted } from './partner-runtime-labs-inverted.svg?react';

import { ReactComponent as TokenEthIcon } from './token-eth.svg?react';
import { ReactComponent as TokenEthScalableIcon } from './token-eth-scalable.svg?react';
import { ReactComponent as TokenEthIcon32 } from './token-eth-32.svg?react';
import { ReactComponent as TokenStethIcon } from './token-steth.svg?react';
import { ReactComponent as TokenWethIcon } from './token-weth.svg?react';
import { ReactComponent as TokenWethScalableIcon } from './token-weth-scalable.svg?react';
import { ReactComponent as TokenWethIcon32 } from './token-weth-32.svg?react';
import { ReactComponent as TokenWstethIcon } from './token-wsteth.svg?react';
import { ReactComponent as TokenWstethScalableIcon } from './token-wsteth-scalable.svg?react';
import { ReactComponent as TokenWstethIcon32 } from './token-wsteth-32.svg?react';
import { ReactComponent as TokenGGIcon } from './token-gg.svg?react';
import { ReactComponent as TokenDvstethIcon } from './token-dvsteth.svg?react';
import { ReactComponent as TokenObolIconRaw } from './token-obol.svg?react';
import { ReactComponent as TokenSsvIconRaw } from './token-ssv.svg?react';
import { ReactComponent as TokenMellowIcon } from './token-mellow.svg?react';
import { ReactComponent as TokenStethDarkIcon } from './token-steth-dark.svg?react';
import { ReactComponent as TokenStrethIcon } from './token-streth.svg?react';

import { ReactComponent as VaultDVVIcon } from './vault-dvv.svg?react';
import { ReactComponent as VaultGGVIcon } from './vault-ggv.svg?react';
import { ReactComponent as VaultSTGIcon } from './vault-stg.svg?react';

import { ReactComponent as NavIconEarn } from './nav-icon-earn.svg?react';

import { ReactComponent as EarnStgBannerIcon } from './earn-stg-banner.svg?react';
import { ReactComponent as EarnUpToBannerIcon } from './earn-up-to-banner.svg?react';

export { ReactComponent as BaseIcon } from './allocation/base.svg?react';
export { ReactComponent as ArbitrumIcon } from './allocation/arbitrum.svg?react';
export { ReactComponent as EthereumIcon } from './allocation/ethereum.svg?react';
export { ReactComponent as EulerIcon } from './allocation/euler.svg?react';
export { ReactComponent as MorphoIcon } from './allocation/morpho.svg?react';
export { ReactComponent as Univ3Icon } from './allocation/uniswap_v3.svg?react';
export { ReactComponent as AaveV3Icon } from './allocation/aave_v3.svg?react';
export { ReactComponent as BalancerIcon } from './allocation/balancer.svg?react';
export { ReactComponent as MerklIcon } from './allocation/merkl.svg?react';
export { ReactComponent as EtherfiIcon } from './allocation/etherfi.svg?react';
export { ReactComponent as LineaIcon } from './allocation/linea.svg?react';
export { ReactComponent as YearnV3Icon } from './allocation/yearn-v3.svg?react';
export { ReactComponent as KatanaIcon } from './allocation/katana.svg?react';
export { ReactComponent as PlasmaIcon } from './allocation/plasma.svg?react';
export { ReactComponent as SparkIcon } from './allocation/spark.svg?react';
export { ReactComponent as FluidIcon } from './allocation/fluid.svg?react';

const themedBackground = css`
  path,
  rect {
    &[data-id='background'] {
      fill: ${({ theme }) => (theme.name === 'dark' ? '#34343D' : '#fff')};
    }
    &[data-id='background-border'] {
      stroke: ${({ theme }) => (theme.name === 'dark' ? '#484850' : '#fff')};
    }
  }
`;

const TokenObolIcon = styled(TokenObolIconRaw)`
  ${themedBackground}
`;

const TokenSsvIcon = styled(TokenSsvIconRaw)`
  ${themedBackground}
`;

export {
  Partner7SeasIcon,
  PartnerVedaIcon,
  PartnerSteakhouseIcon,
  PartnerMellowIcon,
  PartnerRuntimeLabsIcon,
  PartnerRuntimeLabsIconInverted,
  TokenStethDarkIcon,
  TokenStrethIcon,
  VaultGGVIcon,
  VaultDVVIcon,
  VaultSTGIcon,
  TokenEthIcon,
  TokenEthScalableIcon,
  TokenEthIcon32,
  TokenStethIcon,
  TokenWethIcon,
  TokenWethScalableIcon,
  TokenWethIcon32,
  TokenWstethIcon,
  TokenWstethScalableIcon,
  TokenWstethIcon32,
  TokenGGIcon,
  TokenDvstethIcon,
  TokenObolIcon,
  TokenSsvIcon,
  TokenMellowIcon,
  NavIconEarn,
  EarnStgBannerIcon,
  EarnUpToBannerIcon,
};
