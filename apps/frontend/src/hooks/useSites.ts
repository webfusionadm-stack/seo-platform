import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { SiteDTO, CreateSiteRequest, UpdateSiteRequest } from '@seo-platform/shared';
import toast from 'react-hot-toast';

export function useSites() {
  return useQuery<SiteDTO[]>({
    queryKey: ['sites'],
    queryFn: () => api.get('/sites').then((r) => r.data),
  });
}

export function useSite(id: string | undefined) {
  return useQuery<SiteDTO>({
    queryKey: ['sites', id],
    queryFn: () => api.get(`/sites/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSiteRequest) => api.post('/sites', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site créé');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSiteRequest }) =>
      api.put(`/sites/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sites/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}

export function useTestConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/sites/${id}/test-connection`).then((r) => r.data),
    onSuccess: (data: { connected: boolean; wpUser?: string; error?: string }) => {
      qc.invalidateQueries({ queryKey: ['sites'] });
      if (data.connected) {
        toast.success(`Connecté en tant que ${data.wpUser}`);
      } else {
        toast.error(`Connexion échouée: ${data.error}`);
      }
    },
    onError: () => toast.error('Erreur de test'),
  });
}
