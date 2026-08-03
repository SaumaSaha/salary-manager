import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Employee } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
  deleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  employee,
  deleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Delete Employee Record</h3>
            <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed my-4">
          Are you sure you want to permanently delete{' '}
          <span className="font-semibold text-white">{`${employee.first_name} ${employee.last_name}`}</span> ({employee.job_title} - {employee.department})?
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}
