import React, { useState } from 'react';
import { 
  Plus, 
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useMaterialsModule } from './hooks/useMaterialsModule';
import { materialsService } from './services/materials.service';
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
  const { materials, loading, error, refetch } = useMaterialsModule();
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

  // Form state
  const [formData, setFormData] = useState<Partial<Material>>({
    code: '', name: '', group: 'Hạt nhựa', unit: 'kg',
    currentStock: 0, minStock: 0, purchasePrice: 0,
    supplier: '', warehouseLocation: '', status: 'còn hàng',
    notes: '', imageUrl: ''
  });

  // Import state
  const [importItems, setImportItems] = useState<Array<{materialId: string; materialName: string; quantity: number; unitPrice: number}>>([]);
  const [importSupplier, setImportSupplier] = useState('');
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [importRef, setImportRef] = useState('');
  const [importNotes, setImportNotes] = useState('');
  const [importSaving, setImportSaving] = useState(false);

  // Export state
  const [exportItems, setExportItems] = useState<Array<{materialId: string; materialName: string; quantity: number}>>([]);
  const [exportRef, setExportRef] = useState('');
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportNotes, setExportNotes] = useState('');
  const [exportSaving, setExportSaving] = useState(false);

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
    if (material) {
      setEditingMaterial(material);
      setFormData(material);
    } else {
      setEditingMaterial(null);
      setFormData({
        code: `MAT-${Date.now().toString().slice(-6)}`,
        name: '', group: 'Hạt nhựa', unit: 'kg',
        currentStock: 0, minStock: 10, purchasePrice: 0,
        supplier: '', warehouseLocation: '', status: 'còn hàng',
        notes: '', imageUrl: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleSaveMaterial = async () => {
    try {
      if (editingMaterial) {
        await materialsService.update(editingMaterial.id, formData);
      } else {
        await materialsService.create(formData as Omit<Material, 'id' | 'updatedAt'>);
      }
      setIsFormOpen(false);
      refetch();
    } catch (err) {
      alert(t('materials.save_error') + ': ' + err);
    }
  };

  const handleImport = async () => {
    const validItems = importItems.filter(i => i.materialId && i.quantity > 0);
    if (validItems.length === 0) { alert(t('materials.valid_item_required')); return; }
    setImportSaving(true);
    try {
      await materialsService.createTransaction({
        type: 'import', operator: 'Admin',
        supplier: importSupplier || undefined, referenceId: importRef || undefined,
        notes: importNotes || undefined, items: validItems
      });
      setIsImportOpen(false);
      setImportItems([]); setImportSupplier(''); setImportRef(''); setImportNotes('');
      window.location.reload();
    } catch (err: any) {
      alert(t('materials.import_error') + ': ' + (err.message || err));
    } finally { setImportSaving(false); }
  };

  const handleExport = async () => {
    const validItems = exportItems.filter(i => i.materialId && i.quantity > 0);
    if (validItems.length === 0) { alert(t('materials.valid_item_required')); return; }
    for (const item of validItems) {
      const mat = materials.find(m => m.id === item.materialId);
      if (mat && item.quantity > mat.currentStock) {
        alert(`${mat.name} chỉ còn ${mat.currentStock} ${mat.unit}, không thể xuất ${item.quantity}`);
        return;
      }
    }
    setExportSaving(true);
    try {
      await materialsService.createTransaction({
        type: 'export', operator: 'Admin',
        referenceId: exportRef || undefined, notes: exportNotes || undefined,
        items: validItems
      });
      setIsExportOpen(false);
      setExportItems([]); setExportRef(''); setExportNotes('');
      window.location.reload();
    } catch (err: any) {
      alert(t('materials.export_error') + ': ' + (err.message || err));
    } finally { setExportSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">{t('materials.title')}</h2>
          <p className="text-gray-500 text-sm">{t('materials.subtitle')}</p>
        </div>
        <div className="flex gap-2">
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-8 overflow-x-auto custom-scrollbar">
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
      <MaterialFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} editingMaterial={editingMaterial} formData={formData} setFormData={setFormData} onSave={handleSaveMaterial} />
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} materials={materials} importItems={importItems} setImportItems={setImportItems} importSupplier={importSupplier} setImportSupplier={setImportSupplier} importDate={importDate} setImportDate={setImportDate} importRef={importRef} setImportRef={setImportRef} importNotes={importNotes} setImportNotes={setImportNotes} importSaving={importSaving} onImport={handleImport} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} materials={materials} exportItems={exportItems} setExportItems={setExportItems} exportRef={exportRef} setExportRef={setExportRef} exportDate={exportDate} setExportDate={setExportDate} exportNotes={exportNotes} setExportNotes={setExportNotes} exportSaving={exportSaving} onExport={handleExport} />
      <ImageLightbox material={lightboxMaterial} onClose={() => setLightboxMaterial(null)} />
    </div>
  );
};

export default MaterialsPage;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    