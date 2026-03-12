import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ArticleStatus } from '@seo-platform/shared';
import { useArticles, useDeleteAllArticles } from '../hooks/useArticles';
import { useSites } from '../hooks/useSites';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

const STATUS_OPTIONS: { value: ArticleStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'GENERATING', label: 'Génération...' },
  { value: 'REVIEW', label: 'À relire' },
  { value: 'SCHEDULED', label: 'Planifié' },
  { value: 'PUBLISHED', label: 'Publié' },
  { value: 'WAITING_REDACTION', label: 'En attente de rédaction' },
  { value: 'IMAGE_PENDING', label: 'Image en attente' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'PUBLISH_FAILED', label: 'Échec publication' },
];

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const formatDateTime = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function SeoArticlesPage() {
  const navigate = useNavigate();
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: sites } = useSites();
  const deleteAll = useDeleteAllArticles();
  const { data: res, isLoading } = useArticles({
    siteId: siteFilter || undefined, status: statusFilter || undefined,
    type: 'SEO_CONTENT', page, pageSize: 20,
  });

  const articles = res?.data ?? [];
  const totalPages = res?.totalPages ?? 1;
  const total = res?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">SEO FORGE</h1>
          <p className="text-gray-500 text-sm mt-1">{total} article{total !== 1 ? 's' : ''} forgé{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-ghost text-xs text-danger hover:bg-danger/10"
            >
              TOUT SUPPRIMER
            </button>
          )}
          <Link to="/seo-articles/new" className="btn-gold">FORGER UN ARTICLE</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="game-card p-4 flex flex-wrap gap-4">
        <div className="min-w-[160px]">
          <label className="label-game">Site</label>
          <select value={siteFilter} onChange={(e) => { setSiteFilter(e.target.value); setPage(1); }} className="select-game">
            <option value="">Tous les sites</option>
            {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="label-game">Statut</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select-game">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? <LoadingSpinner text="Chargement des articles..." /> : articles.length === 0 ? (
        <EmptyState icon="✍️" title="AUCUN ARTICLE SEO" description="Forgez votre premier article SEO." />
      ) : (
        <div className="game-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-game">
              <thead>
                <tr>
                  <th>Titre</th><th>Site</th><th>Catégorie</th><th>Statut</th><th>Mots</th><th>Publication</th><th>Créé le</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id} onClick={() => navigate(`/seo-articles/${a.id}`)} className="cursor-pointer">
                    <td>
                      <span className="text-sm font-medium text-cyber hover:text-cyber-light transition-colors">
                        {a.title || 'Sans titre'}
                      </span>
                      {a.keyword && <div className="text-xs text-gray-500 mt-0.5">{a.keyword}</div>}
                    </td>
                    <td className="text-gray-400 text-sm">{a.siteName ?? '-'}</td>
                    <td className="text-gray-400 text-sm">{a.category || '—'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="text-gray-400 text-sm">{a.wordCount}</td>
                    <td className="text-sm">
                      {a.status === 'PUBLISH_FAILED' ? (
                        <div>
                          <span className="text-red-400 text-xs">Échec ({a.publishRetryCount}/5)</span>
                          {a.publishError && <div className="text-red-400/70 text-[10px] mt-0.5 truncate max-w-[160px]" title={a.publishError}>{a.publishError}</div>}
                        </div>
                      ) : a.status === 'SCHEDULED' && a.scheduledPublishAt ? (
                        <span className="text-cyan-400">{formatDateTime(a.scheduledPublishAt)}</span>
                      ) : a.status === 'PUBLISHED' && a.wpPostUrl ? (
                        <span className="text-emerald-400">{formatDate(a.updatedAt)}</span>
                      ) : a.scheduledPublishAt ? (
                        <span className="text-gray-500">{formatDateTime(a.scheduledPublishAt)}</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="text-gray-500 text-sm">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-400/50">
              <span className="text-xs text-gray-500">Page {page}/{totalPages} ({total} résultats)</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost text-xs disabled:opacity-30">
                  ← Préc
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let n: number;
                  if (totalPages <= 7) n = i + 1;
                  else if (page <= 4) n = i + 1;
                  else if (page >= totalPages - 3) n = totalPages - 6 + i;
                  else n = page - 3 + i;
                  return (
                    <button key={n} onClick={() => setPage(n)}
                      className={`px-2.5 py-1 text-xs rounded ${n === page ? 'bg-royal text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                      {n}
                    </button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost text-xs disabled:opacity-30">
                  Suiv →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-arcade text-sm text-danger tracking-wider">SUPPRIMER TOUS LES ARTICLES</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-500 hover:text-gray-300 text-lg">✕</button>
            </div>
            <div className="modal-body">
              <p className="text-gray-300 text-sm">
                Cette action va supprimer <strong>{total} article(s)</strong> de LinkForge.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Les articles déjà publiés sur WordPress ne seront pas affectés.
              </p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-400">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-sm">
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteAll.mutate(undefined, { onSuccess: () => setShowDeleteConfirm(false) });
                }}
                disabled={deleteAll.isPending}
                className="px-4 py-2 bg-danger/20 text-danger border border-danger/50 rounded-lg text-sm hover:bg-danger/30 transition-colors disabled:opacity-50"
              >
                {deleteAll.isPending ? 'Suppression...' : 'CONFIRMER LA SUPPRESSION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
