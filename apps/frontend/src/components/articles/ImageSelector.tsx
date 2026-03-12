import { useState } from 'react';
import type { FreepikImageProposal } from '@seo-platform/shared';
import { useSelectImage } from '../../hooks/useImages';

interface ImageSelectorProps {
  proposals: FreepikImageProposal[];
  searchKeyword: string;
  articleId: string;
  selectedImageUrl: string | null;
  onImageSelected: (url: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function ImageSelector({ proposals, searchKeyword, articleId, selectedImageUrl, onImageSelected, onRegenerate, isRegenerating }: ImageSelectorProps) {
  const selectImage = useSelectImage();
  const [selectingId, setSelectingId] = useState<number | null>(null);

  const handleSelect = async (proposal: FreepikImageProposal) => {
    if (selectImage.isPending) return;
    setSelectingId(proposal.id);

    try {
      const result = await selectImage.mutateAsync({
        articleId,
        freepikResourceId: proposal.id,
      });
      onImageSelected(result.featuredImageUrl);
    } finally {
      setSelectingId(null);
    }
  };

  if (selectedImageUrl) {
    return (
      <div className="game-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-dark-400">
          <h2 className="font-arcade text-[10px] text-gold/80 tracking-wider">IMAGE SELECTIONNEE</h2>
          <button
            onClick={() => onImageSelected('')}
            className="text-[10px] text-gray-500 hover:text-gray-300 font-arcade"
          >
            CHANGER
          </button>
        </div>
        <div className="p-4">
          <img
            src={selectedImageUrl}
            alt="Image sélectionnée"
            className="w-full rounded-lg border-2 border-gold/50"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="game-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-dark-400">
        <div>
          <h2 className="font-arcade text-[10px] text-gold/80 tracking-wider">SELECTIONNEZ UNE IMAGE</h2>
          <p className="text-[10px] text-gray-500 mt-1">
            Recherche : &laquo; {searchKeyword} &raquo;
          </p>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="btn-royal text-[10px] px-3 py-1.5 disabled:opacity-50"
          >
            {isRegenerating ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-royal-light/30 border-t-royal-light rounded-full animate-spin" />
                RECHERCHE...
              </span>
            ) : (
              'REGENERER'
            )}
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {proposals.map((proposal) => {
            const isSelecting = selectingId === proposal.id;
            return (
              <button
                key={proposal.id}
                onClick={() => handleSelect(proposal)}
                disabled={selectImage.isPending}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-200 bg-dark-800 ${
                  isSelecting
                    ? 'border-gold shadow-lg shadow-gold/20'
                    : 'border-dark-400 hover:border-royal/50'
                } disabled:opacity-60`}
              >
                <div className="w-full aspect-[4/3] flex items-center justify-center">
                  <img
                    src={proposal.previewUrl}
                    alt={proposal.title}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>

                {isSelecting && (
                  <div className="absolute inset-0 bg-dark-900/70 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-[9px] text-gray-300 line-clamp-2">{proposal.title}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectImage.isError && (
          <p className="text-xs text-danger mt-3 text-center">
            Erreur lors du téléchargement. Réessayez.
          </p>
        )}
      </div>
    </div>
  );
}
