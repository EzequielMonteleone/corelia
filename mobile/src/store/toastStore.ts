import {create} from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastState = {
  toasts: ToastItem[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
  clear: () => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>(set => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = nextId++;
    set(state => ({toasts: [...state.toasts.slice(-2), {id, message, type}]}));
  },
  dismiss: id =>
    set(state => ({toasts: state.toasts.filter(toast => toast.id !== id)})),
  clear: () => set({toasts: []}),
}));

export const toast = {
  success: (message: string) =>
    useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
  info: (message: string) => useToastStore.getState().show(message, 'info'),
};
