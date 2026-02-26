import { useParams, Navigate } from 'react-router-dom';

import { EARN_VAULT_DEPOSIT_SLUG } from 'features/earn/consts';
import { EARN_PATH } from 'consts/urls';

// /earn/:vault → redirect to /earn/:vault/deposit
const EarnVaultPage = () => {
  const { vault } = useParams<{ vault: string }>();

  return (
    <Navigate to={`${EARN_PATH}/${vault}/${EARN_VAULT_DEPOSIT_SLUG}`} replace />
  );
};

export default EarnVaultPage;
