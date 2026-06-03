import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-zinc-800/50 pb-4">
      <div>
        <h2 className="text-xl md:text-2xl font-heading font-medium text-zinc-50 tracking-tight">{title}</h2>
        {description && <p className="text-sm text-zinc-400 mt-1.5 max-w-xl">{description}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0 flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
