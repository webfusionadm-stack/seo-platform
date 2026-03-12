import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrder, useUpdateOrder, useDeleteOrder } from '../hooks/useOrders';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ORDER_STATUSES } from '@seo-platform/shared';

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const STATUS_LABEL: Record<string, string> = { PENDING: 'En attente', IN_PROGRESS: 'En cours', PUBLISHED: 'Publié', COMPLETED: 'Terminé' };

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  if (isLoading) return <LoadingSpinner text="Chargement de la quête..." />;
  if (!order) return <p className="text-center py-8 text-gray-500 font-arcade">Quête non trouvée</p>;

  const handleStatusChange = (status: string) => {
    updateOrder.mutate({ id: order.id, data: { status: status as 'PENDING' | 'IN_PROGRESS' | 'PUBLISHED' | 'COMPLETED' } });
  };

  const handleDelete = () => {
    if (window.confirm('Supprimer cette quête ?')) {
      deleteOrder.mutate(order.id, { onSuccess: () => navigate('/orders') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="text-gray-500 hover:text-gray-300 transition-colors">← Retour</Link>
        <h1 className="font-arcade text-xl text-gold tracking-wider">📜 QUÊTE : {order.clientName}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <div className="game-card p-6 space-y-4">
          <h2 className="font-arcade text-xs text-gold/80 tracking-wider">📋 INFORMATIONS</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Client', value: order.clientName },
              { label: 'Email', value: order.clientEmail || '-' },
              { label: 'Texte d\'ancre', value: order.anchorText },
              { label: 'Site', value: order.siteName },
            ].map((item) => (
              <div key={item.label}>
                <span className="text-gray-500 text-xs">{item.label}</span>
                <p className="font-medium text-gray-200">{item.value}</p>
              </div>
            ))}
            <div>
              <span className="text-gray-500 text-xs">URL cible</span>
              <p><a href={order.clientUrl} target="_blank" rel="noopener noreferrer" className="text-cyber hover:text-cyber-light text-sm">{order.clientUrl}</a></p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Récompense</span>
              <p className="font-bold text-gold text-lg">{fmt.format(order.price)}</p>
            </div>
          </div>
          {order.brief && (
            <div>
              <span className="text-gray-500 text-xs">Brief</span>
              <p className="text-sm mt-1 bg-dark-800 rounded-lg p-3 text-gray-300 border border-dark-400">{order.brief}</p>
            </div>
          )}
          <div>
            <span className="text-gray-500 text-xs">Créée le</span>
            <p className="text-sm text-gray-300">{new Date(order.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="game-card p-6 space-y-4">
            <h2 className="font-arcade text-xs text-gold/80 tracking-wider">⚔ ACTIONS</h2>
            <div>
              <label className="label-game">Changer le statut</label>
              <select value={order.status} onChange={(e) => handleStatusChange(e.target.value)} className="select-game">
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
              </select>
            </div>

            {!order.articleId && (
              <Link
                to={`/sponsored-articles/new?orderId=${order.id}&siteId=${order.siteId}&anchorText=${encodeURIComponent(order.anchorText)}&targetUrl=${encodeURIComponent(order.clientUrl)}&brief=${encodeURIComponent(order.brief || '')}`}
                className="btn-sakura w-full block text-center text-sm">
                🔗 FORGER L'ARTICLE SPONSORISÉ
              </Link>
            )}

            {order.articleId && (
              <Link to={`/sponsored-articles/${order.articleId}`} className="btn-royal w-full block text-center text-sm">
                📄 VOIR L'ARTICLE
              </Link>
            )}

            <button onClick={handleDelete}
              className="w-full px-4 py-2.5 border border-danger/30 text-danger rounded-lg hover:bg-danger/10 transition-colors text-sm font-bold">
              🗑 SUPPRIMER LA QUÊTE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
