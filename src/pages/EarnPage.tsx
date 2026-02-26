import type { FC } from 'react';

import { Layout } from 'shared/components';
import { EarnVaultsList } from 'features/earn';

const PAGE_TITLE = 'Earn';
const PAGE_DESCRIPTION =
  'Deposit ETH/WETH/stETH/wstETH into vaults to earn higher rewards';

const EarnPage: FC = () => {
  return (
    <Layout title={PAGE_TITLE} subtitle={PAGE_DESCRIPTION}>
      <EarnVaultsList />
    </Layout>
  );
};

export default EarnPage;
