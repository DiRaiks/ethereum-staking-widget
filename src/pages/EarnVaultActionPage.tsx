import { useParams, Navigate } from 'react-router-dom';
import { Layout } from 'shared/components';

import { VaultPageDVV, VaultPageGGV, VaultPageSTG } from 'features/earn';
import {
  type EarnVaultKey,
  EARN_VAULT_DEPOSIT_SLUG,
  EARN_VAULT_WITHDRAW_SLUG,
} from 'features/earn/consts';

const VAULT_PAGES = {
  ggv: VaultPageGGV,
  dvv: VaultPageDVV,
  strategy: VaultPageSTG,
} as const;

const EarnVaultActionPage = () => {
  const { vault, action } = useParams<{ vault: string; action: string }>();

  if (!vault || !action) return <Navigate to="/earn" replace />;
  if (
    action !== EARN_VAULT_DEPOSIT_SLUG &&
    action !== EARN_VAULT_WITHDRAW_SLUG
  ) {
    return <Navigate to="/earn" replace />;
  }

  const VaultPage = VAULT_PAGES[vault as EarnVaultKey];
  if (!VaultPage) return <Navigate to="/earn" replace />;

  return (
    <Layout>
      <VaultPage
        action={
          action as
            | typeof EARN_VAULT_DEPOSIT_SLUG
            | typeof EARN_VAULT_WITHDRAW_SLUG
        }
      />
    </Layout>
  );
};

export default EarnVaultActionPage;
