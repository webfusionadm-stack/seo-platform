import { RANK_EMOJIS, RANK_LABELS, type RankInfo } from '../../hooks/useRank';

interface Props {
  rank: RankInfo;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function RankBadge({ rank, size = 'md', showLabel = true }: Props) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-lg px-4 py-2 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-arcade font-bold rounded-full ${sizeClasses[size]} animate-glow-pulse`}
      style={{
        '--rank-color': rank.color,
        color: rank.color,
        backgroundColor: `${rank.color}15`,
        border: `1px solid ${rank.color}40`,
      } as React.CSSProperties}
    >
      <span>{RANK_EMOJIS[rank.name] || '🥉'}</span>
      {showLabel && <span>{RANK_LABELS[rank.name] || rank.name}</span>}
    </span>
  );
}
