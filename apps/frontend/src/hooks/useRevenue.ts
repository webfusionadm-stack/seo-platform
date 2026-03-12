import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { RevenueDTO, CreateRevenueRequest, RevenueStats, PaginatedResponse } from '@seo-platform/shared';
import toast from 'react-hot-toast';

interface RevenueFilters {
  siteId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export function useRevenues(filters: RevenueFilters = {}) {
  const params = new URLSearchParams();
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.type) params.set('type', filters.type);
  params.set('page', String(filters.page || 1));
  params.set('pageSize', String(filters.pageSize || 20));

  return useQuery<PaginatedResponse<RevenueDTO>>({
    queryKey: ['revenues', filters],
    queryFn: () => api.get(`/revenue?${params}`).then((r) => r.data),
  });
}

export function useRevenueStats() {
  return useQuery<RevenueStats>({
    queryKey: ['revenue-stats'],
    queryFn: () => api.get('/revenue/stats').then((r) => r.data),
  });
}

export function useCreateRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRevenueRequest) => api.post('/revenue', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revenues'] });
      qc.invalidateQueries({ queryKey: ['revenue-stats'] });
      toast.success('Revenu ajouté');
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });
}
