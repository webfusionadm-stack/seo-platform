import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export interface RankInfo {
  name: string;
  color: string;
  icon: string;
  min: number;
  max: number;
}

export interface RankData {
  totalRevenue: number;
  currentRank: RankInfo;
  nextRank: { name: string; color: string; min: number } | null;
  progressPercent: number;
  amountToNext: number;
  allRanks: RankInfo[];
}

export function useRank() {
  return useQuery<RankData>({
    queryKey: ['rank'],
    queryFn: () => api.get('/rank').then((r) => r.data),
    refetchInterval: 30000,
  });
}

export const RANK_EMOJIS: Record<string, string> = {
  BRONZE: '🥉',
  ARGENT: '🥈',
  OR: '🥇',
  PLATINE: '💎',
  DIAMANT: '🏆',
  LEGENDAIRE: '👑',
};

export const RANK_LABELS: Record<string, string> = {
  BRONZE: 'Bronze',
  ARGENT: 'Argent',
  OR: 'Or',
  PLATINE: 'Platine',
  DIAMANT: 'Diamant',
  LEGENDAIRE: 'Légendaire',
};
