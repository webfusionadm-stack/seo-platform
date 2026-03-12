import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import type { PersonaDTO, CreatePersonaRequest, UpdatePersonaRequest, AnalyzePersonaSampleResponse } from '@seo-platform/shared';
import toast from 'react-hot-toast';

export function usePersonas() {
  return useQuery<PersonaDTO[]>({
    queryKey: ['personas'],
    queryFn: () => api.get('/personas').then((r) => r.data),
  });
}

export function usePersona(id: string | undefined) {
  return useQuery<PersonaDTO>({
    queryKey: ['personas', id],
    queryFn: () => api.get(`/personas/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePersonaRequest) => api.post('/personas', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona créé');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
}

export function useUpdatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonaRequest }) =>
      api.put(`/personas/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
}

export function useDeletePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/personas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}

export function useRegeneratePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<PersonaDTO>(`/personas/${id}/regenerate`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Persona regénéré par l\'IA');
    },
    onError: () => toast.error('Erreur lors de la regénération'),
  });
}

export function useAnalyzePersonaSample() {
  return useMutation({
    mutationFn: (sampleText: string) =>
      api.post<AnalyzePersonaSampleResponse>('/personas/analyze-sample', { sampleText }).then((r) => r.data),
    onError: () => toast.error('Erreur lors de l\'analyse de l\'article'),
  });
}
