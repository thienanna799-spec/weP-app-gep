import React, { useState } from 'react';
import { inventoryService } from '../services/inventory.service';

export const PricingCell = ({ sku, count }: { sku: string, count: number }) => {
  const [pricings, setPricings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent row click from opening modal
    if (pricings !== null) {
      setShow(!show);
      return;
    }
    if (!sku) return;
    setLoading(true);
    try {
      const res = await inventoryService.getProductPricing(sku);
      setPricings(res || []);
      setShow(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!sku) return <span className="text-slate-400">-</span>;

  return (
    <div className="relative inline-block text-right" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={handleClick} 
        className={`font-bold px-2 py-0.5 rounded transition-colors ${count > 0 ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50' : 'text-slate-400 cursor-default'}`}
        disabled={count === 0}
      >
        {loading ? '...' : `${count} khách`}
      </button>
      
      {show && pricings !== null && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShow(false); }}></div>
          <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto text-left cursor-default" onClick={e => e.stopPropagation()}>
            <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 font-bold text-[10px] uppercase tracking-wider text-slate-500 flex justify-between items-center">
              <span>BIỂU GIÁ KHÁCH HÀNG</span>
              <button onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-700 font-black text-xs px-1">✕</button>
            </div>
            <ul className="py-1">
              {pricings.length === 0 ? (
                <li className="px-3 py-2 text-xs text-slate-500 italic text-center">Chưa thiết lập giá</li>
              ) : (
                pricings.map(cp => (
                  <li key={cp.id} className="px-3 py-1.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 flex justify-between items-center text-[11px]">
                    <span className="font-medium text-slate-700 truncate mr-2" title={cp.customer.name}>{cp.customer.name}</span>
                    <span className="font-bold text-emerald-600 whitespace-nowrap">{cp.price.toLocaleString('vi-VN')} đ</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
