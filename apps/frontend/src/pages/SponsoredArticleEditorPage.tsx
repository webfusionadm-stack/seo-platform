import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { CreateArticleRequest, UpdateArticleRequest } from '@seo-platform/shared';
import { useArticle, useCreateArticle, useUpdateArticle, usePublishArticle } from '../hooks/useArticles';
import { useSites } from '../hooks/useSites';
import { useAIStream } from '../hooks/useAIStream';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ArticleContentEditor } from '../components/articles/ArticleContentEditor';
import { ArticleInfoPanel } from '../components/articles/ArticleInfoPanel';
import { AIStreamPreview } from '../components/articles/AIStreamPreview';

interface SponsoredGenForm { keyword: string; siteId: string; anchorText: string; targetUrl: string; brief: string; language: string; wordCount: number; orderId: string; }
const defaultSponsoredForm: SponsoredGenForm = { keyword: '', siteId: '', anchorText: '', targetUrl: '', brief: '', language: 'fr', wordCount: 1500, orderId: '' };

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

export default function SponsoredArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const { data: article, isLoading: articleLoading } = useArticle(isNew ? undefined : id);
  const { data: sites } = useSites();
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const publishArticle = usePublishArticle();
  const aiStream = useAIStream();

  const [sponsoredForm, setSponsoredForm] = useState<SponsoredGenForm>(() => ({
    ...defaultSponsoredForm,
    orderId: searchParams.get('orderId') ?? '',
    siteId: searchParams.get('siteId') ?? '',
    anchorText: searchParams.get('anchorText') ?? '',
    targetUrl: searchParams.get('targetUrl') ?? '',
    brief: searchParams.get('brief') ?? '',
  }));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [siteId, setSiteId] = useState(searchParams.get('siteId') ?? '');

  useEffect(() => {
    if (article) {
      setTitle(article.title); setContent(article.content);
      setMetaTitle(article.metaTitle ?? ''); setMetaDescription(article.metaDescription ?? '');
      setSiteId(article.siteId);
    }
  }, [article]);

  useEffect(() => { if (aiStream.content && !aiStream.isGenerating) setContent(aiStream.content); }, [aiStream.content, aiStream.isGenerating]);
  useEffect(() => { if (aiStream.articleId && isNew) navigate(`/sponsored-articles/${aiStream.articleId}`, { replace: true }); }, [aiStream.articleId, isNew, navigate]);

  const handleGenerate = () => {
    if (!sponsoredForm.keyword || !sponsoredForm.siteId || !sponsoredForm.anchorText || !sponsoredForm.targetUrl) return;
    aiStream.generateSponsored({
      keyword: sponsoredForm.keyword, siteId: sponsoredForm.siteId, anchorText: sponsoredForm.anchorText,
      targetUrl: sponsoredForm.targetUrl, brief: sponsoredForm.brief || undefined, language: sponsoredForm.language,
      wordCount: sponsoredForm.wordCount, orderId: sponsoredForm.orderId || undefined,
    });
  };

  const handleSave = async () => {
    if (article && !isNew) {
      const data: UpdateArticleRequest = { title, content, metaTitle: metaTitle || undefined, metaDescription: metaDescription || undefined };
      await updateArticle.mutateAsync({ id: article.id, data });
    } else {
      if (!siteId) return;
      const data: CreateArticleRequest = {
        title, content, type: 'SPONSORED', siteId,
        orderId: sponsoredForm.orderId || undefined,
        metaTitle: metaTitle || undefined, metaDescription: metaDescription || undefined,
      };
      const newA = await createArticle.mutateAsync(data);
      if (newA?.id) navigate(`/sponsored-articles/${newA.id}`, { replace: true });
    }
  };

  const handlePublish = async () => { if (article) await publishArticle.mutateAsync(article.id); };

  const currentSite = sites?.find((s) => s.id === (article?.siteId ?? siteId));
  const canPublish = article && currentSite?.hasWpCredentials;
  const wordCount = countWords(content);
  const showGenerator = isNew || (article && article.status !== 'PUBLISHED');

  if (!isNew && articleLoading) return <LoadingSpinner text="Chargement de l'article..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">LINK CRAFT</h1>
          {article && (
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={article.status} />
              {article.siteName && <span className="text-sm text-gray-500">{article.siteName}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/sponsored-articles')} className="btn-ghost text-xs">← Retour</button>
          <button onClick={handleSave} disabled={createArticle.isPending || updateArticle.isPending} className="btn-royal text-xs disabled:opacity-50">
            {createArticle.isPending || updateArticle.isPending ? 'Enregistrement...' : 'SAUVEGARDER'}
          </button>
          {canPublish && (
            <button onClick={handlePublish} disabled={publishArticle.isPending} className="btn-emerald text-xs disabled:opacity-50">
              {publishArticle.isPending ? 'Publication...' : 'PUBLIER'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Generator Panel */}
        {showGenerator && (
          <div className="lg:col-span-1 space-y-4">
            <div className="game-card-gold p-5">
              <h2 className="font-arcade text-xs text-gold tracking-wider mb-4">GÉNÉRATEUR IA</h2>

              <div className="space-y-3">
                <div>
                  <label className="label-game">Mot-clé *</label>
                  <input type="text" value={sponsoredForm.keyword} onChange={(e) => setSponsoredForm({ ...sponsoredForm, keyword: e.target.value })} className="input-game" />
                </div>
                <div>
                  <label className="label-game">Site *</label>
                  <select value={sponsoredForm.siteId} onChange={(e) => { setSponsoredForm({ ...sponsoredForm, siteId: e.target.value }); if (!siteId) setSiteId(e.target.value); }} className="select-game">
                    <option value="">Sélectionner...</option>
                    {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-game">Ancre magique *</label>
                  <input type="text" value={sponsoredForm.anchorText} onChange={(e) => setSponsoredForm({ ...sponsoredForm, anchorText: e.target.value })} className="input-game" />
                </div>
                <div>
                  <label className="label-game">Portail client *</label>
                  <input type="url" value={sponsoredForm.targetUrl} onChange={(e) => setSponsoredForm({ ...sponsoredForm, targetUrl: e.target.value })} placeholder="https://..." className="input-game" />
                </div>
                <div>
                  <label className="label-game">Parchemin du client</label>
                  <textarea value={sponsoredForm.brief} onChange={(e) => setSponsoredForm({ ...sponsoredForm, brief: e.target.value })} rows={3} className="textarea-game" />
                </div>
                <div>
                  <label className="label-game">Langue</label>
                  <select value={sponsoredForm.language} onChange={(e) => setSponsoredForm({ ...sponsoredForm, language: e.target.value })} className="select-game">
                    <option value="fr">Français</option><option value="en">Anglais</option><option value="es">Espagnol</option>
                  </select>
                </div>
                <div>
                  <label className="label-game">Mots : {sponsoredForm.wordCount}</label>
                  <input type="range" min={300} max={5000} step={100} value={sponsoredForm.wordCount}
                    onChange={(e) => setSponsoredForm({ ...sponsoredForm, wordCount: Number(e.target.value) })} className="w-full accent-sakura" />
                </div>
                <div>
                  <label className="label-game">ID Commande</label>
                  <input type="text" value={sponsoredForm.orderId} onChange={(e) => setSponsoredForm({ ...sponsoredForm, orderId: e.target.value })} placeholder="UUID (optionnel)" className="input-game" />
                </div>
                <button onClick={handleGenerate}
                  disabled={aiStream.isGenerating || !sponsoredForm.keyword || !sponsoredForm.siteId || !sponsoredForm.anchorText || !sponsoredForm.targetUrl}
                  className="btn-sakura w-full disabled:opacity-50">
                  {aiStream.isGenerating ? 'Tissage en cours...' : 'TISSER LE LIEN'}
                </button>
              </div>

              {aiStream.error && (
                <div className="mt-3 p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">{aiStream.error}</div>
              )}
            </div>

            <AIStreamPreview isGenerating={aiStream.isGenerating} content={aiStream.content} />
          </div>
        )}

        {/* Editor Panel */}
        <ArticleContentEditor
          title={title} onTitleChange={setTitle}
          content={content} onContentChange={setContent}
          metaTitle={metaTitle} onMetaTitleChange={setMetaTitle}
          metaDescription={metaDescription} onMetaDescriptionChange={setMetaDescription}
          siteId={siteId} onSiteIdChange={setSiteId}
          sites={sites} isNew={isNew} article={article ?? null}
          wordCount={wordCount} colSpan={showGenerator ? 'lg:col-span-2' : 'lg:col-span-3'}
        />

        {article && <ArticleInfoPanel article={article} />}
      </div>
    </div>
  );
}
