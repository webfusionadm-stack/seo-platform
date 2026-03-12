import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import api from '../api/client';
import type { FreepikImageProposal } from '@seo-platform/shared';

interface SelectImageParams {
  articleId: string;
  freepikResourceId: number;
}

interface SelectImageResponse {
  featuredImageUrl: string;
  status?: string;
  scheduledPublishAt?: string;
}

export function useSelectImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: SelectImageParams): Promise<SelectImageResponse> => {
      const { data } = await api.post('/images/select', params);
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate article query to pick up status changes (e.g. REVIEW → SCHEDULED)
      qc.invalidateQueries({ queryKey: ['articles', variables.articleId] });
    },
  });
}

export function useSearchImages(keyword: string | null | undefined) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery<FreepikImageProposal[]>({
    queryKey: ['images', 'search', keyword, page],
    queryFn: async () => {
      const { data } = await api.get('/images/search', { params: { keyword, page } });
      return data.images;
    },
    enabled: !!keyword,
    staleTime: 5 * 60 * 1000,
  });

  const regenerate = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  return { ...query, regenerate };
}
