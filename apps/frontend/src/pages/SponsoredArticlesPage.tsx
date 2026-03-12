import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ArticleStatus } from '@seo-platform/shared';
import { useArticles } from '../hooks/useArticles';
import { useSites } from '../hooks/useSites';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

const STATUS_OPTIONS: { value: ArticleStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'GENERATING', label: 'Génération...' },
  { value: 'REVIEW', label: 'À relire' },
  { value: 'PUBLISHED', label: 'Publié' },
];

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function SponsoredArticlesPage() {
  const [siteFilter, setSiteFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: sites } = useSites();
  const { data: res, isLoading } = useArticles({
    siteId: siteFilter || undefined, status: statusFilter || undefined,
    type: 'SPONSORED', page, pageSize: 20,
  });

  const articles = res?.data ?? [];
  const totalPages = res?.totalPages ?? 1;
  const total = res?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">LINK CRAFT</h1>
          <p className="text-gray-500 text-sm mt-1">{total} article{total !== 1 ? 's' : ''} sponsorisé{total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/sponsored-articles/new" className="btn-sakura">TISSER UN LIEN</Link>
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
        <EmptyState icon="🔗" title="AUCUN ARTICLE SPONSORISÉ" description="Tissez votre premier lien." />
      ) : (
        <div className="game-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-game">
              <thead>
                <tr>
                  <th>Titre</th><th>Site</th><th>Statut</th><th>Mots</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/sponsored-articles/${a.id}`} className="text-sm font-medium text-cyber hover:text-cyber-light transition-colors">
                        {a.title || 'Sans titre'}
                      </Link>
                      {a.keyword && <div className="text-xs text-gray-500 mt-0.5">{a.keyword}</div>}
                    </td>
                    <td className="text-gray-400 text-sm">{a.siteName ?? '-'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="text-gray-400 text-sm">{a.wordCount}</td>
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
    </div>
  );
}
