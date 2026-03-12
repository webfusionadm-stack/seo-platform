interface Props {
  current: number;
  max: number;
  rankColor: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function XPBar({ current, max, rankColor, showLabels = true, size = 'md' }: Props) {
  const percent = Math.min((current / max) * 100, 100);
  const heightClass = { sm: 'h-2', md: 'h-3', lg: 'h-4' }[size];

  return (
    <div className="w-full">
      <div
        className={`relative ${heightClass} bg-dark-800 rounded-full overflow-hidden border border-dark-400`}
        style={{ '--rank-color': rankColor } as React.CSSProperties}
      >
        <div
          className="xp-bar-fill h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${rankColor}, color-mix(in srgb, ${rankColor} 70%, white))`,
          }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1 text-xs">
          <span className="text-gray-400">{current.toLocaleString('fr-FR')}€</span>
          <span style={{ color: rankColor }} className="font-bold">
            {max.toLocaleString('fr-FR')}€
          </span>
        </div>
      )}
    </div>
  );
}
