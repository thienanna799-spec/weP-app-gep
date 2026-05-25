import React from 'react';
import { PackagePlus, X } from 'lucide-react';
import ManualImportTab from './ManualImportTab';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-violet-600" />
            Khai báo Hàng loạt
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <ManualImportTab />
        </div>
      </div>
    </div>
  );
};
