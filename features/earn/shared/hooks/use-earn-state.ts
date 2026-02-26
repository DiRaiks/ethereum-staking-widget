import { useConfig } from 'config/use-config';
import { EARN_PATH } from 'consts/urls';
import { useSearchParams } from 'react-router-dom';
import { useIsIframe } from 'shared/hooks/use-is-iframe';

export const EARN_STATES = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  PARTIAL: 'partial',
} as const;

type EarnStateKey = keyof typeof EARN_STATES;
type EarnStateValue = (typeof EARN_STATES)[EarnStateKey];

const EARN_STATE_KEYWORDS = [
  EARN_STATES.ENABLED,
  EARN_STATES.DISABLED,
] as const;

/**
 * Helper to cache earn param in global scope to prevent loss in iframe rerenders
 */
const getCachedEarnParam = () => {
  if (typeof window === 'undefined') return undefined;
  return (window as any).__earnParamCache__;
};

const setCachedEarnParam = (value: string | undefined) => {
  if (typeof window === 'undefined') return;
  (window as any).__earnParamCache__ = value;
};

/**
 * Determines the overall earn state based on runtime context and external configuration.
 */
export const useEarnState = () => {
  const { pages, earnVaults } = useConfig().externalConfig;

  const earnRuntimeState = useEarnRuntimeState();
  const {
    isEarnDisabledByRuntimeContext,
    someVaultsEnabledByURL,
    isVaultEnabledByUrl,
  } = earnRuntimeState;

  const isEarnDisabledByConfig = pages[EARN_PATH]?.shouldDisable ?? false;

  const isEarnDisabled =
    isEarnDisabledByRuntimeContext || isEarnDisabledByConfig;

  const isEarnPartial = !isEarnDisabled && someVaultsEnabledByURL;

  let earnState: EarnStateValue;
  if (isEarnPartial) {
    earnState = EARN_STATES.PARTIAL;
  } else if (isEarnDisabled) {
    earnState = EARN_STATES.DISABLED;
  } else {
    earnState = EARN_STATES.ENABLED;
  }

  const isVaultEnabled = (vaultName: string) => {
    const vaultConfig = earnVaults.find((vault) => vault.name === vaultName);
    if (!vaultConfig || vaultConfig.disabled) return false;
    if (earnState === EARN_STATES.DISABLED) return false;
    if (earnState === EARN_STATES.ENABLED) return true;
    return earnState === EARN_STATES.PARTIAL && isVaultEnabledByUrl(vaultName);
  };

  const isVaultDisabled = (vaultName: string) => !isVaultEnabled(vaultName);

  const earnVaultsEnabled = earnVaults.filter((vault) =>
    isVaultEnabled(vault.name),
  );

  return {
    ...earnRuntimeState,
    earnState,
    earnVaults,
    earnVaultsEnabled,
    isEarnEnabled: earnState === EARN_STATES.ENABLED,
    isEarnDisabled,
    isEarnPartial,
    isEarnVaultsForceEnabledByURL: someVaultsEnabledByURL,
    isVaultEnabled,
    isVaultDisabled,
  };
};

/**
 * Determines the earn state at runtime based on URL parameters and iframe context.
 *
 * **WARNING: It doesn't rely on external config, therefore it may not reflect the final earn state!**
 */
export const useEarnRuntimeState = () => {
  const [searchParams] = useSearchParams();
  const isIframe = useIsIframe();

  const earnParamRaw = searchParams.get('earn') ?? undefined;

  // Cache the earn query param to prevent loss on rerenders in iframe
  if (earnParamRaw) {
    setCachedEarnParam(earnParamRaw);
  }

  // Use cached value if current earn param is undefined, but we had it before
  const earnParam = earnParamRaw || getCachedEarnParam();

  // Parse enabled vaults from URL param: ?earn=vault1,vault2
  let vaultsEnabledByUrl: string[] = [];
  if (
    earnParam &&
    typeof earnParam === 'string' &&
    !EARN_STATE_KEYWORDS.includes(earnParam as any)
  ) {
    vaultsEnabledByUrl = earnParam.split(',');
  }

  const someVaultsEnabledByURL = vaultsEnabledByUrl.length > 0;
  const isEarnEnabledByURL = earnParam === EARN_STATES.ENABLED;
  const isEarnDisabledByURL = earnParam === EARN_STATES.DISABLED;

  const isEarnDisabledByRuntimeContext =
    (isIframe && !isEarnEnabledByURL && !someVaultsEnabledByURL) ||
    isEarnDisabledByURL;

  const isVaultEnabledByUrl = (vaultName: string) =>
    vaultsEnabledByUrl.includes(vaultName);

  const isVaultDisabledByUrl = (vaultName: string) =>
    !isVaultEnabledByUrl(vaultName);

  return {
    isEarnDisabledByRuntimeContext,
    someVaultsEnabledByURL,
    vaultsEnabledByUrl,
    isVaultEnabledByUrl,
    isVaultDisabledByUrl,
  };
};
