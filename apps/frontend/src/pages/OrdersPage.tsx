import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, useCreateOrder, useDeleteOrder } from '../hooks/useOrders';
import { useSites } from '../hooks/useSites';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function getDifficulty(price: number): string {
  if (price < 50) return '★';
  if (price < 100) return '★★';
  if (price < 200) return '★★★';
  if (price < 500) return '★★★★';
  return '★★★★★';
}

export default function OrdersPage() {
  const [filters, setFilters] = useState({ siteId: '', status: '', page: 1 });
  const [showForm, setShowForm] = useState(false);
  const { data: orders, isLoading } = useOrders(filters);
  const { data: sites } = useSites();
  const createOrder = useCreateOrder();
  const deleteOrder = useDeleteOrder();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createOrder.mutate({
      clientName: fd.get('clientName') as string,
      clientEmail: (fd.get('clientEmail') as string) || undefined,
      clientUrl: fd.get('clientUrl') as string,
      anchorText: fd.get('anchorText') as string,
      brief: (fd.get('brief') as string) || undefined,
      price: parseFloat(fd.get('price') as string),
      siteId: fd.get('siteId') as string,
    }, { onSuccess: () => setShowForm(false) });
  };

  // Count by status
  const pending = orders?.data.filter((o) => o.status === 'PENDING').length ?? 0;
  const inProgress = orders?.data.filter((o) => o.status === 'IN_PROGRESS').length ?? 0;
  const published = orders?.data.filter((o) => o.status === 'PUBLISHED').length ?? 0;
  const completed = orders?.data.filter((o) => o.status === 'COMPLETED').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">📜 QUEST BOARD</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez les quêtes de vos clients</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-gold">📜 NOUVELLE QUÊTE</button>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'En attente', count: pending, color: 'text-gold', icon: '🟡' },
          { label: 'En rédaction', count: inProgress, color: 'text-cyber', icon: '🔵' },
          { label: 'Publiées', count: published, color: 'text-emerald', icon: '🟢' },
          { label: 'Facturées', count: completed, color: 'text-royal-light', icon: '🟣' },
        ].map((s) => (
          <div key={s.label} className="game-card p-3 text-center">
            <span className="text-lg">{s.icon}</span>
            <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-[9px] font-arcade text-gray-500 tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filters.siteId} onChange={(e) => setFilters({ ...filters, siteId: e.target.value, page: 1 })} className="select-game w-48">
          <option value="">Tous les sites</option>
          {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="select-game w-48">
          <option value="">Tous les statuts</option>
          {['PENDING', 'IN_PROGRESS', 'PUBLISHED', 'COMPLETED'].map((s) => (
            <option key={s} value={s}>{{ PENDING: 'En attente', IN_PROGRESS: 'En cours', PUBLISHED: 'Publié', COMPLETED: 'Terminé' }[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? <LoadingSpinner text="Chargement des quêtes..." /> : !orders?.data.length ? (
        <EmptyState icon="📜" title="AUCUNE QUÊTE" description="Créez votre première quête client."
          action={<button onClick={() => setShowForm(true)} className="btn-gold">📜 NOUVELLE QUÊTE</button>} />
      ) : (
        <>
          <div className="game-card overflow-hidden">
            <table className="table-game">
              <thead>
                <tr>
                  <th>Diff</th><th>Client</th><th>Site</th><th>Ancre</th><th>Récompense</th><th>Statut</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((o) => (
                  <tr key={o.id}>
                    <td className="text-gold text-sm">{getDifficulty(o.price)}</td>
                    <td>
                      <Link to={`/orders/${o.id}`} className="text-sm font-medium text-cyber hover:text-cyber-light">{o.clientName}</Link>
                    </td>
                    <td className="text-gray-400 text-sm">{o.siteName}</td>
                    <td className="text-gray-400 text-sm">{o.anchorText}</td>
                    <td className="font-bold text-gold text-sm">{fmt.format(o.price)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-gray-500 text-sm">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="flex gap-2">
                        {!o.articleId && (
                          <Link to={`/sponsored-articles/new?orderId=${o.id}&siteId=${o.siteId}&anchorText=${encodeURIComponent(o.anchorText)}&targetUrl=${encodeURIComponent(o.clientUrl)}&brief=${encodeURIComponent(o.brief || '')}`}
                            className="text-cyber hover:text-cyber-light text-xs">Forger</Link>
                        )}
                        <button onClick={() => window.confirm('Supprimer ?') && deleteOrder.mutate(o.id)}
                          className="text-danger hover:text-danger-light text-xs">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-4">
              {Array.from({ length: orders.totalPages }, (_, i) => (
                <button key={i} onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`px-2.5 py-1 text-xs rounded ${filters.page === i + 1 ? 'bg-royal text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="📜 NOUVELLE QUÊTE">
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
              <label className="label-game">Nom client *</label>
              <input name="clientName" required className="input-game" />
            </div>
            <div>
              <label className="label-game">Email client</label>
              <input name="clientEmail" type="email" className="input-game" />
            </div>
          </div>
          <div>
            <label className="label-game">URL client *</label>
            <input name="clientUrl" type="url" required placeholder="https://..." className="input-game" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-game">Ancre magique *</label>
              <input name="anchorText" required className="input-game" />
            </div>
            <div>
              <label className="label-game">Récompense (EUR) *</label>
              <input name="price" type="number" step="0.01" min="0" required className="input-game" />
            </div>
          </div>
          <div>
            <label className="label-game">Brief du client</label>
            <textarea name="brief" rows={3} className="textarea-game" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={createOrder.isPending} className="btn-gold disabled:opacity-50">
              {createOrder.isPending ? 'Création...' : '✦ CRÉER LA QUÊTE'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
