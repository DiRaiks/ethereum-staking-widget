import { FC } from 'react';
import { useParams } from 'react-router-dom';

import { WrapUnwrapTabs } from 'features/wsteth/wrap-unwrap-tabs';
import { Layout } from 'shared/components';
import { SupportL2Chains } from 'modules/web3';
import { LegalDisclaimer } from 'shared/components/legal-disclaimer';
import { DisclaimerSection } from 'shared/components/disclaimer-section';

const WrapPage: FC = () => {
  const { mode } = useParams<{ mode?: string }>();
  const wrapMode = mode === 'unwrap' ? 'unwrap' : 'wrap';

  return (
    <SupportL2Chains>
      <Layout
        title="Wrap & Unwrap"
        subtitle="Stable-balance stETH wrapper for DeFi"
      >
        <WrapUnwrapTabs mode={wrapMode} />
        <DisclaimerSection>
          <LegalDisclaimer />
        </DisclaimerSection>
      </Layout>
    </SupportL2Chains>
  );
};

export default WrapPage;
