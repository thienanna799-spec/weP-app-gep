import React, { useState } from 'react';
import StocktakeTab from './StocktakeTab';
import TransferTab from './TransferTab';
import { ClipboardCheck, Truck } from 'lucide-react';

const InventoryOperationsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'stocktake' | 'transfer'>('stocktake');

  return (
    <div className="space-y-6">
      {/* Segmented Control */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-md mx-auto mb-6">
        <button
          onClick={() => setActiveSubTab('stocktake')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
            activeSubTab === 'stocktake' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Lịch sử Kiểm kê
        </button>
        <button
          onClick={() => setActiveSubTab('transfer')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${
            activeSubTab === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" /> Lịch sử Chuyển kho
        </button>
      </div>

      {activeSubTab === 'stocktake' && <StocktakeTab />}
      {activeSubTab === 'transfer' && <TransferTab />}
    </div>
  );
};

export default InventoryOperationsTab;
