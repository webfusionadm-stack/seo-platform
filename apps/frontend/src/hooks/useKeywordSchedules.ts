import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { KeywordScheduleDTO, CreateBulkScheduleRequest, BulkScheduleResponse, PaginatedResponse } from '@seo-platform/shared';
import toast from 'react-hot-toast';

interface ScheduleFilters {
  page?: number;
  pageSize?: number;
  status?: string;
}

export function useKeywordSchedules(filters: ScheduleFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page || 1));
  params.set('pageSize', String(filters.pageSize || 20));
  if (filters.status) params.set('status', filters.status);

  const query = useQuery<PaginatedResponse<KeywordScheduleDTO>>({
    queryKey: ['keyword-schedules', filters],
    queryFn: () => api.get(`/keyword-schedules?${params}`).then((r) => r.data),
    refetchInterval: (query) => {
      const hasGenerating = query.state.data?.data?.some((s) => s.status === 'GENERATING');
      return hasGenerating ? 5000 : 30000;
    },
  });

  return query;
}

export function useCreateBulkSchedule() {
  const qc = useQueryClient();
  return useMutation<BulkScheduleResponse, Error, CreateBulkScheduleRequest>({
    mutationFn: (data) => api.post('/keyword-schedules/bulk', data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['keyword-schedules'] });
      toast.success(`${data.created} mot(s)-clé(s) planifié(s)`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || err?.message || 'Erreur lors de la planification';
      toast.error(msg);
    },
  });
}

interface UpdateScheduleData {
  keyword?: string;
  category?: string;
  wordCount?: number;
  tone?: string;
  scheduledAt?: string;
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleData }) =>
      api.patch(`/keyword-schedules/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keyword-schedules'] });
      toast.success('Planification mise à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useGenerateNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/keyword-schedules/${id}/generate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keyword-schedules'] });
      toast.success('Génération lancée');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors du lancement';
      toast.error(msg);
    },
  });
}

export function useGenerateAll() {
  const qc = useQueryClient();
  return useMutation<{ message: string; count: number }, Error>({
    mutationFn: () => api.post('/keyword-schedules/generate-all').then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['keyword-schedules'] });
      toast.success(`Génération lancée pour ${data.count} planification(s)`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors du lancement';
      toast.error(msg);
    },
  });
}

export function useCancelGeneration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/keyword-schedules/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keyword-schedules'] });
      toast.success('Génération annulée');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Erreur lors de l\'annulation';
      toast.error(msg);
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/keyword-schedules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keyword-schedules'] });
      toast.success('Planification supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}
