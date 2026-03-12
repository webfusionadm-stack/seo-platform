import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { UpdateArticleRequest } from '@seo-platform/shared';
import { useArticle, useUpdateArticle, usePublishArticle, useRetryPublish } from '../hooks/useArticles';
import { useSites } from '../hooks/useSites';
import { useSEOPipeline } from '../hooks/useSEOPipeline';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ArticleContentEditor } from '../components/articles/ArticleContentEditor';
import { ArticleInfoPanel } from '../components/articles/ArticleInfoPanel';
import { PipelineForm } from '../components/articles/PipelineForm';
import type { PipelineFormData } from '../components/articles/PipelineForm';
import { PipelineProgressBar } from '../components/articles/PipelineProgressBar';
import { MetadataEditor } from '../components/articles/MetadataEditor';
import { ImageSelector } from '../components/articles/ImageSelector';
import { useSearchImages } from '../hooks/useImages';

function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
}

export default function SeoArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const { data: article, isLoading: articleLoading } = useArticle(isNew ? undefined : id);
  const { data: sites } = useSites();
  const updateArticle = useUpdateArticle();
  const publishArticle = usePublishArticle();
  const retryPublish = useRetryPublish();
  const pipeline = useSEOPipeline();

  // Image proposals for existing articles
  const { data: searchedImages, regenerate: regenerateImages, isFetching: isRegeneratingImages } = useSearchImages(article?.keyword);
  const [editFeaturedImageUrl, setEditFeaturedImageUrl] = useState<string | null>(null);

  // Edit mode state (for existing articles)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [siteId, setSiteId] = useState('');

  // Sync from loaded article (edit mode)
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setMetaTitle(article.metaTitle ?? '');
      setMetaDescription(article.metaDescription ?? '');
      setSlug(article.slug);
      setSiteId(article.siteId);
      setEditFeaturedImageUrl(article.featuredImageUrl ?? null);
    }
  }, [article]);

  // When pipeline finishes, sync results to local state
  useEffect(() => {
    if (pipeline.finalContent && !pipeline.isRunning) {
      setContent(pipeline.finalContent);
      setTitle(pipeline.title);
      setMetaTitle(pipeline.metaTitle);
      setMetaDescription(pipeline.metaDescription);
      setSlug(pipeline.slug);
    }
  }, [pipeline.finalContent, pipeline.isRunning, pipeline.title, pipeline.metaTitle, pipeline.metaDescription, pipeline.slug]);

  // Navigate to the created article after pipeline done
  useEffect(() => {
    if (pipeline.articleId && !pipeline.isRunning && isNew) {
      navigate(`/seo-articles/${pipeline.articleId}`, { replace: true });
    }
  }, [pipeline.articleId, pipeline.isRunning, isNew, navigate]);

  const handlePipelineSubmit = (data: PipelineFormData) => {
    pipeline.startPipeline({
      keyword: data.keyword,
      secondaryKeywords: data.secondaryKeywords,
      siteId: data.siteId,
      language: data.language,
    });
    setSiteId(data.siteId);
  };

  const handleReforge = () => {
    pipeline.reset();
    setContent('');
    setTitle('');
    setMetaTitle('');
    setMetaDescription('');
    setSlug('');
  };

  const handleSave = async () => {
    if (article && !isNew) {
      const data: UpdateArticleRequest = {
        title,
        content,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      };
      await updateArticle.mutateAsync({ id: article.id, data });
    }
  };

  const handlePublish = async () => {
    if (article) await publishArticle.mutateAsync(article.id);
  };

  const currentSite = sites?.find((s) => s.id === (article?.siteId ?? siteId));
  const isFromSchedule = !!article?.keywordScheduleId;
  const canPublish = article && currentSite?.hasWpCredentials && article.status !== 'SCHEDULED' && !isFromSchedule;
  const wordCount = countWords(content);
  const isPipelineComplete = !!pipeline.finalContent && !pipeline.isRunning;

  if (!isNew && articleLoading) return <LoadingSpinner text="Chargement de l'article..." />;

  // ====== MODE ÉDITION (article existant) ======
  if (!isNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-arcade text-xl text-gold tracking-wider">SEO FORGE</h1>
            {article && (
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge status={article.status} />
                {article.siteName && <span className="text-sm text-gray-500">{article.siteName}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/seo-articles')} className="btn-ghost text-xs">
              ← Retour
            </button>
            <button
              onClick={handleSave}
              disabled={updateArticle.isPending}
              className="btn-royal text-xs disabled:opacity-50"
            >
              {updateArticle.isPending ? 'Enregistrement...' : 'SAUVEGARDER'}
            </button>
            {canPublish && (
              <button
                onClick={handlePublish}
                disabled={publishArticle.isPending}
                className="btn-emerald text-xs disabled:opacity-50"
              >
                {publishArticle.isPending ? 'Publication...' : 'PUBLIER'}
              </button>
            )}
            {isFromSchedule && article?.status === 'REVIEW' && article.scheduledPublishAt && (
              <span className="text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 rounded-lg px-3 py-1.5">
                Publication planifiee le {new Date(article.scheduledPublishAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {article?.status === 'SCHEDULED' && article.scheduledPublishAt && (
              <span className="text-xs text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 rounded-lg px-3 py-1.5">
                Planifie le {new Date(article.scheduledPublishAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ArticleContentEditor
            title={title} onTitleChange={setTitle}
            content={content} onContentChange={setContent}
            metaTitle={metaTitle} onMetaTitleChange={setMetaTitle}
            metaDescription={metaDescription} onMetaDescriptionChange={setMetaDescription}
            siteId={siteId} onSiteIdChange={setSiteId}
            sites={sites} isNew={false} article={article ?? null}
            wordCount={wordCount} colSpan="lg:col-span-2"
            featuredImageUrl={editFeaturedImageUrl}
          />
          <div className="space-y-4">
            {article && <ArticleInfoPanel article={article} />}

            {article && article.status === 'PUBLISH_FAILED' && (
              <div className="game-card p-4 space-y-3 border border-red-500/30 bg-red-500/5">
                <h3 className="font-arcade text-[10px] text-red-400 tracking-wider">ECHEC PUBLICATION</h3>
                {article.publishError && (
                  <p className="text-sm text-red-300">{article.publishError}</p>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Tentatives : {article.publishRetryCount}/5</p>
                  {article.lastPublishAt && (
                    <p>Dernière tentative : {new Date(article.lastPublishAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  )}
                </div>
                <button
                  onClick={() => retryPublish.mutate(article.id)}
                  disabled={retryPublish.isPending}
                  className="btn-royal text-xs w-full disabled:opacity-50"
                >
                  {retryPublish.isPending ? 'Relance...' : 'RELANCER LA PUBLICATION'}
                </button>
              </div>
            )}

            {article && article.status === 'SCHEDULED' && article.scheduledPublishAt && (
              <div className="game-card p-4 space-y-3">
                <h3 className="font-arcade text-[10px] text-cyan-400 tracking-wider">PUBLICATION PLANIFIEE</h3>
                <div>
                  <label className="label-game">Date de publication</label>
                  <input
                    type="datetime-local"
                    value={toLocalDatetimeInput(article.scheduledPublishAt)}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateArticle.mutate({
                          id: article.id,
                          data: { scheduledPublishAt: new Date(e.target.value).toISOString() } as any,
                        });
                      }
                    }}
                    className="input-game w-full"
                  />
                </div>
              </div>
            )}

            {article && searchedImages && searchedImages.length > 0 && (
              <ImageSelector
                proposals={searchedImages}
                searchKeyword={article.keyword || ''}
                articleId={article.id}
                selectedImageUrl={editFeaturedImageUrl}
                onImageSelected={setEditFeaturedImageUrl}
                onRegenerate={regenerateImages}
                isRegenerating={isRegeneratingImages}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ====== MODE NOUVEAU (pipeline) ======
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-arcade text-xl text-gold tracking-wider">SEO FORGE</h1>
          <p className="text-xs text-gray-500 mt-1">Pipeline de rédaction automatique en 8 étapes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/seo-articles')} className="btn-ghost text-xs">
            ← Retour
          </button>
          {isPipelineComplete && (
            <>
              <button onClick={handleReforge} className="btn-royal text-xs">
                REFORGER
              </button>
              {canPublish && (
                <button
                  onClick={handlePublish}
                  disabled={publishArticle.isPending}
                  className="btn-emerald text-xs disabled:opacity-50"
                >
                  {publishArticle.isPending ? 'Publication...' : 'PUBLIER'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Form + Progress */}
        <div className="lg:col-span-1 space-y-4">
          <PipelineForm
            sites={sites}
            isRunning={pipeline.isRunning}
            onSubmit={handlePipelineSubmit}
          />

          {(pipeline.isRunning || pipeline.currentStep > 0) && (
            <PipelineProgressBar
              steps={pipeline.steps}
              currentStep={pipeline.currentStep}
            />
          )}

          {pipeline.error && (
            <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
              {pipeline.errorStep && (
                <span className="font-arcade text-[10px] block mb-1">
                  Erreur étape {pipeline.errorStep}
                </span>
              )}
              {pipeline.error}
            </div>
          )}

          {/* Post-generation metadata editor */}
          {isPipelineComplete && (
            <>
              <MetadataEditor
                title={title}
                onTitleChange={setTitle}
                metaTitle={metaTitle}
                onMetaTitleChange={setMetaTitle}
                metaDescription={metaDescription}
                onMetaDescriptionChange={setMetaDescription}
                slug={slug}
                onSlugChange={setSlug}
              />

              {pipeline.imageProposals.length > 0 && pipeline.articleId && (
                <ImageSelector
                  proposals={pipeline.imageProposals}
                  searchKeyword={pipeline.imageSearchKeyword}
                  articleId={pipeline.articleId}
                  selectedImageUrl={pipeline.featuredImageUrl}
                  onImageSelected={pipeline.setFeaturedImageUrl}
                />
              )}
            </>
          )}
        </div>

        {/* Right column: Preview */}
        <div className="lg:col-span-2">
          {pipeline.isRunning && pipeline.streamedContent ? (
            /* Streaming markdown preview during step 5 */
            <div className="game-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-dark-400">
                <h2 className="font-arcade text-[10px] text-gold/80 tracking-wider">APERCU STREAMING</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-royal rounded-full animate-pulse" />
                  <span className="text-[10px] text-royal font-arcade">REDACTION...</span>
                </div>
              </div>
              <div className="article-wp-preview p-8 max-h-[70vh] overflow-y-auto text-gray-300 whitespace-pre-wrap leading-relaxed" style={{ fontSize: '0.938rem' }}>
                {pipeline.streamedContent}
              </div>
            </div>
          ) : pipeline.isRunning ? (
            /* Pipeline running but no streaming content yet */
            <div className="game-card p-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 border-4 border-royal/30 border-t-royal rounded-full animate-spin mb-4" />
              <p className="font-arcade text-xs text-royal-light tracking-wider">
                Analyse en cours...
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Les étapes 1 à 5 préparent la structure de votre article
              </p>
            </div>
          ) : isPipelineComplete ? (
            /* Final HTML preview — WordPress-like */
            <div className="game-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-dark-400">
                <h2 className="font-arcade text-[10px] text-gold/80 tracking-wider">ARTICLE GENERE</h2>
                <span className="text-[10px] text-gray-500 font-arcade">{pipeline.wordCount} mots</span>
              </div>
              <div className="article-wp-preview p-8 max-h-[75vh] overflow-y-auto">
                {pipeline.featuredImageUrl && (
                  <img
                    src={pipeline.featuredImageUrl}
                    alt={pipeline.title || ''}
                    className="w-full max-h-[350px] object-cover rounded-lg mb-8"
                  />
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-6 leading-tight">
                  {title || pipeline.title}
                </h1>
                <div
                  className="prose prose-invert prose-article max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="game-card p-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-6xl mb-4 opacity-20">&#9998;</div>
              <p className="font-arcade text-xs text-gray-500 tracking-wider text-center">
                Configurez le pipeline et lancez la génération
              </p>
              <p className="text-xs text-gray-600 mt-2 text-center max-w-sm">
                8 étapes automatiques : recherche SERP, analyse d'intention, métadonnées, structure H2, image mise en avant, rédaction, FAQ et post-traitement
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
