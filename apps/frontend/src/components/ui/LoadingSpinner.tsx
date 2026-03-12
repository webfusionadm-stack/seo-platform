export function LoadingSpinner({ text = 'Chargement...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-dark-400" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-royal animate-spin" />
      </div>
      <p className="text-gray-500 text-sm font-arcade tracking-wider">{text}</p>
    </div>
  );
}
