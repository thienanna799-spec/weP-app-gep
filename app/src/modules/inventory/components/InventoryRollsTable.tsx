import React from 'react';
import { MapPin, PackageCheck, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { formatDate } from '../../../utils/format';
import { ProductRoll, RollStatus } from '../types';

interface Props {
  filteredRolls: ProductRoll[];
  handleShowDetail: (roll: ProductRoll) => void;
}

export const InventoryRollsTable: React.FC<Props> = ({ filteredRolls, handleShowDetail }) => {
  const { t } = useTranslation();

  const getStatusBadge = (status: RollStatus) => {
    switch (status) {
      case 'trong_kho': return <Badge variant="green">{t('status.trong_kho')}</Badge>;
      case 'da_giu_cho_don': return <Badge variant="blue">{t('status.da_giu_cho_don')}</Badge>;
      case 'da_xuat_kho': return <Badge variant="gray">{t('status.da_xuat_kho')}</Badge>;
      case 'loi_hong': return <Badge variant="red">{t('status.loi_hong')}</Badge>;
      case 'dang_san_xuat': return <Badge variant="yellow">{t('status.dang_san_xuat')}</Badge>;
      case 'hoan_tra': return <Badge variant="purple">{t('status.hoan_tra')}</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">{t('inventory.product_spec')}</th>
              <th className="px-6 py-4">{t('inventory.roll_qr')}</th>
              <th className="px-6 py-4">{t('inventory.position')}</th>
              <th className="px-6 py-4 text-center">{t('inventory.stats')}</th>
              <th className="px-6 py-4">{t('inventory.production_date')}</th>
              <th className="px-6 py-4">{t('common.status')}</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRolls.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">{t('inventory.no_rolls')}</td></tr>
            ) : filteredRolls.map(roll => (
              <tr key={roll.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => handleShowDetail(roll)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><PackageCheck className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{roll.productName}</p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-tight">{roll.specification}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">
                  <p className="text-slate-900 font-bold">{roll.code}</p>
                  <p className="text-slate-400">{roll.qrCode}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>{roll.positionWarehouse || '?'}-{roll.positionArea || '?'}-{roll.positionSlot || '?'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col text-[11px] font-mono">
                    <span className="text-slate-700">{roll.length}m</span>
                    <span className="text-slate-400">{roll.weight}kg</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(roll.productionDate)}</td>
                <td className="px-6 py-4">{getStatusBadge(roll.status)}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:bg-white hover:text-slate-900 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
