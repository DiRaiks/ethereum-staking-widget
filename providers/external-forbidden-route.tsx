import { useState, useCallback, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRouterPath } from 'shared/hooks/use-router-path';
import { useConfig } from 'config';
import {
  ManifestConfigPage,
  ManifestConfigPageEnum,
} from 'config/external-config';
import { HOME_PATH } from 'consts/urls';

import { LayoutEffectSsrDelayed } from 'shared/components/layout-effect-ssr-delayed';

export const ExternalForbiddenRouteProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [showContent, setShowContent] = useState(true);
  const navigate = useNavigate();
  const path = useRouterPath();
  const { pages } = useConfig().externalConfig;

  const checkPathEffect = useCallback(() => {
    if (pages) {
      const paths = Object.keys(pages) as ManifestConfigPage[];
      const forbiddenPath = paths.find((pathKey) => path.includes(pathKey));
      if (
        forbiddenPath &&
        forbiddenPath !== ManifestConfigPageEnum.Stake &&
        pages[forbiddenPath]?.shouldDisable
      ) {
        setShowContent(false);
        void navigate(HOME_PATH);
        setShowContent(true);
      }
    }
  }, [pages, path, navigate]);

  const effectDeps = useMemo(() => [pages, path], [pages, path]);

  return (
    <>
      <LayoutEffectSsrDelayed effect={checkPathEffect} deps={effectDeps} />
      {showContent && children}
    </>
  );
};
