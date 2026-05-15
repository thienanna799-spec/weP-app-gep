import React from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface MaterialFilterBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedGroup: string;
  setSelectedGroup: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  MATERIAL_GROUPS: string[];
}

const MaterialFilterBar: React.FC<MaterialFilterBarProps> = ({
  searchTerm, setSearchTerm,
  selectedGroup, setSelectedGroup,
  selectedStatus, setSelectedStatus,
  MATERIAL_GROUPS
}) => {
  const { t } = useTranslation();

  return (
    <Card className="p-4 bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder={t('materials.search_placeholder')} 
            className="pl-10" 
            value={searchTerm} 
            onChange={(e: any) => setSearchTerm(e.target.value)} 
          />
        </div>
        <select 
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm" 
          value={selectedGroup} 
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="All">{t('common.all_groups')}</option>
          {MATERIAL_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select 
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm" 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All">{t('common.all_statuses')}</option>
          <option value="còn hàng">{t('materials.in_stock')}</option>
          <option value="sắp hết">{t('materials.low_stock')}</option>
          <option value="hết hàng">{t('materials.out_of_stock')}</option>
          <option value="ngừng sử dụng">{t('materials.discontinued')}</option>
        </select>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 gap-2"><Filter className="w-4 h-4" /><span>{t('common.advanced')}</span></Button>
          <Button variant="secondary" className="p-2"><Download className="w-4 h-4" /></Button>
        </div>
      </div>
    </Card>
  );
};

export default MaterialFilterBar;
