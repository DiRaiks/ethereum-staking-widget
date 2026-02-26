import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useSafeQueryString = (extraParams?: Record<string, string>) => {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') ?? undefined;
  const embed = searchParams.get('embed') ?? undefined;
  const app = searchParams.get('app') ?? undefined;

  return useMemo(() => {
    const queryParams = new URLSearchParams();
    Object.entries({ ref, embed, app, ...(extraParams ?? {}) }).forEach(
      ([k, v]) => v && typeof v === 'string' && queryParams.append(k, v),
    );
    const qs = queryParams.toString();
    return qs ? '?' + qs : '';
  }, [ref, embed, app, extraParams]);
};
