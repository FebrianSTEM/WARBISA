import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'amber' | 'sky' | 'rose';
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald',
}) => {
  const variantStyles = {
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      border: 'border-emerald-200/70 hover:border-emerald-300',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-700 border border-amber-200/80',
      border: 'border-amber-200/70 hover:border-amber-300',
    },
    sky: {
      bgIcon: 'bg-sky-50 text-sky-700 border border-sky-200/80',
      border: 'border-sky-200/70 hover:border-sky-300',
    },
    rose: {
      bgIcon: 'bg-rose-50 text-rose-700 border border-rose-200/80',
      border: 'border-rose-200/70 hover:border-rose-300',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className={`bg-white rounded-2xl p-5 border ${style.border} shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between`}>
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 tabular-nums">{value}</h3>
        {subtitle && <p className="text-xs font-medium text-slate-400">{subtitle}</p>}
      </div>

      <div className={`w-12 h-12 rounded-2xl ${style.bgIcon} flex items-center justify-center shrink-0 shadow-xs`}>
        <Icon className="w-6 h-6 stroke-[2.2]" />
      </div>
    </div>
  );
};
