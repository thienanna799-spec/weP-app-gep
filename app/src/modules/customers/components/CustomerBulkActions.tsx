import React from 'react';
import { Users, Download, X } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface CustomerBulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onExport: (ids: string[]) => void;
}

const CustomerBulkActions: React.FC<CustomerBulkActionsProps> = ({
  selectedIds,
  onClearSelection,
  onExport,
}) => {
  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
          <Users className="w-4 h-4" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Đã chọn</p>
          <p className="text-sm font-black text-blue-700 leading-none">{selectedIds.length} khách hàng</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onExport(selectedIds)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 py-0 shadow-md">
          <Download className="w-4 h-4 mr-2" /> Xuất Excel ({selectedIds.length})
        </Button>
        <Button variant="secondary" onClick={onClearSelection} className="h-9 py-0 bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
          <X className="w-4 h-4 text-slate-500" />
        </Button>
      </div>
    </div>
  );
};

export default CustomerBulkActions;
