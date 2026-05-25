import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import { CatalogProduct } from './catalogTypes';

interface CatalogDetailPanelProps {
  selectedProduct: CatalogProduct;
  onClose: () => void;
}

export const CatalogDetailPanel: React.FC<CatalogDetailPanelProps> = ({ 
  selectedProduct, 
  onClose 
}) => {
  const { t } = useTranslation();

  return (
    <Card className="overflow-hidden border-2 border-teal-200 bg-gradient-to-b from-teal-50/30 to-white animate-in fade-in slide-in-from-bottom-2">
      <div className="px-5 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
            {t('inventory.product_catalog.product_detail')}
          </p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{selectedProduct.productName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-teal-100 text-teal-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'SKU', value: selectedProduct.sku },
            { label: 'SUB-SKU', value: selectedProduct.subSku },
            { label: t('inventory.product_catalog.col_color'), value: selectedProduct.color },
            { label: t('inventory.product_catalog.col_spec'), value: selectedProduct.specification },
          ].map((info, idx) => (
            <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{info.label}</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{info.value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
