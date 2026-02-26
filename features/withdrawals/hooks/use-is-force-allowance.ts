import { useConfig } from 'config';
import { useSearchParams } from 'react-router-dom';

export const useIsForceAllowance = () => {
  const { featureFlags } = useConfig().externalConfig;
  const [searchParams] = useSearchParams();

  const isUrlForceAllowance = searchParams.get('forceAllowance') === 'enabled';
  const isFeatureFlagForceAllowance = featureFlags.forceAllowance === true;

  return isUrlForceAllowance || isFeatureFlagForceAllowance;
};
