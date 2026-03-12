interface MetadataEditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  metaTitle: string;
  onMetaTitleChange: (v: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (v: string) => void;
  slug: string;
  onSlugChange: (v: string) => void;
}

export function MetadataEditor({
  title, onTitleChange,
  metaTitle, onMetaTitleChange,
  metaDescription, onMetaDescriptionChange,
  slug, onSlugChange,
}: MetadataEditorProps) {
  return (
    <div className="game-card p-5 space-y-3">
      <h3 className="font-arcade text-[10px] text-gold/70 tracking-wider">MÉTADONNÉES</h3>

      <div>
        <label className="label-game">Titre (H1)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="input-game"
        />
      </div>

      <div>
        <label className="label-game">
          Meta Title <span className="text-gray-600">{metaTitle.length}/70</span>
        </label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          maxLength={70}
          className="input-game"
        />
      </div>

      <div>
        <label className="label-game">
          Meta Description <span className="text-gray-600">{metaDescription.length}/160</span>
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          maxLength={160}
          rows={2}
          className="textarea-game"
        />
      </div>

      <div>
        <label className="label-game">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="input-game"
        />
      </div>
    </div>
  );
}
