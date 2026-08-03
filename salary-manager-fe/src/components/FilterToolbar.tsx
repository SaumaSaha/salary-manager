import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { EmployeeFilterParams } from '../types';

interface FilterToolbarProps {
  departments?: string[];
  countries?: string[];
  salaryBounds?: { min_usd_salary: number; max_usd_salary: number };
  filters: EmployeeFilterParams;
  onFilterChange: (filters: Partial<EmployeeFilterParams>) => void;
  onResetFilters: () => void;
}

export default function FilterToolbar({
  departments = [],
  countries = [],
  salaryBounds = { min_usd_salary: 0, max_usd_salary: 500000 },
  filters,
  onFilterChange,
  onResetFilters,
}: FilterToolbarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [selectedDept, setSelectedDept] = useState<string>(filters.department?.[0] || '');
  const [selectedCountry, setSelectedCountry] = useState<string>(filters.country?.[0] || '');
  const [minSalary, setMinSalary] = useState<string>(filters.min_usd_salary?.toString() || '');
  const [maxSalary, setMaxSalary] = useState<string>(filters.max_usd_salary?.toString() || '');

  const searchFilter = filters.search;

  // 300ms Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchFilter) {
        onFilterChange({ search: searchInput });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput, searchFilter, onFilterChange]);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDept(val);
    onFilterChange({ department: val ? [val] : [] });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCountry(val);
    onFilterChange({ country: val ? [val] : [] });
  };

  const handleMinSalaryBlur = () => {
    const val = minSalary ? parseFloat(minSalary) : undefined;
    onFilterChange({ min_usd_salary: val });
  };

  const handleMaxSalaryBlur = () => {
    const val = maxSalary ? parseFloat(maxSalary) : undefined;
    onFilterChange({ max_usd_salary: val });
  };

  const handleReset = () => {
    setSearchInput('');
    setSelectedDept('');
    setSelectedCountry('');
    setMinSalary('');
    setMaxSalary('');
    onResetFilters();
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 my-6 shadow-md">
      <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold text-sm">
        <Filter className="w-4 h-4 text-indigo-400" />
        <span>Filter & Search Dataset</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Global Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Department Dropdown */}
        <div>
          <select
            value={selectedDept}
            onChange={handleDeptChange}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Country Dropdown */}
        <div>
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* USD Salary Bounds */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`Min ($${salaryBounds.min_usd_salary || 0})`}
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            onBlur={handleMinSalaryBlur}
            className="w-1/2 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="number"
            placeholder={`Max ($${salaryBounds.max_usd_salary || 0})`}
            value={maxSalary}
            onChange={(e) => setMaxSalary(e.target.value)}
            onBlur={handleMaxSalaryBlur}
            className="w-1/2 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-center">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-xl text-xs border border-slate-700 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
