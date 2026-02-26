import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Path, PathValue, UseFormSetValue } from 'react-hook-form';
import { parseEther } from 'viem';

type UseQueryParamsReferralFormArgs<T extends { referral: string | null }> = {
  setValue: UseFormSetValue<T>;
};

export const useQueryParamsReferralForm = <
  T extends { referral: string | null },
>({
  setValue,
}: UseQueryParamsReferralFormArgs<T>) => {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    try {
      if (ref) {
        setValue('referral' as Path<T>, ref as PathValue<T, Path<T>>);
      }
    } catch (error) {
      console.warn('Error setting referral value from query params', error);
    }
  }, [ref, setValue]);
};

type UseQueryParamsAmountFormArgs<T extends { amount: bigint | null }> = {
  setValue: UseFormSetValue<T>;
};

export const useQueryParamsAmountForm = <T extends { amount: bigint | null }>({
  setValue,
}: UseQueryParamsAmountFormArgs<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    try {
      const amount = searchParams.get('amount');
      if (amount) {
        const next = new URLSearchParams(searchParams);
        next.delete('amount');
        setSearchParams(next, { replace: true });
        setValue(
          'amount' as Path<T>,
          parseEther(amount) as PathValue<T, Path<T>>,
        );
      }
    } catch (error) {
      console.warn('Error setting amount value from query params', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount
};
