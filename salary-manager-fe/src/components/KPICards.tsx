import React from 'react';
import { KPISummary } from '../types';
import { DollarSign, Users, TrendingUp, BarChart3, ArrowUpRight } from 'lucide-react';

interface KPICardsProps {
  kpi: KPISummary | null;
  loading: boolean;
}

export default function KPICards({ kpi, loading }: KPICardsProps) {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return new Intl.NumberFormat('en-US').format(val);
  };

  if (loading || !kpi) {
    return (
      <div data-testid="kpi-skeleton" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-800/60 animate-pulse border border-slate-700/50" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Payroll',
      value: formatCurrency(kpi.total_payroll_usd),
      subtitle: 'Annual USD Spend',
      icon: DollarSign,
      color: 'from-emerald-500/20 to-teal-500/5 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Average Salary',
      value: formatCurrency(kpi.average_salary_usd),
      subtitle: 'Per Employee',
      icon: TrendingUp,
      color: 'from-indigo-500/20 to-blue-500/5 border-indigo-500/30 text-indigo-400',
    },
    {
      title: 'Median Salary',
      value: formatCurrency(kpi.median_salary_usd),
      subtitle: '50th Percentile',
      icon: BarChart3,
      color: 'from-purple-500/20 to-pink-500/5 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Headcount',
      value: formatNumber(kpi.employee_count),
      subtitle: 'Global Workforce',
      icon: Users,
      color: 'from-amber-500/20 to-orange-500/5 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Min / Max Salary',
      value: `${formatCurrency(kpi.min_salary_usd ?? kpi.lowest_salary_usd)} / ${formatCurrency(kpi.max_salary_usd ?? kpi.highest_salary_usd)}`,
      subtitle: 'Compensation Range',
      icon: ArrowUpRight,
      color: 'from-sky-500/20 to-cyan-500/5 border-sky-500/30 text-sky-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 my-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} border p-5 backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</span>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <IconComponent className={`w-4 h-4 ${card.color.split(' ').pop()}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-extrabold tracking-tight text-white">{card.value}</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">{card.subtitle}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
