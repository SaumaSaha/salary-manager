import React from 'react';
import { DepartmentAnalytics, CountryAnalytics, GenderAnalytics } from '../types';
import { Building, Globe, Scale } from 'lucide-react';

interface AnalyticsChartsProps {
  departmentData?: DepartmentAnalytics | null;
  countryData?: CountryAnalytics | null;
  genderData?: GenderAnalytics | null;
  loading?: boolean;
}

export default function AnalyticsCharts({
  departmentData,
  countryData,
  genderData,
  loading = false,
}: AnalyticsChartsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-slate-800/60 animate-pulse border border-slate-700/50" />
        ))}
      </div>
    );
  }

  const departments = departmentData?.departments || [];
  const countries = countryData?.countries || [];
  const genderMetrics = genderData?.gender_metrics || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
      {/* Department Spend Breakdown */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 text-slate-100 font-bold text-sm border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Department Spend & Average</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {departments.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No department metrics available</div>
            ) : (
              departments.map((dept) => (
                <div key={dept.department} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>{dept.department}</span>
                    <span className="text-indigo-400 font-bold">{formatCurrency(dept.total_payroll_usd)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{dept.employee_count} employees</span>
                    <span>Avg: {formatCurrency(dept.average_salary_usd)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Country Distribution */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 text-slate-100 font-bold text-sm border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Country Distribution & Share</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {countries.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No country metrics available</div>
            ) : (
              countries.map((c) => (
                <div key={c.country} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>{c.country}</span>
                    <span className="text-emerald-400 font-bold">{(c.percentage_payroll || 0).toFixed(1)}% spend</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{c.employee_count} headcount</span>
                    <span>Total: {formatCurrency(c.total_payroll_usd)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gender Pay Equity */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 text-slate-100 font-bold text-sm border-b border-slate-800 pb-3">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Pay Equity by Gender</span>
          </div>

          <div className="space-y-3">
            {genderMetrics.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No gender parity metrics available</div>
            ) : (
              genderMetrics.map((g) => (
                <div key={g.gender} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>{g.gender}</span>
                    <span className="text-purple-400 font-bold">{formatCurrency(g.average_salary_usd)} avg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Headcount: {(g.headcount || 0).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
