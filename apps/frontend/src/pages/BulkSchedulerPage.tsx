import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSites } from '../hooks/useSites';
import { useKeywordSchedules, useCreateBulkSchedule, useUpdateSchedule, useGenerateNow, useGenerateAll, useDeleteSchedule, useCancelGeneration } from '../hooks/useKeywordSchedules';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';


function computePreviewDates(count: number, articlesPerDay: number, preferredHours: number[]): Date[] {
  if (count === 0) return [];
  const hours = Array.from({ length: articlesPerDay }, (_, i) => preferredHours[i] ?? preferredHours[0] ?? 9);

  const dates: Date[] = [];
  const now = new Date();
  const startDay = new Date(now);
  startDay.setDate(startDay.getDate() + 1);
  startDay.setHours(0, 0, 0, 0);

  let dayOffset = 0;
  let slotInDay = 0;

  for (let i = 0; i < count; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hours[slotInDay], 0, 0, 0);
    dates.push(d);

    slotInDay++;
    if (slotInDay >= articlesPerDay) {
      slotInDay = 0;
      dayOffset++;
    }
  }
  return dates;
}

const formatDateTime = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const toDateInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toHour = (iso: string) => new Date(iso).getHours();

interface EditingSchedule {
  id: string;
  keyword: string;
  category: string;
  date: string;
  hour: number;
}

