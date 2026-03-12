import { useState } from 'react';
import type { ArticleDTO, SiteDTO } from '@seo-platform/shared';
import { StatusBadge } from '../ui/StatusBadge';

interface ArticleContentEditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  content: string;
  onContentChange: (v: string) => void;
  metaTitle: string;
  onMetaTitleChange: (v: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (v: string) => void;
  siteId: string;
  onSiteIdChange: (v: string) => void;
  sites?: SiteDTO[];
  isNew: boolean;
  article?: ArticleDTO | null;
  wordCount: number;
  colSpan: string;
  featuredImageUrl?: string | null;
}

export function ArticleContentEditor({
  title, onTitleChange, content, onContentChange,
  metaTitle, onMetaTitleChange, metaDescription, onMetaDescriptionChange,
  siteId, onSiteIdChange, sites, isNew, article, wordCount, colSpan, featuredImageUrl,
}: ArticleContentEditorProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'html'>('visual');

  return (
    <div className={`${colSpan} space-y-4`}>
      <div className="game-card overflow-hidden">
        {/* Toolbar — onglets Visuel / Code + infos */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-dark-400">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 text-[10px] font-arcade tracking-wider rounded transition-colors ${
                activeTab === 'visual'
                  ? 'bg-royal/20 text-royal-light border border-royal/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              VISUEL
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 text-[10px] font-arcade tracking-wider rounded transition-colors ${
                activeTab === 'html'
                  ? 'bg-royal/20 text-royal-light border border-royal/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              CODE
            </button>
          </div>
          <div className="flex items-center gap-3">
            {article && <StatusBadge status={article.status} />}
            <span className="text-[10px] text-gray-500 font-arcade">{wordCount} mots</span>
          </div>
        </div>

        {/* Sélecteur de site (nouveau article uniquement) */}
        {isNew && (
          <div className="px-6 py-3 border-b border-dark-400">
            <label className="label-game">Site *</label>
            <select value={siteId} onChange={(e) => onSiteIdChange(e.target.value)} className="select-game">
              <option value="">Sélectionner...</option>
              {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Zone de contenu */}
        {activeTab === 'visual' ? (
          <div className="article-wp-preview p-8 max-h-[75vh] overflow-y-auto">
            {/* Image mise en avant */}
            {(featuredImageUrl || article?.featuredImageUrl) && (
              <img
                src={featuredImageUrl || article?.featuredImageUrl || ''}
                alt={article?.featuredImageAlt || ''}
                className="w-full max-h-[300px] object-cover rounded-lg mb-8"
              />
            )}

            {/* Titre — style WordPress, grand et éditable */}
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ajoutez un titre"
              className="w-full text-2xl md:text-3xl font-bold text-gray-100 bg-transparent border-none outline-none placeholder-gray-700 mb-6 leading-tight"
              style={{ caretColor: '#7c3aed' }}
            />

            {/* Contenu rendu */}
            {content ? (
              <div
                className="prose prose-invert prose-article max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <p className="text-gray-600 italic text-center py-12">
                Aucun contenu. Passez en mode Code pour éditer le HTML.
              </p>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="label-game">Titre</label>
              <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Titre de l'article" className="input-game" />
            </div>
            <div>
              <label className="label-game">Contenu HTML</label>
              <textarea value={content} onChange={(e) => onContentChange(e.target.value)} rows={22}
                placeholder="Contenu HTML..." className="input-game font-mono text-xs resize-y" />
            </div>
          </div>
        )}

        {/* Métadonnées SEO */}
        <div className="px-6 py-4 border-t border-dark-400 space-y-3">
          <h3 className="font-arcade text-[10px] text-royal-light/70 tracking-wider">METADONNEES SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label-game">Meta titre <span className="text-gray-600">{metaTitle.length}/70</span></label>
              <input type="text" value={metaTitle} onChange={(e) => onMetaTitleChange(e.target.value)} maxLength={70} className="input-game" />
            </div>
            <div>
              <label className="label-game">Meta description <span className="text-gray-600">{metaDescription.length}/160</span></label>
              <textarea value={metaDescription} onChange={(e) => onMetaDescriptionChange(e.target.value)} maxLength={160} rows={2} className="textarea-game" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
