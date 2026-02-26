import { useLocation } from 'react-router-dom';

import { HOME_PATH } from 'consts/urls';

export const useRouterPath = () => {
  const { pathname } = useLocation();

  if (pathname.length > 1 && pathname.endsWith('/'))
    return pathname.slice(0, -1);
  return pathname || HOME_PATH;
};