export default function BulkSchedulerPage() {
  const navigate = useNavigate();
  const { data: sites } = useSites();
  const [page, setPage] = useState(1);
  const { data: schedulesRes, isLoading } = useKeywordSchedules({ page, pageSize: 20 });
  const createBulk = useCreateBulkSchedule();
  const updateSchedule = useUpdateSchedule();
  const generateNow = useGenerateNow();
  const generateAll = useGenerateAll();
  const deleteSchedule = useDeleteSchedule();
  const cancelGeneration = useCancelGeneration();

  // Form state
  const [keywordsText, setKeywordsText] = useState('');
  const [siteId, setSiteId] = useState('');
  const [articlesPerDay, setArticlesPerDay] = useState(1);
  const [preferredHours, setPreferredHours] = useState<number[]>([9]);
  const [category, setCategory] = useState('');

  // Edit modal state
  const [editing, setEditing] = useState<EditingSchedule | null>(null);

  const keywords = useMemo(
    () => keywordsText.split('\n').map((k) => k.trim()).filter(Boolean),
    [keywordsText],
  );

  const previewDates = useMemo(
    () => computePreviewDates(keywords.length, articlesPerDay, preferredHours),
    [keywords.length, articlesPerDay, preferredHours],
  );

  const schedules = schedulesRes?.data ?? [];
  const totalPages = schedulesRes?.totalPages ?? 1;
  const pendingCount = schedules.filter((s) => s.status === 'PENDING').length;
  const hasGenerating = schedules.some((s) => s.status === 'GENERATING');

  const handleSubmit = () => {
    if (keywords.length === 0 || !siteId) return;
    createBulk.mutate({
      keywords,
      siteId,
      articlesPerDay,
      preferredHours,
      language: 'fr',
      ...(category.trim() ? { category: category.trim() } : {}),
    }, {
      onSuccess: () => {
        setKeywordsText('');
      },
    });
  };

  const handleRowClick = (s: typeof schedules[0]) => {
    if (s.articleId) {
      navigate(`/seo-articles/${s.articleId}`);
    } else if (s.status === 'PENDING') {
      setEditing({
        id: s.id,
        keyword: s.keyword,
        category: s.category || '',
        date: toDateInput(s.scheduledAt),
        hour: toHour(s.scheduledAt),
      });
    }
  };

  const handleEditSave = () => {
    if (!editing) return;
    const scheduled = new Date(editing.date);
    scheduled.setHours(editing.hour, 0, 0, 0);
    updateSchedule.mutate({
      id: editing.id,
      data: {
        keyword: editing.keyword,
        category: editing.category || undefined,
        scheduledAt: scheduled.toISOString(),
      },
    }, {
      onSuccess: () => setEditing(null),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-arcade text-xl text-gold tracking-wider">PLANIFICATION EN MASSE</h1>
        <p className="text-gray-500 text-sm mt-1">Planifiez jusqu'a 30 articles SEO en une seule fois</p>
      </div>

      {/* Formulaire */}
      <div className="game-card p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Keywords */}
          <div>
            <label className="label-game">
              Mots-cles (1 par ligne, max 30)
            </label>
            <textarea
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={10}
              className="input-game w-full font-mono text-sm"
              placeholder={"meilleur hébergement web 2026\ncomment créer un blog\nSEO pour débutants\n..."}
            />
            <div className="text-xs text-gray-500 mt-1">
              {keywords.length}/30 mot(s)-clé(s)
              {keywords.length > 30 && <span className="text-danger ml-2">Maximum dépassé !</span>}
            </div>
          </div>

          {/* Right: Options */}
          <div className="space-y-4">
            <div>
              <label className="label-game">Site</label>
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="select-game w-full">
                <option value="">Sélectionner un site</option>
                {sites?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-game">Articles / jour</label>
                <select
                  value={articlesPerDay}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setArticlesPerDay(val);
                    setPreferredHours((prev) =>
                      val === 2
                        ? [prev[0] ?? 9, prev[1] ?? 14]
                        : [prev[0] ?? 9]
                    );
                  }}
                  className="select-game w-full"
                >
                  <option value={1}>1 par jour</option>
                  <option value={2}>2 par jour</option>
                </select>
              </div>
              <div>
                <label className="label-game">
                  {articlesPerDay === 2 ? 'Heure 1' : 'Heure de publication'}
                </label>
                <select
                  value={preferredHours[0] ?? 9}
                  onChange={(e) => setPreferredHours((prev) => [Number(e.target.value), prev[1] ?? 14])}
                  className="select-game w-full"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>

            {articlesPerDay === 2 && (
              <div>
                <label className="label-game">Heure 2</label>
                <select
                  value={preferredHours[1] ?? 14}
                  onChange={(e) => setPreferredHours((prev) => [prev[0] ?? 9, Number(e.target.value)])}
                  className="select-game w-full"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label-game">Catégorie WordPress (optionnel)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-game w-full"
                placeholder="Ex: Technologie, Marketing, SEO..."
              />
            </div>

            {/* Preview dates */}
            {keywords.length > 0 && (
              <div className="bg-dark-600/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="text-xs font-arcade text-gold/70 mb-2">APERÇU PLANNING</div>
                <div className="space-y-1">
                  {keywords.slice(0, 30).map((kw, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-300 truncate mr-2">{kw}</span>
                      <span className="text-gray-500 whitespace-nowrap">
                        {previewDates[i] ? formatDateTime(previewDates[i]) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={keywords.length === 0 || keywords.length > 30 || !siteId || createBulk.isPending}
            className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createBulk.isPending ? 'PLANIFICATION...' : `PLANIFIER (${Math.min(keywords.length, 30)} MOT${keywords.length !== 1 ? 'S' : ''}-CLÉ${keywords.length !== 1 ? 'S' : ''})`}
          </button>
        </div>
      </div>

      {/* Tableau des planifications */}
      <div className="game-card">
        <div className="p-4 border-b border-dark-400 flex items-center justify-between">
          <h2 className="font-arcade text-sm text-gold/80 tracking-wider">PLANIFICATIONS</h2>
          {pendingCount > 0 && (
            <button
              onClick={() => generateAll.mutate()}
              disabled={generateAll.isPending || hasGenerating}
              className="btn-royal text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateAll.isPending || hasGenerating
                ? 'GENERATION EN COURS...'
                : `TOUT GENERER (${pendingCount})`}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Aucune planification pour le moment
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-game">
              <thead>
                <tr>
                  <th>Mot-clé</th>
                  <th>Site</th>
                  <th>Catégorie</th>
                  <th>Date planifiée</th>
                  <th>Statut</th>
                  <th>Article</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleRowClick(s)}
                    className={
                      s.articleId
                        ? 'cursor-pointer hover:bg-dark-400/40'
                        : s.status === 'PENDING'
                          ? 'cursor-pointer hover:bg-dark-400/40'
                          : ''
                    }
                  >
                    <td className="font-medium">
                      {s.articleId ? (
                        <span className="text-cyber hover:text-cyber-light transition-colors">{s.keyword}</span>
                      ) : s.status === 'PENDING' ? (
                        <span className="text-gold hover:text-gold/80 transition-colors">{s.keyword}</span>
                      ) : (
                        <span className="text-gray-200">{s.keyword}</span>
                      )}
                    </td>
                    <td className="text-gray-400">{s.siteName}</td>
                    <td className="text-gray-400 text-sm">{s.category || '—'}</td>
                    <td className="text-gray-400 text-sm">{formatDateTime(s.scheduledAt)}</td>
                    <td>
                      <StatusBadge status={s.status} />
                      {s.errorMessage && (
                        <div className="text-xs text-danger mt-1 max-w-[200px] truncate" title={s.errorMessage}>
                          {s.errorMessage}
                        </div>
                      )}
                    </td>
                    <td>
                      {s.articleId ? (
                        <Link
                          to={`/seo-articles/${s.articleId}`}
                          className="text-gold hover:text-gold/80 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir l'article
                        </Link>
                      ) : s.status === 'GENERATING' ? (
                        <span className="text-royal text-sm animate-pulse">Génération...</span>
                      ) : s.status === 'PENDING' ? (
                        <span className="text-gray-500 text-sm">Modifier</span>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {s.status === 'PENDING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); generateNow.mutate(s.id); }}
                            disabled={generateNow.isPending}
                            className="btn-royal text-[10px] px-2 py-1 disabled:opacity-50"
                            title="Lancer la génération maintenant"
                          >
                            {generateNow.isPending ? '...' : 'GÉNÉRER'}
                          </button>
                        )}
                        {s.status === 'GENERATING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); cancelGeneration.mutate(s.id); }}
                            disabled={cancelGeneration.isPending}
                            className="btn-sakura text-[10px] px-2 py-1 disabled:opacity-50"
                            title="Arrêter la génération"
                          >
                            {cancelGeneration.isPending ? '...' : 'ARRÊTER'}
                          </button>
                        )}
                        {s.status !== 'GENERATING' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSchedule.mutate(s.id); }}
                            className="text-gray-500 hover:text-danger text-sm transition-colors"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-dark-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-royal text-xs disabled:opacity-30"
            >
              ←
            </button>
            <span className="text-sm text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-royal text-xs disabled:opacity-30"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Modale d'édition */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-arcade text-sm text-gold tracking-wider">MODIFIER LA PLANIFICATION</h3>
              <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-300 text-lg">✕</button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="label-game">Mot-clé</label>
                <input
                  type="text"
                  value={editing.keyword}
                  onChange={(e) => setEditing({ ...editing, keyword: e.target.value })}
                  className="input-game w-full"
                />
              </div>
              <div>
                <label className="label-game">Catégorie</label>
                <input
                  type="text"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="input-game w-full"
                  placeholder="Catégorie WordPress (optionnel)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-game">Date</label>
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    className="input-game w-full"
                  />
                </div>
                <div>
                  <label className="label-game">Heure</label>
                  <select
                    value={editing.hour}
                    onChange={(e) => setEditing({ ...editing, hour: Number(e.target.value) })}
                    className="select-game w-full"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-dark-400">
              <button onClick={() => setEditing(null)} className="btn-ghost text-sm">
                Annuler
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editing.keyword.trim() || updateSchedule.isPending}
                className="btn-gold text-sm disabled:opacity-50"
              >
                {updateSchedule.isPending ? 'Enregistrement...' : 'SAUVEGARDER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
