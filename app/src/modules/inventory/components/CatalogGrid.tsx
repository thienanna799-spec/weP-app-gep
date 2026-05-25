import React from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CatalogProduct } from './catalogTypes';

interface CatalogGridProps {
  products: CatalogProduct[];
  filteredProducts: CatalogProduct[];
  selectedProduct: CatalogProduct | null;
  onSelectProduct: (product: CatalogProduct) => void;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ 
  products, 
  filteredProducts, 
  selectedProduct, 
  onSelectProduct 
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-100 flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-teal-500" /> {t('inventory.product_catalog.catalog_list')} ({filteredProducts.length})
        </h4>
      </div>
      <div className="max-h-[500px] overflow-auto">
        {filteredProducts.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400 text-sm italic">
            {products.length === 0
              ? t('inventory.product_catalog.no_products')
              : t('inventory.product_catalog.no_results')}
          </div>
        ) : (
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-3 py-2.5 sticky left-0 bg-slate-50 z-20">#</th>
                <th className="px-3 py-2.5">SKU</th>
                <th className="px-3 py-2.5">{t('inventory.product_catalog.col_supplier')}</th>
                <th className="px-3 py-2.5">{t('inventory.product_catalog.col_product_name')}</th>
                <th className="px-3 py-2.5">SUB-SKU</th>
                <th className="px-3 py-2.5">{t('inventory.product_catalog.col_color')}</th>
                <th className="px-3 py-2.5">{t('inventory.product_catalog.col_spec')}</th>
                <th className="px-3 py-2.5">{t('inventory.product_catalog.col_other_specs')}</th>
                <th className="px-3 py-2.5 text-right">{t('inventory.product_catalog.col_cost_price')}</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product, idx) => {
                const isActive = selectedProduct?.id === product.id;
                return (
                  <tr
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className={`cursor-pointer transition-all hover:bg-teal-50/40 group ${
                      isActive ? 'bg-teal-50 ring-1 ring-inset ring-teal-300' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 text-slate-400 font-mono sticky left-0 bg-white border-r border-slate-100 group-hover:bg-teal-50/40">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 font-medium whitespace-nowrap">
                      {product.sku || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{product.supplier || '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[180px] truncate group-hover:text-teal-700 transition-colors">
                      {product.productName}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">{product.subSku || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {product.color ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ background: product.color.toLowerCase().includes('đen') ? '#1e293b' : product.color.toLowerCase().includes('trắng') ? '#fff' : product.color.toLowerCase().includes('đỏ') ? '#ef4444' : product.color.toLowerCase().includes('xanh') ? '#3b82f6' : '#94a3b8' }}></span>
                          {product.color}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{product.specification || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 max-w-[120px] truncate">{product.otherSpecs || '—'}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                      {product.costPrice != null ? product.costPrice.toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button className="p-1.5 text-slate-400 hover:bg-teal-100 hover:text-teal-700 rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};
