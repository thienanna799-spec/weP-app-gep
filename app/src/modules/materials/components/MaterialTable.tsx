import React from 'react';
import { Edit2, Trash2, MoreVertical, ImageIcon } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { Material, MaterialStatus } from '../types';

interface MaterialTableProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onImageClick: (material: Material) => void;
}

const MaterialTable: React.FC<MaterialTableProps> = ({ materials, onEdit, onImageClick }) => {
  const { t } = useTranslation();

  const statusBadge = (status: MaterialStatus) => {
    switch (status) {
      case 'còn hàng': return <Badge variant="green">{t('materials.in_stock')}</Badge>;
      case 'sắp hết': return <Badge variant="yellow">{t('materials.low_stock')}</Badge>;
      case 'hết hàng': return <Badge variant="red">{t('materials.out_of_stock')}</Badge>;
      case 'ngừng sử dụng': return <Badge variant="gray">{t('materials.discontinued')}</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };
  return (
    <Card className="overflow-hidden border-none shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">{t('materials.material_name')}</th>
              <th className="px-6 py-4">{t('materials.group')}</th>
              <th className="px-6 py-4 text-center">{t('materials.current_stock')}</th>
              <th className="px-6 py-4 text-center">{t('materials.min_stock')}</th>
              <th className="px-6 py-4">{t('common.supplier')}</th>
              <th className="px-6 py-4">{t('common.status')}</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {materials.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                  {t('common.no_data')}
                </td>
              </tr>
            ) : (
              materials.map(m => (
                <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {m.imageUrl ? (
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:scale-110 transition-all duration-200"
                          onClick={(e) => { e.stopPropagation(); onImageClick(m); }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{m.name}</p>
                        <p className="text-xs text-slate-500 font-mono italic">{m.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">{m.group}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-bold">
                    <span className={m.currentStock <= m.minStock ? 'text-red-600' : 'text-gray-900'}>
                      {m.currentStock} {m.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500 text-sm font-mono">
                    {m.minStock} {m.unit}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 truncate max-w-[150px] block">{m.supplier}</span>
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(m.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(m)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default MaterialTable;
