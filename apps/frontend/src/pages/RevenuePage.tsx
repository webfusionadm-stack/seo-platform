import { useState } from 'react';
import { useRevenues, useRevenueStats, useCreateRevenue } from '../hooks/useRevenue';
import { useSites } from '../hooks/useSites';
import { useRank, RANK_EMOJIS, RANK_LABELS } from '../hooks/useRank';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import RankBadge from '../components/ui/RankBadge';
import XPBar from '../components/ui/XPBar';
import { STATUS_LABELS, REVENUE_TYPES } from '@seo-platform/shared';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const COLORS = ['#7c3aed', '#10b981', '#fbbf24', '#ef4444', '#06b6d4', '#f472b6'];

const RANK_LINES = [
  { value: 500, label: 'Argent', color: '#c0c0c0' },
  { value: 1500, label: 'Or', color: '#fbbf24' },
  { value: 3000, label: 'Platine', color: '#06b6d4' },
  { value: 5000, label: 'Diamant', color: '#7c3aed' },
  { value: 7500, label: 'Légendaire', color: '#f59e0b' },
];

export default function RevenuePage() {
  const [filters, setFilters] = useState({ siteId: '', type: '', page: 1 });
  const [showForm, setShowForm] = useState(false);
  const { data: revenues, isLoading } = useRevenues(filters);
  const { data: stats } = useRevenueStats();
  const { data: sites } = useSites();
  const { data: rank } = useRank();
  const createRevenue = useCreateRevenue();

  const rankColor = rank?.currentRank?.color || '#cd7f32';
  const rankName = rank?.currentRank?.name || 'BRONZE';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createRevenue.mutate({
      amount: parseFloat(fd.get('amount') as string),
      type: fd.get('type') as 'SPONSORED_ARTICLE' | 'LINK_SALE' | 'OTHER',
      description: (fd.get('description') as string) || undefined,
      date: (fd.get('date') as string) || undefined,
      siteId: fd.get('siteId') as string,
    }, { onSuccess: () => setShowForm(false) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">💰 TREASURE</h1>
          <p className="text-gray-500 text-sm mt-1">Suivez votre trésor et votre progression</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-gold">💎 AJOUTER UN BUTIN</button>
      </div>

      {/* Rank Section */}
      {rank && (
        <div className="game-card p-6" style={{ borderColor: `${rankColor}40` }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-float" style={{ filter: `drop-shadow(0 0 20px ${rankColor})` }}>
                {RANK_EMOJIS[rankName]}
              </div>
              <div>
                <div className="text-[10px] font-arcade text-gray-500 tracking-wider">RANG</div>
                <div className="font-arcade text-2xl font-bold" style={{ color: rankColor }}>{RANK_LABELS[rankName]}</div>
                <div className="text-sm text-gray-400 mt-0.5">Trésor total : {fmt.format(rank.totalRevenue)}</div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <XPBar current={rank.totalRevenue} max={rank.nextRank?.min || rank.currentRank.max} rankColor={rankColor} size="lg" />
              {rank.nextRank && (
                <p className="text-xs text-gray-500 mt-2 text-center font-arcade">
                  Encore {rank.amountToNext.toLocaleString('fr-FR')}€ pour le rang{' '}
                  <span style={{ color: rank.nextRank.color }}>{RANK_LABELS[rank.nextRank.name]}</span> !
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="game-card p-4">
            <p className="text-[9px] font-arcade text-gray-500 tracking-wider">TRÉSOR TOTAL</p>
            <p className="text-2xl font-bold text-gold mt-1">{fmt.format(stats.total)}</p>
          </div>
          <div className="game-card p-4">
            <p className="text-[9px] font-arcade text-gray-500 tracking-wider">BUTIN DU MOIS</p>
            <p className="text-2xl font-bold text-emerald mt-1">{fmt.format(stats.monthly)}</p>
          </div>
          <div className="game-card p-4 col-span-1 md:col-span-2">
            <p className="text-[9px] font-arcade text-gray-500 tracking-wider mb-2">PAR TYPE</p>
            <div className="space-y-1">
              {stats.byType.map((t) => (
                <div key={t.type} className="flex justify-between text-sm">
                  <span className="text-gray-400">{STATUS_LABELS[t.type] || t.type}</span>
                  <span className="font-bold text-gray-200">{fmt.format(t.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="game-card p-6">
            <h3 className="font-arcade text-xs text-gold/80 tracking-wider mb-4">📊 REVENUS PAR MOIS</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.byMonth}>
                <defs>
                  <linearGradient id="treasureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#231b45" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
                {RANK_LINES.map((rl) => (
                  <ReferenceLine key={rl.label} y={rl.value} stroke={rl.color} strokeDasharray="3 3" strokeOpacity={0.4} />
                ))}
                <Tooltip
                  formatter={(value: number) => [fmt.format(value), 'Montant']}
                  contentStyle={{ backgroundColor: '#15102a', border: '1px solid #fbbf2440', borderRadius: '0.5rem', color: '#e5e7eb', fontSize: '0.75rem' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#treasureGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="game-card p-6">
            <h3 className="font-arcade text-xs text-gold/80 tracking-wider mb-4">🏯 PAR SITE</h3>
            {stats.bySite.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.bySite} dataKey="total" nameKey="siteName" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="#0d0820"
                    label={({ siteName, total }) => `${siteName}: ${fmt.format(total)}`}>
                    {stats.bySite.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => fmt.format(value)}
                    contentStyle={{ backgroundColor: '#15102a', border: '1px solid #fbbf2440', borderRadius: '0.5rem', color: '#e5e7eb' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 py-12">Aucune donnée</p>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filters.siteId} onChange={(e) => setFilters({ ...filters, siteId: e.target.value, page: 1 })} className="select-game w-48">
          <option value="">Tous les sites</option>
          {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })} className="select-game w-48">
          <option value="">Tous les types</option>
          {REVENUE_TYPES.map((t) => <option key={t} value={t}>{STATUS_LABELS[t]}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? <LoadingSpinner /> : !revenues?.data.length ? (
        <EmptyState icon="💰" title="AUCUN BUTIN" action={<button onClick={() => setShowForm(true)} className="btn-gold">💎 AJOUTER</button>} />
      ) : (
        <>
          <div className="game-card overflow-hidden">
            <table className="table-game">
              <thead>
                <tr><th>Date</th><th>Site</th><th>Type</th><th>Description</th><th className="text-right">Montant</th></tr>
              </thead>
              <tbody>
                {revenues.data.map((r) => (
                  <tr key={r.id}>
                    <td className="text-gray-400 text-sm">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                    <td className="text-gray-300 text-sm">{r.siteName}</td>
                    <td><span className="badge badge-royal text-[10px]">{STATUS_LABELS[r.type] || r.type}</span></td>
                    <td className="text-gray-500 text-sm">{r.description || '-'}</td>
                    <td className="text-right font-bold text-emerald text-sm">{fmt.format(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {revenues.totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-4">
              {Array.from({ length: revenues.totalPages }, (_, i) => (
                <button key={i} onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`px-2.5 py-1 text-xs rounded ${filters.page === i + 1 ? 'bg-royal text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="💎 AJOUTER UN BUTIN">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-game">Site *</label>
            <select name="siteId" required className="select-game">
              <option value="">Sélectionner...</option>
              {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-game">Montant (EUR) *</label>
              <input name="amount" type="number" step="0.01" min="0" required className="input-game" />
            </div>
            <div>
              <label className="label-game">Type *</label>
              <select name="type" required className="select-game">
                {REVENUE_TYPES.map((t) => <option key={t} value={t}>{STATUS_LABELS[t]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-game">Description</label>
            <input name="description" className="input-game" />
          </div>
          <div>
            <label className="label-game">Date</label>
            <input name="date" type="date" className="input-game" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={createRevenue.isPending} className="btn-gold disabled:opacity-50">
              {createRevenue.isPending ? 'Ajout...' : '💎 AJOUTER'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
