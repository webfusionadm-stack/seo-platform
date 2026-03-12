import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDashboard } from '../hooks/useDashboard';
import { useRank, RANK_EMOJIS, RANK_LABELS } from '../hooks/useRank';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import RankBadge from '../components/ui/RankBadge';
import XPBar from '../components/ui/XPBar';

const formatEUR = (value: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  glowClass: string;
  textClass: string;
}

function StatCard({ label, value, icon, glowClass, textClass }: StatCardProps) {
  return (
    <div className={`game-card p-5 group hover:${glowClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-[10px] font-arcade text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${textClass}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboard();
  const { data: rank } = useRank();

  if (isLoading) return <LoadingSpinner text="Chargement du Command Center..." />;
  if (isError || !stats) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-danger text-sm font-arcade">Erreur de chargement des données.</p>
    </div>
  );

  const rankColor = rank?.currentRank?.color || '#cd7f32';
  const rankName = rank?.currentRank?.name || 'BRONZE';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-arcade text-xl text-gold tracking-wider">⚔ COMMAND CENTER</h1>
          {rank && <RankBadge rank={rank.currentRank} size="sm" />}
        </div>
        <p className="text-gray-500 text-sm">
          Bienvenue, <span style={{ color: rankColor }} className="font-bold">{RANK_LABELS[rankName]}</span>.
          Voici l'état de votre empire.
        </p>
      </div>

      {/* Rank Card */}
      {rank && (
        <div
          className="game-card p-6"
          style={{ borderColor: `${rankColor}40` }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div
                className="text-5xl animate-float"
                style={{ filter: `drop-shadow(0 0 20px ${rankColor})` }}
              >
                {RANK_EMOJIS[rankName]}
              </div>
              <div>
                <div className="text-[10px] font-arcade text-gray-500 tracking-wider">RANG ACTUEL</div>
                <div className="font-arcade text-2xl font-bold" style={{ color: rankColor }}>
                  {RANK_LABELS[rankName]}
                </div>
                <div className="text-sm text-gray-400 mt-0.5">
                  CA total : {formatEUR(rank.totalRevenue)}
                </div>
              </div>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <XPBar
                current={rank.totalRevenue}
                max={rank.nextRank?.min || rank.currentRank.max}
                rankColor={rankColor}
                size="lg"
              />
              {rank.nextRank && (
                <p className="text-xs text-gray-500 mt-2 text-center font-arcade">
                  Encore {rank.amountToNext.toLocaleString('fr-FR')}€ pour atteindre le rang{' '}
                  <span style={{ color: rank.nextRank.color }}>{RANK_LABELS[rank.nextRank.name]}</span> !
                </p>
              )}
            </div>
          </div>
          {/* All ranks display */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-400/50">
            {rank.allRanks.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                style={{
                  opacity: rank.totalRevenue >= r.min ? 1 : 0.3,
                  color: r.color,
                  backgroundColor: `${r.color}10`,
                  border: `1px solid ${r.color}${rank.totalRevenue >= r.min ? '40' : '15'}`,
                }}
              >
                <span>{RANK_EMOJIS[r.name]}</span>
                <span className="font-arcade hidden sm:inline" style={{ fontSize: '9px' }}>
                  {RANK_LABELS[r.name]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Sites" value={stats.totalSites} icon="🏯" glowClass="glow-violet" textClass="text-royal-light" />
        <StatCard label="Actifs" value={stats.activeSites} icon="✅" glowClass="glow-emerald" textClass="text-emerald" />
        <StatCard label="Articles" value={stats.totalArticles} icon="📄" glowClass="glow-cyan" textClass="text-cyber" />
        <StatCard label="Publiés" value={stats.publishedArticles} icon="🏆" glowClass="glow-gold" textClass="text-gold" />
        <StatCard label="Quêtes" value={stats.pendingOrders} icon="📜" glowClass="glow-violet" textClass="text-sakura" />
        <StatCard label="CA mensuel" value={formatEUR(stats.monthlyRevenue)} icon="💰" glowClass="glow-emerald" textClass="text-emerald" />
      </div>

      {/* Revenue Chart */}
      <div className="game-card p-6">
        <h2 className="font-arcade text-sm text-gold/80 tracking-wider mb-4">
          💰 REVENUS PAR MOIS
        </h2>
        {stats.revenueByMonth.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">Aucune donnée de revenus.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.revenueByMonth} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#231b45" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v: number) => `${v}€`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
              <Tooltip
                formatter={(value: number) => [formatEUR(value), 'Montant']}
                contentStyle={{
                  backgroundColor: '#15102a',
                  border: '1px solid #fbbf2440',
                  borderRadius: '0.5rem',
                  color: '#e5e7eb',
                  fontSize: '0.8rem',
                }}
              />
              <Area type="monotone" dataKey="amount" stroke="#7c3aed" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent articles */}
        <div className="game-card p-6">
          <h2 className="font-arcade text-sm text-gold/80 tracking-wider mb-4">
            ⚔ DERNIÈRES BATAILLES
          </h2>
          {stats.recentArticles.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Aucun article.</p>
          ) : (
            <ul className="divide-y divide-dark-400/50">
              {stats.recentArticles.map((article) => (
                <li key={article.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-200 truncate">{article.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {article.siteName ?? '—'} · {article.wordCount.toLocaleString('fr-FR')} mots
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <StatusBadge status={article.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top sites */}
        <div className="game-card p-6">
          <h2 className="font-arcade text-sm text-gold/80 tracking-wider mb-4">
            🏯 CLASSEMENT DES DOMAINES
          </h2>
          {stats.topSites.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Aucun site.</p>
          ) : (
            <ul className="divide-y divide-dark-400/50">
              {stats.topSites.map((site, i) => (
                <li key={site.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-gold/50 font-arcade text-xs w-5">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{site.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {site.domain} · DA {site.da ?? '—'} · DR {site.dr ?? '—'}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-emerald">{formatEUR(site.revenue)}</p>
                    <StatusBadge status={site.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
