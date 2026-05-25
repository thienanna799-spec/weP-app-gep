import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  Search, Plus, QrCode, History, MapPin, 
  ClipboardCheck, BarChart3, Layers, PackagePlus, Download, Ruler,
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
import WarehouseMap3D from './components/WarehouseMap3D';
import StorageAreaManagement from './components/StorageAreaManagement';
import RollDetailModal from './components/RollDetailModal';
import { CatalogModal } from './components/CatalogModal';
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
    <div className="h-[calc(100vh-90px)] flex flex-col overflow-hidden">




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
        <div className="flex-1 min-h-0 flex flex-col">
          <InventorySummaryTab rolls={rolls} onRollClick={handleShowDetail} actionButtons={inventoryActionButtons} />
        </div>
      )}

      <RollDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} roll={selectedRoll} onTransfer={() => setIsTransferOpen(true)} />

      {/* Catalog & Bulk Import Modal */}
      <CatalogModal 
        isOpen={isCatalogModalOpen} 
        onClose={() => setIsCatalogModalOpen(false)} 
      />
    </div>
  );
};

export default InventoryPage;