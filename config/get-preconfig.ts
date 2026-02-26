import { default as dynamics } from './dynamics';

export type PreConfigType = {
  BASE_PATH_ASSET: string;
} & typeof dynamics;

// `getPreConfig()` needs for internal using in 'config/groups/*'
// Do not use `getPreConfig()` outside of 'config/groups/*'
export const getPreConfig = (): PreConfigType => {
  // In Vite SPA build there is no basePath — the app is served from root.
  // In IPFS mode assets are loaded relative to the page (e.g., './icon.svg').
  const BASE_PATH_ASSET = dynamics.ipfsMode ? '.' : '';

  return {
    BASE_PATH_ASSET,
    ...dynamics,
  };
};

// `preConfig` needs for external internal in 'config/groups/*'
// Not use `preConfig` outside of 'config/groups/*'
export const preConfig = getPreConfig();
