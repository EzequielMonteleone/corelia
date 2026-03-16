import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import type {
  ExpensePeriod,
  ExpensePeriodDetail,
  ExpensePeriodStatus,
} from '@/types/expense';

export function useExpensePeriods(buildingId: string | null) {
  return useQuery<ExpensePeriod[]>({
    queryKey: ['expense-periods', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const res = await apiClient.get(`/buildings/${buildingId}/expense-periods`);
      return res.data;
    },
    enabled: !!buildingId,
  });
}

export function useCreateExpensePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({buildingId, period}: {buildingId: string; period: string}) => {
      const res = await apiClient.post(`/buildings/${buildingId}/expense-periods`, {period});
      return res.data as ExpensePeriod;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['expense-periods', variables.buildingId]});
    },
  });
}

export function useDeleteExpensePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({periodId, buildingId}: {periodId: string; buildingId: string}) => {
      await apiClient.delete(`/expense-periods/${periodId}`);
      return buildingId;
    },
    onSuccess: buildingId => {
      queryClient.invalidateQueries({queryKey: ['expense-periods', buildingId]});
    },
  });
}

export function useExpensePeriodDetail(periodId: string | null) {
  return useQuery<ExpensePeriodDetail>({
    queryKey: ['expense-period-detail', periodId],
    queryFn: async () => {
      const res = await apiClient.get(`/expense-periods/${periodId}`);
      return res.data;
    },
    enabled: !!periodId,
  });
}

export function useUpdateExpensePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({periodId, status}: {periodId: string; status: ExpensePeriodStatus}) => {
      const res = await apiClient.put(`/expense-periods/${periodId}`, {status});
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['expense-period-detail', variables.periodId]});
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      periodId,
      unitId,
      amount,
    }: {
      periodId: string;
      unitId: string;
      amount: number;
    }) => {
      const res = await apiClient.post(`/expense-periods/${periodId}/expenses`, {
        unitId,
        amount,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['expense-period-detail', variables.periodId]});
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({expenseId, amount}: {expenseId: string; periodId: string; amount: number}) => {
      const res = await apiClient.put(`/expenses/${expenseId}`, {amount});
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['expense-period-detail', variables.periodId]});
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({expenseId, periodId}: {expenseId: string; periodId: string}) => {
      await apiClient.delete(`/expenses/${expenseId}`);
      return periodId;
    },
    onSuccess: periodId => {
      queryClient.invalidateQueries({queryKey: ['expense-period-detail', periodId]});
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      expenseId,
      amount,
      paymentMethod,
      externalPaymentId,
    }: {
      expenseId: string;
      periodId: string;
      amount: number;
      paymentMethod?: string;
      externalPaymentId?: string;
    }) => {
      const res = await apiClient.post(`/expenses/${expenseId}/payments`, {
        amount,
        paymentMethod,
        externalPaymentId,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['expense-period-detail', variables.periodId]});
    },
  });
}
