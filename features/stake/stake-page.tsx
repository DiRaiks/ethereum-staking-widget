import { useEffect } from 'react';

import { Layout } from 'shared/components';
import { Stake } from './stake';

import type { FC } from 'react';

export const StakePage: FC = () => {
  useEffect(() => {
    document.title = 'Stake with Lido | Lido';
  }, []);

  return (
    <Layout
      title="Stake Ether"
      subtitle="Stake ETH and receive stETH while staking"
    >
      <Stake />
    </Layout>
  );
};
