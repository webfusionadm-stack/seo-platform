import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { OrderDTO, CreateOrderRequest, UpdateOrderRequest, PaginatedResponse } from '@seo-platform/shared';
import toast from 'react-hot-toast';

interface OrderFilters {
  siteId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useOrders(filters: OrderFilters = {}) {
  const params = new URLSearchParams();
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page || 1));
  params.set('pageSize', String(filters.pageSize || 20));

  return useQuery<PaginatedResponse<OrderDTO>>({
    queryKey: ['orders', filters],
    queryFn: () => api.get(`/orders?${params}`).then((r) => r.data),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery<OrderDTO>({
    queryKey: ['orders', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => api.post('/orders', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande créée');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) =>
      api.put(`/orders/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande mise à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Commande supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}
