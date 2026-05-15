import React from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';

interface Props {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  areaFilter: string;
  setAreaFilter: (val: string) => void;
  dateFilter: string;
  setDateFilter: (val: string) => void;
}

export const InventoryFilterBar: React.FC<Props> = ({
  searchTerm, setSearchTerm, statusFilter, setStatusFilter,
  areaFilter, setAreaFilter, dateFilter, setDateFilter
}) => {
  const { t } = useTranslation();

  return (
    <Card className="p-4 bg-white shadow-sm flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder={t('inventory.search_placeholder')} className="pl-10 h-10" value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t('common.status')}</label>
        <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">{t('common.all')}</option>
          <option value="trong_kho">{t('status.trong_kho')}</option>
          <option value="da_giu_cho_don">{t('status.da_giu_cho_don')}</option>
          <option value="dang_san_xuat">{t('status.dang_san_xuat')}</option>
          <option value="loi_hong">{t('status.loi_hong')}</option>
          <option value="da_xuat_kho">{t('status.da_xuat_kho')}</option>
          <option value="hoan_tra">{t('status.hoan_tra')}</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t('inventory.region')}</label>
        <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
          <option value="All">{t('inventory.all_regions')}</option>
          <option value="Khu A">Khu A</option>
          <option value="Khu B">Khu B</option>
          <option value="Khu C">Khu C</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t('inventory.production_date')}</label>
        <Input type="date" className="h-10 text-sm" value={dateFilter} onChange={(e: any) => setDateFilter(e.target.value)} />
      </div>
    </Card>
  );
};
