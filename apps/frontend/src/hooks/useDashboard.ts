import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { DashboardStats } from '@seo-platform/shared';

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });
}
