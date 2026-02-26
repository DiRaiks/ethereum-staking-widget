import type { FC } from 'react';
import { useParams, Navigate } from 'react-router-dom';

import { WithdrawalsTabs } from 'features/withdrawals';
import { WithdrawalsProvider } from 'features/withdrawals/contexts/withdrawals-context';
import { Layout, DisclaimerSection, LegalDisclaimer } from 'shared/components';

const WithdrawalsPage: FC = () => {
  const { mode } = useParams<{ mode: string }>();

  if (mode !== 'request' && mode !== 'claim') {
    return <Navigate to="/withdrawals/request" replace />;
  }

  return (
    <Layout
      title="Withdrawals"
      subtitle="Request stETH/wstETH withdrawal and claim ETH"
    >
      <WithdrawalsProvider mode={mode}>
        <WithdrawalsTabs />
      </WithdrawalsProvider>
      <DisclaimerSection>
        <LegalDisclaimer />
      </DisclaimerSection>
    </Layout>
  );
};

export default WithdrawalsPage;
