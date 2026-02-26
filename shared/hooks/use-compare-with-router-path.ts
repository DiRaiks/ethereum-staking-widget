import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { config } from 'config';
import {
  compareWithRouterPathInIPFS,
  compareWithRouterPathInInfra,
} from 'utils/compare-with-router-path';

export const useCompareWithRouterPath = (href: string) => {
  const { pathname } = useLocation();

  return useMemo(
    () =>
      config.ipfsMode
        ? compareWithRouterPathInIPFS(pathname, href)
        : compareWithRouterPathInInfra(pathname, href),
    [pathname, href],
  );
};
