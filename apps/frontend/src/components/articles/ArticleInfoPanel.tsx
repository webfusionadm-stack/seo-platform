import type { ArticleDTO } from '@seo-platform/shared';
import { STATUS_LABELS } from '@seo-platform/shared';

interface ArticleInfoPanelProps {
  article: ArticleDTO;
}

export function ArticleInfoPanel({ article }: ArticleInfoPanelProps) {
  return (
    <div className="game-card p-6">
      <h3 className="font-arcade text-[10px] text-gold/70 tracking-wider mb-3">INFORMATIONS</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-gray-500">Type</dt>
        <dd className="text-gray-300">{STATUS_LABELS[article.type] || article.type}</dd>
        <dt className="text-gray-500">Mot-clé</dt>
        <dd className="text-gray-300">{article.keyword ?? '-'}</dd>
        <dt className="text-gray-500">Catégorie</dt>
        <dd className="text-gray-300">{article.category ?? '-'}</dd>
        <dt className="text-gray-500">Mots</dt>
        <dd className="text-gray-300">{article.wordCount}</dd>
        <dt className="text-gray-500">Slug</dt>
        <dd className="text-gray-300 truncate">{article.slug}</dd>
        {article.wpPostUrl && (
          <>
            <dt className="text-gray-500">URL WordPress</dt>
            <dd><a href={article.wpPostUrl} target="_blank" rel="noopener noreferrer" className="text-cyber hover:text-cyber-light truncate block">{article.wpPostUrl}</a></dd>
          </>
        )}
        <dt className="text-gray-500">Créé le</dt>
        <dd className="text-gray-300">{new Date(article.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd>
      </dl>
    </div>
  );
}
