import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, Plus, QrCode, History, MapPin, 
  ClipboardCheck, PackageCheck, ChevronRight,
  BarChart3, Layers, PackagePlus, Download, Ruler,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useInventory } from './hooks/useInventory';
import { ProductRoll, RollStatus, InventorySummary } from './types';
import { formatDate } from '../../utils/format';
import InventorySummaryTab from './components/InventorySummaryTab';
import InventoryOperationsTab from './components/InventoryOperationsTab';
import ManualImportTab from './components/ManualImportTab';
import WarehouseMap3D from './components/WarehouseMap3D';
import StorageAreaManagement from './components/StorageAreaManagement';
import RollDetailModal from './components/RollDetailModal';
import { InventoryFilterBar } from './components/InventoryFilterBar';
import { InventoryRollsTable } from './components/InventoryRollsTable';
import { inventoryService } from './services/inventory.service';

const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { rolls, loading } = useInventory();
  const [activeTab, setActiveTab] = useState<'stock' | 'positions' | 'operations' | 'storage'>('stock');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<ProductRoll | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderPortal(document.getElementById('page-header-portal'));
  }, []);

  const filteredRolls = rolls.filter(r => {
    const matchesSearch = (r.code || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.qrCode || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (statusFilter === 'All' || r.status === statusFilter) && (areaFilter === 'All' || r.positionArea === areaFilter) && (!dateFilter || r.productionDate.includes(dateFilter));
  });

  const handleShowDetail = (roll: ProductRoll) => { setSelectedRoll(roll); setIsDetailOpen(true); };

  if (loading) return <LoadingSpinner />;

  const inventoryActionButtons = (
    <>
      <Button 
        variant="secondary" 
        onClick={() => setIsCatalogModalOpen(true)} 
        className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700 whitespace-nowrap"
      >
        <PackagePlus className="w-4 h-4" />
        <span>Khai báo Hàng loạt</span>
      </Button>
    </>
  );

  return (
    <div className="space-y-6">




      {/* Tabs */}
      {(() => {
        const tabsContent = (
          <div className="flex border-b border-gray-200 gap-8 overflow-x-auto custom-scrollbar w-full lg:h-full lg:items-end">
            {[
              { key: 'stock' as const, label: 'Quản lý Tồn kho', icon: Layers },
              { key: 'positions' as const, label: 'Sơ đồ Kho', icon: MapPin },
              { key: 'operations' as const, label: 'Nghiệp vụ Kho', icon: ClipboardCheck },
              { key: 'storage' as const, label: 'Diện tích Kho', icon: Ruler },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`pb-3 lg:pb-4 text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === tab.key ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
                {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            ))}
          </div>
        );
        return headerPortal ? ReactDOM.createPortal(tabsContent, headerPortal) : tabsContent;
      })()}

      {activeTab === 'positions' && <WarehouseMap3D rolls={rolls} onRollClick={(roll) => handleShowDetail(roll as any)} />}
      {activeTab === 'operations' && <InventoryOperationsTab />}
      {activeTab === 'storage' && <StorageAreaManagement />}

      {activeTab === 'stock' && (
        <div className="space-y-4">
          <InventorySummaryTab rolls={rolls} onRollClick={handleShowDetail} actionButtons={inventoryActionButtons} />
        </div>
      )}

      <RollDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} roll={selectedRoll} onTransfer={() => setIsTransferOpen(true)} />

      {/* Catalog & Bulk Import Modal */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-6 h-6 text-violet-600" />
                Khai báo Hàng loạt
              </h2>
              <button onClick={() => setIsCatalogModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <ManualImportTab />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg shadow-green-200 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <PackageCheck className="w-5 h-5" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export 