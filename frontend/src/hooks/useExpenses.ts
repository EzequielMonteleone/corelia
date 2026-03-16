import {useCallback, useMemo, useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import {useBuildingUnits} from '@/hooks/useBuildings';
import {useAuthStore} from '@/store/authStore';
import type {
  ExpensePeriod,
  ExpensePeriodDetail,
  ExpensePeriodStatus,
  Expense,
  PaymentStatus,
} from '@/types/expense';

interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useExpensePeriods(buildingId: string | null) {
  return useQuery<ExpensePeriod[]>({
    queryKey: ['expense-periods', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const res = await apiClient.get(
        `/buildings/${buildingId}/expense-periods`,
      );
      return res.data;
    },
    enabled: !!buildingId,
  });
}

export function useCreateExpensePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      buildingId,
      period,
    }: {
      buildingId: string;
      period: string;
    }) => {
      const res = await apiClient.post(
        `/buildings/${buildingId}/expense-periods`,
        {period},
      );
      return res.data as ExpensePeriod;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expense-periods', variables.buildingId],
      });
    },
  });
}

export function useDeleteExpensePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      periodId,
      buildingId,
    }: {
      periodId: string;
      buildingId: string;
    }) => {
      await apiClient.delete(`/expense-periods/${periodId}`);
      return buildingId;
    },
    onSuccess: buildingId => {
      queryClient.invalidateQueries({
        queryKey: ['expense-periods', buildingId],
      });
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
    mutationFn: async ({
      periodId,
      status,
    }: {
      periodId: string;
      status: ExpensePeriodStatus;
    }) => {
      const res = await apiClient.put(`/expense-periods/${periodId}`, {status});
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expense-period-detail', variables.periodId],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-periods'],
      });
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
      const res = await apiClient.post(
        `/expense-periods/${periodId}/expenses`,
        {
          unitId,
          amount,
        },
      );
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expense-period-detail', variables.periodId],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-periods'],
      });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      expenseId,
      amount,
    }: {
      expenseId: string;
      periodId: string;
      amount: number;
    }) => {
      const res = await apiClient.put(`/expenses/${expenseId}`, {amount});
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expense-period-detail', variables.periodId],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-periods'],
      });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      expenseId,
      periodId,
    }: {
      expenseId: string;
      periodId: string;
    }) => {
      await apiClient.delete(`/expenses/${expenseId}`);
      return periodId;
    },
    onSuccess: periodId => {
      queryClient.invalidateQueries({
        queryKey: ['expense-period-detail', periodId],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-periods'],
      });
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
      queryClient.invalidateQueries({
        queryKey: ['expense-period-detail', variables.periodId],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-periods'],
      });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      paymentId: string;
      periodId: string;
      status: PaymentStatus;
    }) => {
      const {paymentId, status} = variables;
      const res = await apiClient.put(`/payments/${paymentId}`, {status});
      return res.data as {id: string; periodId: string};
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['expense-period-detail', variables.periodId],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense-periods'],
      });
    },
  });
}

export function useExpensePeriodPage(periodId: string) {
  const {data: period, isLoading, isError} = useExpensePeriodDetail(periodId);
  const {data: units = []} = useBuildingUnits(period?.building.id ?? null);
  const user = useAuthStore(s => s.user);

  const canManagePeriods = useMemo(
    () =>
      user?.globalRole === 'SUPERADMIN' ||
      (!!period?.building?.id &&
        user?.buildingUsers?.some(
          bu =>
            bu.buildingId === period.building.id && bu.role?.name === 'Admin',
        )),
    [user?.globalRole, user?.buildingUsers, period],
  );

  const availableUnits = useMemo(() => {
    if (!period) return [];
    const withExpense = new Set(period.expenses.map(e => e.unitId));
    return units.filter(u => !withExpense.has(u.id));
  }, [period, units]);

  const updatePeriod = useUpdateExpensePeriod();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const handleAddExpense = useCallback((callbacks?: MutationCallbacks) => {
    if (!selectedUnitId || !newAmount) return;
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;
    createExpense.mutate(
      {periodId, unitId: selectedUnitId, amount},
      {
        onSuccess: () => {
          setSelectedUnitId('');
          setNewAmount('');
          callbacks?.onSuccess?.();
        },
        onError: () => callbacks?.onError?.(),
      },
    );
  }, [selectedUnitId, newAmount, periodId, createExpense]);

  const handleTogglePeriodStatus = useCallback(
    (callbacks?: MutationCallbacks) => {
      if (!period) return;
      updatePeriod.mutate(
        {
          periodId,
          status: period.status === 'OPEN' ? 'CLOSED' : 'OPEN',
        },
        {
          onSuccess: () => callbacks?.onSuccess?.(),
          onError: () => callbacks?.onError?.(),
        },
      );
    },
    [period, periodId, updatePeriod],
  );

  const handleStartEdit = useCallback((expense: Expense) => {
    setEditingExpenseId(expense.id);
    setEditAmount(String(expense.amount));
  }, []);

  const handleSaveEdit = useCallback(
    (expense: Expense, callbacks?: MutationCallbacks) => {
      const amount = parseFloat(editAmount);
      if (isNaN(amount) || amount <= 0) return;
      updateExpense.mutate(
        {expenseId: expense.id, periodId, amount},
        {
          onSuccess: () => {
            setEditingExpenseId(null);
            setEditAmount('');
            callbacks?.onSuccess?.();
          },
          onError: () => callbacks?.onError?.(),
        },
      );
    },
    [editAmount, periodId, updateExpense],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingExpenseId(null);
    setEditAmount('');
  }, []);

  const handleDeleteExpense = useCallback(
    (expense: Expense, callbacks?: MutationCallbacks) => {
      deleteExpense.mutate(
        {expenseId: expense.id, periodId},
        {
          onSuccess: () => callbacks?.onSuccess?.(),
          onError: () => callbacks?.onError?.(),
        },
      );
    },
    [periodId, deleteExpense],
  );

  return {
    period,
    isLoading,
    isError,
    canManagePeriods: !!canManagePeriods,
    availableUnits,
    selectedUnitId,
    setSelectedUnitId,
    newAmount,
    setNewAmount,
    paymentExpense,
    setPaymentExpense,
    editingExpenseId,
    editAmount,
    setEditAmount,
    handleAddExpense,
    handleTogglePeriodStatus,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteExpense,
    deleteExpense,
    updatePeriod,
    createExpense,
    updateExpense,
  };
}
