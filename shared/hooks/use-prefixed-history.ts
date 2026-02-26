import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const usePrefixedPush = () => {
  const navigate = useNavigate();
  return useCallback(
    (url: string, query?: Record<string, string>) => {
      const search =
        query && Object.keys(query).length > 0
          ? '?' + new URLSearchParams(query).toString()
          : '';
      return navigate(url + search);
    },
    [navigate],
  );
};

export const usePrefixedReplace = () => {
  const navigate = useNavigate();
  return useCallback(
    (url: string, query?: Record<string, string>) => {
      const search =
        query && Object.keys(query).length > 0
          ? '?' + new URLSearchParams(query).toString()
          : '';
      return navigate(url + search, { replace: true });
    },
    [navigate],
  );
};
