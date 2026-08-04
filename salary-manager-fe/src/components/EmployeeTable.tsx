import React from 'react';
import { Employee, PaginationMeta } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

interface EmployeeTableProps {
  employees?: Employee[];
  pagination?: PaginationMeta;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  isFetching?: boolean;
  onSortChange: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
  onAddEmployee?: () => void;
}

export default function EmployeeTable({
  employees = [],
  pagination = { page: 1, page_size: 20, total_records: 0, total_pages: 0 },
  sortBy = 'last_name',
  sortOrder = 'asc',
  loading = false,
  isFetching = false,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onEditEmployee,
  onDeleteEmployee,
  onAddEmployee,
}: EmployeeTableProps) {
  const safeEmployees = employees || [];
  const safePagination = pagination || { page: 1, page_size: 20, total_records: 0, total_pages: 0 };

  const formatCurrency = (val: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
      }).format(val);
    } catch {
      return `${currency} ${val.toLocaleString()}`;
    }
  };

  const columns = [
    { key: 'first_name', label: 'Employee Name' },
    { key: 'department', label: 'Department' },
    { key: 'country', label: 'Country' },
    { key: 'base_salary', label: 'Local Base Salary' },
    { key: 'usd_salary', label: 'USD Equivalent' },
    { key: 'performance', label: 'Rating' },
    { key: 'hire_date', label: 'Hire Date' },
  ];

  const renderSortIcon = (colKey: string) => {
    if (sortBy !== colKey) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl my-6">

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Employee Master Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {safePagination.total_records > 0 ? (safePagination.page - 1) * safePagination.page_size + 1 : 0} -{' '}
            {Math.min(safePagination.page * safePagination.page_size, safePagination.total_records)} of{' '}
            <span className="font-semibold text-slate-200">{(safePagination.total_records || 0).toLocaleString()}</span> employees
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onAddEmployee && (
            <button
              onClick={onAddEmployee}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Per page:</span>
            <select
              value={safePagination.page_size}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700/80 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto relative">
        {loading && safeEmployees.length === 0 && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] z-10 flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSortChange(col.key)}
                  className="px-6 py-4 cursor-pointer select-none hover:text-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-800/60 transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            {!safeEmployees || safeEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                  No employee records found matching your filters.
                </td>
              </tr>
            ) : (
              safeEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-100">
                    <div>{`${emp.first_name} ${emp.last_name}`}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{emp.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-300">{emp.country}</td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    {formatCurrency(emp.base_salary, emp.currency)}
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-400">
                    {formatCurrency(emp.usd_salary, 'USD')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < emp.performance ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(emp.hire_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        data-testid={`edit-${emp.id}`}
                        onClick={() => onEditEmployee(emp)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-400 transition-colors"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        data-testid={`delete-${emp.id}`}
                        onClick={() => onDeleteEmployee(emp)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
        <div>
          Page <span className="font-semibold text-slate-200">{safePagination.page}</span> of{' '}
          <span className="font-semibold text-slate-200">{safePagination.total_pages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(safePagination.page - 1)}
            disabled={safePagination.page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={() => onPageChange(safePagination.page + 1)}
            disabled={safePagination.page >= safePagination.total_pages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
