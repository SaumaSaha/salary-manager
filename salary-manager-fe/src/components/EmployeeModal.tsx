import React, { useState } from 'react';
import { Employee, EmployeeFormData } from '../types';
import { X } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: EmployeeFormData) => void;
  employee?: Employee | null;
  departments: string[];
  countries: string[];
}

export default function EmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  employee,
  departments,
  countries,
}: EmployeeModalProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(() => {
    if (employee) {
      return {
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        job_title: employee.job_title,
        department: employee.department,
        country: employee.country,
        base_salary: employee.base_salary,
        currency: employee.currency,
        bonus_percentage: employee.bonus_percentage,
        gender: employee.gender,
        performance: employee.performance,
        hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
      };
    }
    return {
      first_name: '',
      last_name: '',
      email: '',
      job_title: '',
      department: departments[0] || 'Engineering',
      country: countries[0] || 'USA',
      base_salary: 50000,
      currency: 'USD',
      bonus_percentage: 0,
      gender: 'Male',
      performance: 3,
      hire_date: new Date().toISOString().split('T')[0],
    };
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <h3 className="text-lg font-bold">{employee ? 'Edit Employee' : 'Add New Employee'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
              <input
                id="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
              <input
                id="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="job_title" className="block text-xs font-semibold text-slate-300 mb-1">Job Title *</label>
              <input
                id="job_title"
                type="text"
                required
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-xs font-semibold text-slate-300 mb-1">Department *</label>
              <select
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="country" className="block text-xs font-semibold text-slate-300 mb-1">Country *</label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="base_salary" className="block text-xs font-semibold text-slate-300 mb-1">Base Salary *</label>
              <input
                id="base_salary"
                type="number"
                min="0"
                step="any"
                required
                value={formData.base_salary}
                onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-xs font-semibold text-slate-300 mb-1">Currency *</label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD'].map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="gender" className="block text-xs font-semibold text-slate-300 mb-1">Gender *</label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
              </select>
            </div>
            <div>
              <label htmlFor="performance" className="block text-xs font-semibold text-slate-300 mb-1">Performance (1-5)</label>
              <input
                id="performance"
                type="number"
                min="1"
                max="5"
                value={formData.performance}
                onChange={(e) => setFormData({ ...formData, performance: parseInt(e.target.value) || 3 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="hire_date" className="block text-xs font-semibold text-slate-300 mb-1">Hire Date *</label>
              <input
                id="hire_date"
                type="date"
                required
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
