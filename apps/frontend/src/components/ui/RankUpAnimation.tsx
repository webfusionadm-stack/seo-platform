import { useEffect, useState } from 'react';
import { RANK_EMOJIS, RANK_LABELS, type RankInfo } from '../../hooks/useRank';

interface Props {
  rank: RankInfo;
  onClose: () => void;
}

export default function RankUpAnimation({ rank, onClose }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="rank-up-overlay" onClick={onClose}>
      {/* Particle burst */}
      <div className="rank-up-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: rank.color,
              left: '50%',
              top: '50%',
              animation: `rank-particle-${i % 4} 1.5s ease-out ${i * 0.05}s forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <div className="text-center relative z-10">
        <div className="rank-up-text text-sm font-arcade text-gold tracking-[0.3em] mb-4">
          ⚔ RANK UP ⚔
        </div>
        <div
          className="rank-up-badge text-8xl mb-6"
          style={{ filter: `drop-shadow(0 0 30px ${rank.color})` }}
        >
          {RANK_EMOJIS[rank.name] || '🏅'}
        </div>
        <div
          className="rank-up-text font-arcade text-4xl font-bold mb-2"
          style={{ color: rank.color, textShadow: `0 0 30px ${rank.color}` }}
        >
          {RANK_LABELS[rank.name] || rank.name}
        </div>
        <div className="rank-up-text text-gray-400 text-sm mt-4">
          Cliquez pour continuer
        </div>
      </div>
    </div>
  );
}
