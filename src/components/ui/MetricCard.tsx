import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | ReactNode;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
}

export function MetricCard({ title, value, trend, trendUp, subtitle, className }: MetricCardProps) {
  return (
    <div className={cn("bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm hover:border-zinc-700 transition-colors flex flex-col justify-between", className)}>
      <div>
        <div className="text-sm font-medium text-zinc-400 mb-2 tracking-wide">{title}</div>
        <div className="flex items-end justify-between">
          <div className="text-2xl lg:text-3xl font-heading font-semibold text-zinc-50 tracking-tight">{value}</div>
          {trend && (
            <div className={cn("text-xs font-semibold px-2 py-1 rounded-md mb-1", trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
      </div>
      {subtitle && (
        <div className="mt-4 pt-4 border-t border-zinc-800/50 text-xs text-zinc-500">{subtitle}</div>
      )}
    </div>
  );
}
