import {
  createExpense,
  createExpensePeriod,
  createPayment,
  deleteExpense,
  deleteExpensePeriod,
  getCollectionSummary,
  getExpensePeriod,
  getExpensePeriodAuditLogs,
  listExpensePeriods,
  updateExpense,
  updateExpensePeriodStatus,
  updatePaymentStatus,
} from '@/api/expenses.api';
import {queryKeys} from '@/api/queryKeys';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

function invalidateExpenseData(
  queryClient: ReturnType<typeof useQueryClient>,
  periodId: string,
) {
  queryClient.invalidateQueries({
    queryKey: queryKeys.expensePeriod(periodId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.expensePeriodsRoot,
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.collectionSummaryRoot,
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.expensePeriodAudit(periodId),
  });
}

export function useExpensePeriods(buildingId: string | null) {
  return useQuery({
    queryKey: queryKeys.expensePeriods(buildingId),
    queryFn: () => listExpensePeriods(buildingId as string),
    enabled: !!buildingId,
  });
}

export function useCollectionSummary(buildingId: string | null) {
  return useQuery({
    queryKey: queryKeys.collectionSummary(buildingId),
    queryFn: () => getCollectionSummary(buildingId as string),
    enabled: !!buildingId,
  });
}

export function useCreateExpensePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpensePeriod,
    onSuccess: (_period, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.expensePeriods(input.buildingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collectionSummary(input.buildingId),
      });
    },
  });
}

export function useDeleteExpensePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {periodId: string; buildingId: string}) =>
      deleteExpensePeriod(input.periodId),
    onSuccess: (_result, input) => {
      queryClient.removeQueries({
        queryKey: queryKeys.expensePeriod(input.periodId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.expensePeriods(input.buildingId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.collectionSummary(input.buildingId),
      });
    },
  });
}

export function useExpensePeriod(periodId: string | null) {
  return useQuery({
    queryKey: queryKeys.expensePeriod(periodId),
    queryFn: () => getExpensePeriod(periodId as string),
    enabled: !!periodId,
  });
}

export function useExpensePeriodAuditLogs(periodId: string | null) {
  return useQuery({
    queryKey: queryKeys.expensePeriodAudit(periodId),
    queryFn: () => getExpensePeriodAuditLogs(periodId as string),
    enabled: !!periodId,
  });
}

export function useUpdateExpensePeriodStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {periodId: string; status: 'OPEN' | 'CLOSED'}) =>
      updateExpensePeriodStatus(input.periodId, input.status),
    onSuccess: (_period, input) => {
      invalidateExpenseData(queryClient, input.periodId);
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpense,
    onSuccess: (_expense, input) => {
      invalidateExpenseData(queryClient, input.periodId);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      expenseId: string;
      periodId: string;
      amount: number;
    }) => updateExpense({expenseId: input.expenseId, amount: input.amount}),
    onSuccess: (_expense, input) => {
      invalidateExpenseData(queryClient, input.periodId);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {expenseId: string; periodId: string}) =>
      deleteExpense(input.expenseId),
    onSuccess: (_result, input) => {
      invalidateExpenseData(queryClient, input.periodId);
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      expenseId: string;
      periodId: string;
      amount: number;
      paymentMethod?: string;
      externalPaymentId?: string;
    }) =>
      createPayment({
        expenseId: input.expenseId,
        amount: input.amount,
        ...(input.paymentMethod ? {paymentMethod: input.paymentMethod} : {}),
        ...(input.externalPaymentId
          ? {externalPaymentId: input.externalPaymentId}
          : {}),
      }),
    onSuccess: (_payment, input) => {
      invalidateExpenseData(queryClient, input.periodId);
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      paymentId: string;
      periodId: string;
      status: 'COMPLETED' | 'REJECTED';
    }) =>
      updatePaymentStatus({
        paymentId: input.paymentId,
        status: input.status,
      }),
    onSuccess: (_payment, input) => {
      invalidateExpenseData(queryClient, input.periodId);
    },
  });
}
