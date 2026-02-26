/**
 * Хук для загрузки данных страницы (manifest + validation file).
 * Заменяет getStaticProps / getDefaultStaticProps на всех страницах.
 *
 * Данные кэшируются React Query — запрос делается один раз при монтировании,
 * потом переиспользуется на всех страницах.
 */

import { useQuery } from '@tanstack/react-query';
import type { AddressValidationFile } from 'utils/address-validation';
import type { Manifest } from 'config/external-config';

export type PageData = {
  ___prefetch_manifest___: Manifest | null;
  __validation_file__: AddressValidationFile;
};

const fetchPageData = async (): Promise<PageData> => {
  const response = await fetch('/api/page-data');
  if (!response.ok) {
    throw new Error(`Failed to fetch page data: ${response.status}`);
  }
  return response.json();
};

export const usePageData = () => {
  return useQuery<PageData>({
    queryKey: ['page-data'],
    queryFn: fetchPageData,
    // Соответствует cache-control max-age=15 с сервера
    staleTime: 15_000,
    // Не refetch при фокусе окна — данные меняются редко
    refetchOnWindowFocus: false,
    // Retry при ошибке
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
  });
};
