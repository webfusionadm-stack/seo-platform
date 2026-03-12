import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4 opacity-50">{icon}</span>
      <h3 className="font-arcade text-gold/60 text-sm tracking-wider mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}
