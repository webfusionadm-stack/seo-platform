interface AIStreamPreviewProps {
  isGenerating: boolean;
  content: string;
}

export function AIStreamPreview({ isGenerating, content }: AIStreamPreviewProps) {
  if (!isGenerating && !content) return null;

  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-arcade text-[10px] text-gold/70 tracking-wider">APERÇU</h3>
        {isGenerating && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-royal rounded-full animate-pulse" />
            <span className="text-[10px] text-royal font-arcade">FORGE...</span>
          </div>
        )}
      </div>
      <div className="prose prose-sm prose-invert max-w-none max-h-96 overflow-y-auto text-gray-300 text-sm"
        dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
