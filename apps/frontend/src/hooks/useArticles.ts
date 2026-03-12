import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { ArticleDTO, CreateArticleRequest, UpdateArticleRequest, PaginatedResponse } from '@seo-platform/shared';
import toast from 'react-hot-toast';

interface ArticleFilters {
  siteId?: string;
  status?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export function useArticles(filters: ArticleFilters = {}) {
  const params = new URLSearchParams();
  if (filters.siteId) params.set('siteId', filters.siteId);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  params.set('page', String(filters.page || 1));
  params.set('pageSize', String(filters.pageSize || 20));

  return useQuery<PaginatedResponse<ArticleDTO>>({
    queryKey: ['articles', filters],
    queryFn: () => api.get(`/articles?${params}`).then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data?.data;
      const hasGenerating = data?.some((a) => a.status === 'GENERATING');
      const hasScheduled = data?.some((a) => a.status === 'SCHEDULED');
      return hasGenerating ? 5000 : hasScheduled ? 30000 : false;
    },
  });
}

export function useArticle(id: string | undefined) {
  return useQuery<ArticleDTO>({
    queryKey: ['articles', id],
    queryFn: () => api.get(`/articles/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArticleRequest) => api.post('/articles', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article créé');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleRequest }) =>
      api.put(`/articles/${id}`, data).then((r) => r.data),
    onSuccess: (data: ArticleDTO) => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      if (data.status === 'PUBLISHED') {
        toast.success('Article publié sur WordPress !');
      } else {
        toast.success('Article mis à jour');
      }
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/articles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}

export function useDeleteAllArticles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/articles/all').then((r) => r.data),
    onSuccess: (data: { deleted: number }) => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      toast.success(`${data.deleted} article(s) supprimé(s)`);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}

export function useRetryPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/articles/${id}/retry-publish`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Publication relancée');
    },
    onError: () => toast.error('Erreur lors de la relance'),
  });
}

export function usePublishArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/articles/${id}/publish`).then((r) => r.data),
    onSuccess: (data: { wpPostUrl: string }) => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      toast.success(`Publié ! ${data.wpPostUrl}`);
    },
    onError: () => toast.error('Erreur de publication'),
  });
}
