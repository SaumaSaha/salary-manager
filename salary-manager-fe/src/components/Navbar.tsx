import React from 'react';
import { Download, Building2 } from 'lucide-react';

interface NavbarProps {
  onExportCsv: () => void;
  exporting?: boolean;
}

export default function Navbar({ onExportCsv, exporting = false }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/80 border-b border-slate-800 text-slate-100 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              ACME Salary Manager
            </h1>
            <p className="text-xs text-slate-400 font-medium">Multinational Payroll & Analytics (10,000 Employees)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 border border-slate-700 transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
