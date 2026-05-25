import React, { useState } from 'react';
import { 
  Plus, 
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useMaterialsModule } from './hooks/useMaterialsModule';
import { Material } from './types';

// Sub-components
import MaterialTable from './components/MaterialTable';
import MaterialFormModal from './components/MaterialFormModal';
import ImportModal from './components/ImportModal';
import ExportModal from './components/ExportModal';
import ImageLightbox from './components/ImageLightbox';
import BomView from './components/BomView';
import MaterialFilterBar from './components/MaterialFilterBar';

const MaterialsPage: React.FC = () => {
  const { t } = useTranslation();
  const { materials, loading, refetch } = useMaterialsModule();
  const [activeTab, setActiveTab] = useState<'list' | 'transactions' | 'bom'>('list');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Lightbox state
  const [lightboxMaterial, setLightboxMaterial] = useState<Material | null>(null);

  const MATERIAL_GROUPS = [
    t('materials.groups.plastic_pellet'), t('materials.groups.pe_film'), t('materials.groups.carton'), t('materials.groups.tape'), t('materials.groups.qr_label'), 
    t('materials.groups.packaging'), t('materials.groups.paper_core'), t('materials.groups.ink'), t('materials.groups.pallet'), t('materials.groups.other')
  ];

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (m.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || m.group === selectedGroup;
    const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  const handleOpenForm = (material?: Material) => {
    setEditingMaterial(material || null);
    setIsFormOpen(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Tabs and Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-gray-200">
        <div className="flex gap-8 overflow-x-auto custom-scrollbar">
          {[
            { key: 'list' as const, label: t('materials.inventory_list') },
            { key: 'transactions' as const, label: t('materials.transaction_history') },
            { key: 'bom' as const, label: t('materials.bom') },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === tab.key ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pb-3">
          <Button variant="secondary" onClick={() => setIsImportOpen(true)} className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
            <ArrowDownLeft className="w-4 h-4" /><span>{t('materials.import_stock')}</span>
          </Button>
          <Button variant="secondary" onClick={() => setIsExportOpen(true)} className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
            <ArrowUpRight className="w-4 h-4" /><span>{t('materials.export_stock')}</span>
          </Button>
          <Button onClick={() => handleOpenForm()} className="gap-2 shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /><span>{t('materials.new_material')}</span>
          </Button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          <MaterialFilterBar 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup}
            selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
            MATERIAL_GROUPS={MATERIAL_GROUPS}
          />
          <MaterialTable materials={filteredMaterials} onEdit={handleOpenForm} onImageClick={setLightboxMaterial} />
        </div>
      )}

      {activeTab === 'bom' && <BomView />}

      {/* Modals */}
      <MaterialFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        editingMaterial={editingMaterial} 
        onSuccess={refetch} 
      />
      <ImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        materials={materials} 
        onSuccess={refetch} 
      />
      <ExportModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        materials={materials} 
        onSuccess={refetch} 
      />
      <ImageLightbox 
        material={lightboxMaterial} 
        onClose={() => setLightboxMaterial(null)} 
      />
    </div>
  );
};

export default MaterialsPage;
