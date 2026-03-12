import { Router } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

const RANK_THRESHOLDS = [
  { name: 'BRONZE', min: 0, max: 500, color: '#cd7f32', icon: 'shield' },
  { name: 'ARGENT', min: 501, max: 1500, color: '#c0c0c0', icon: 'shield' },
  { name: 'OR', min: 1501, max: 3000, color: '#fbbf24', icon: 'trophy' },
  { name: 'PLATINE', min: 3001, max: 5000, color: '#06b6d4', icon: 'gem' },
  { name: 'DIAMANT', min: 5001, max: 7500, color: '#7c3aed', icon: 'diamond' },
  { name: 'LEGENDAIRE', min: 7501, max: 10000, color: '#f59e0b', icon: 'crown' },
];

router.get('/', async (_req, res, next) => {
  try {
    const result = await prisma.revenue.aggregate({
      _sum: { amount: true },
    });

    const totalRevenue = result._sum.amount || 0;

    let currentRank = RANK_THRESHOLDS[0];
    for (const rank of RANK_THRESHOLDS) {
      if (totalRevenue >= rank.min) {
        currentRank = rank;
      }
    }

    const currentIndex = RANK_THRESHOLDS.indexOf(currentRank);
    const nextRank = currentIndex < RANK_THRESHOLDS.length - 1
      ? RANK_THRESHOLDS[currentIndex + 1]
      : null;

    const progressInCurrentRank = totalRevenue - currentRank.min;
    const currentRankRange = currentRank.max - currentRank.min;
    const progressPercent = Math.min(
      (progressInCurrentRank / currentRankRange) * 100,
      100
    );

    res.json({
      totalRevenue,
      currentRank: {
        name: currentRank.name,
        color: currentRank.color,
        icon: currentRank.icon,
        min: currentRank.min,
        max: currentRank.max,
      },
      nextRank: nextRank
        ? { name: nextRank.name, color: nextRank.color, min: nextRank.min }
        : null,
      progressPercent,
      amountToNext: nextRank ? nextRank.min - totalRevenue : 0,
      allRanks: RANK_THRESHOLDS,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
