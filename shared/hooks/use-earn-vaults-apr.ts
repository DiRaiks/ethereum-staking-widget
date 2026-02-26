import { useQuery } from '@tanstack/react-query';
import { standardFetcher } from 'utils/standardFetcher';
import { API_ROUTES } from 'consts/api';

type VaultsAprResponse = {
  data: {
    maxValue: number;
    [key: string]:
      | { apr: number | undefined; timestamp: number | undefined }
      | number;
  };
  meta: { resTimestamp: number };
};

export const useEarnVaultsApr = () => {
  const { data, isLoading } = useQuery<VaultsAprResponse>({
    queryKey: ['earn', 'vaults-apr'],
    queryFn: async () => {
      return await standardFetcher<VaultsAprResponse>(
        API_ROUTES.EARN_VAULTS_APR,
      );
    },
  });

  return {
    maxValue: data?.data.maxValue,
    data,
    isLoading,
  };
};
