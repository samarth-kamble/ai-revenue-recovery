import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRecoveryCases,
  fetchRecoveryCaseById,
  evaluateRecovery,
  createSimulatedFailure,
  DEFAULT_MERCHANT_ID,
} from '../api/recovery-api';
import { RecoveryCase } from '../types';

export const RECOVERY_QUERY_KEYS = {
  cases: (merchantId: string) => ['recovery-cases', merchantId] as const,
  detail: (caseId: string, merchantId: string) => ['recovery-case-detail', caseId, merchantId] as const,
};

export function useRecoveryCases(merchantId = DEFAULT_MERCHANT_ID) {
  return useQuery<RecoveryCase[]>({
    queryKey: RECOVERY_QUERY_KEYS.cases(merchantId),
    queryFn: () => fetchRecoveryCases(merchantId),
    refetchInterval: 10000,
  });
}

export function useRecoveryCaseDetail(caseId: string | null, merchantId = DEFAULT_MERCHANT_ID) {
  return useQuery<RecoveryCase>({
    queryKey: RECOVERY_QUERY_KEYS.detail(caseId || '', merchantId),
    queryFn: () => fetchRecoveryCaseById(caseId!, merchantId),
    enabled: Boolean(caseId),
    staleTime: 1000 * 10,
  });
}

export function useEvaluateMutation(merchantId = DEFAULT_MERCHANT_ID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => evaluateRecovery(paymentId, merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECOVERY_QUERY_KEYS.cases(merchantId) });
    },
  });
}

export function useSimulateFailureMutation(merchantId = DEFAULT_MERCHANT_ID) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ amount, failureType }: { amount: number; failureType: string }) =>
      createSimulatedFailure(merchantId, amount, failureType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECOVERY_QUERY_KEYS.cases(merchantId) });
    },
  });
}
