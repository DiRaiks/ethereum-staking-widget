import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import nProgress from 'nprogress';

nProgress.configure({ showSpinner: false });

export const NavigationProgress = () => {
  const location = useLocation();

  useEffect(() => {
    nProgress.done();
  }, [location]);

  return null;
};
