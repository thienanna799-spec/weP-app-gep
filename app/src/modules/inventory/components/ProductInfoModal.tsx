import React, { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import { inventoryService } from '../services/inventory.service';
import { StockRow } from '../hooks/useStockSummary';

interface ProductInfoModalProps {
  selectedRow: StockRow;
  onClose: () => void;
}

export const ProductInfoModal: React.FC<ProductInfoModalProps> = ({ selectedRow, onClose }) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [editedInfo, setEditedInfo] = useState<any>({});
  
  const [customerPricings, setCustomerPricings] = useState<any[]>([]);
  const [loadingPricings, setLoadingPricings] = useState(false);
  const [showPricingPopover, setShowPricingPopover] = useState(false);

  useEffect(() => {
    if (selectedRow?.sku) {
      const fetchPricings = async () => {
        setLoadingPricings(true);
        try {
          const res = await inventoryService.getProductPricing(selectedRow.sku);
          setCustomerPricings(res || []);
        } catch (error) {
          console.error("Failed to fetch customer pricing", error);
        } finally {
          setLoadingPricings(false);
        }
      };
      fetchPricings();
    }
  }, [selectedRow?.sku]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-slate-800">
              {isEditingInfo ? 'Chỉnh sửa Thông tin SP' : 'Thông tin chi tiết Sản phẩm'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!isEditingInfo && (
              <button 
                onClick={() => {
                  setEditedInfo({
                    productName: selectedRow.productName || '',
                    sku: selectedRow.sku || '',
                    specification: selectedRow.specification || '',
                    color: (selectedRow as any).color || '',
                    size: (selectedRow as any).size || '',
                    salesUnit: (selectedRow as any).salesUnit || '',
                    unitSize: (selectedRow as any).unitSize || '',
                    costPrice: (selectedRow as any).costPriceLatest || (selectedRow as any).costPrice || 0,
                  });
                  setIsEditingInfo(true);
                }} 
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
              >
                Chỉnh sửa
              </button>
            )}
            <button onClick={() => { onClose(); setIsEditingInfo(false); }} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            {/* CORE FIELDS */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tên Sản Phẩm</p>
              {isEditingInfo ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" value={editedInfo.productName} onChange={e => setEditedInfo({...editedInfo, productName: e.target.value})} />
              ) : (
                <p className="font-semibold text-slate-800">{selectedRow.productName || '—'}</p>
              )}
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Quy cách</p>
              {isEditingInfo ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" value={editedInfo.specification} onChange={e => setEditedInfo({...editedInfo, specification: e.target.value})} />
              ) : (
                <p className="font-medium text-slate-800">{selectedRow.specification || '—'}</p>
              )}
            </div>
            
            <div className="col-span-2 h-px bg-slate-100 my-1"></div>
            
            {/* READ-ONLY GROUPING KEYS */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Xưởng (Nhà cung cấp)</p>
              <p className="font-medium text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100">{selectedRow.supplier || '—'} <span className="text-[10px] text-slate-400 font-normal ml-1">(Khóa)</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">SUB-SKU (Mã nội bộ)</p>
              <p className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100">{selectedRow.subSku || '—'} <span className="text-[10px] text-slate-400 font-normal ml-1">(Khóa)</span></p>
            </div>

            <div className="col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">SKU (Mã hiển thị)</p>
              {isEditingInfo ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none font-mono" value={editedInfo.sku} onChange={e => setEditedInfo({...editedInfo, sku: e.target.value})} />
              ) : (
                <p className="font-mono font-bold text-indigo-600">{selectedRow.sku || '—'}</p>
              )}
            </div>

            <div className="col-span-2 h-px bg-slate-100 my-1"></div>
            
            {/* EXTENDED FIELDS */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Màu sắc</p>
              {isEditingInfo ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" value={editedInfo.color} onChange={e => setEditedInfo({...editedInfo, color: e.target.value})} />
              ) : (
                <p className="font-medium text-slate-800">{(selectedRow as any).color || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Kích thước</p>
              {isEditingInfo ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" value={editedInfo.size} onChange={e => setEditedInfo({...editedInfo, size: e.target.value})} />
              ) : (
                <p className="font-medium text-slate-800">{(selectedRow as any).size || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Đơn vị bán</p>
              {isEditingInfo ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" value={editedInfo.salesUnit} onChange={e => setEditedInfo({...editedInfo, salesUnit: e.target.value})} />
              ) : (
                <p className="font-medium text-slate-800">{(selectedRow as any).salesUnit || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Kích thước ĐV</p>
              {isEditingInfo ? (
                <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none" value={editedInfo.unitSize} onChange={e => setEditedInfo({...editedInfo, unitSize: e.target.value})} />
              ) : (
                <p className="font-medium text-slate-800">{(selectedRow as any).unitSize || '—'}</p>
              )}
            </div>
            {isEditingInfo ? (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Giá Nhập / Giá Vốn</p>
                <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-800" value={editedInfo.costPrice} onChange={e => setEditedInfo({...editedInfo, costPrice: parseFloat(e.target.value) || 0})} />
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Giá nhập (Gần nhất)</p>
                  <p className="font-bold text-slate-800">{(selectedRow as any).costPriceLatest ? (selectedRow as any).costPriceLatest.toLocaleString('vi-VN') + ' đ' : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Giá nhập (TB)</p>
                  <p className="font-bold text-slate-800">{(selectedRow as any).costPriceAverage ? (selectedRow as any).costPriceAverage.toLocaleString('vi-VN') + ' đ' : '—'}</p>
                </div>
              </>
            )}
            <div className="relative">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Giá bán</p>
              <button 
                onClick={() => customerPricings.length > 0 && setShowPricingPopover(!showPricingPopover)}
                className={`text-left font-bold w-full transition-colors ${customerPricings.length > 0 ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 -ml-2 rounded cursor-pointer' : 'text-slate-400 cursor-default'}`}
                disabled={customerPricings.length === 0}
              >
                {loadingPricings ? 'Đang tải...' : customerPricings.length > 0 ? `${customerPricings.length} khách hàng` : 'Chưa thiết lập giá'}
              </button>
              
              {/* Popover */}
              {showPricingPopover && customerPricings.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPricingPopover(false)}></div>
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 font-bold text-xs text-slate-500">
                      BIỂU GIÁ KHÁCH HÀNG
                    </div>
                    <ul className="py-1">
                      {customerPricings.map(cp => (
                        <li key={cp.id} className="px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 flex justify-between items-center text-sm">
                          <span className="font-medium text-slate-700 truncate mr-2" title={cp.customer.name}>{cp.customer.name}</span>
                          <span className="font-bold text-emerald-600 whitespace-nowrap">{cp.price.toLocaleString('vi-VN')} đ</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
          {isEditingInfo ? (
            <>
              <button onClick={() => setIsEditingInfo(false)} disabled={savingInfo} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
                Hủy
              </button>
              <button 
                onClick={async () => {
                  setSavingInfo(true);
                  try {
                    const changedInfo: any = {};
                    if (editedInfo.productName && editedInfo.productName !== selectedRow.productName) changedInfo.productName = editedInfo.productName;
                    if (editedInfo.sku && editedInfo.sku !== selectedRow.sku) changedInfo.sku = editedInfo.sku;
                    if (editedInfo.specification && editedInfo.specification !== selectedRow.specification) changedInfo.specification = editedInfo.specification;
                    if (editedInfo.color && editedInfo.color !== (selectedRow as any).color) changedInfo.color = editedInfo.color;
                    if (editedInfo.size && editedInfo.size !== (selectedRow as any).size) changedInfo.size = editedInfo.size;
                    if (editedInfo.salesUnit && editedInfo.salesUnit !== (selectedRow as any).salesUnit) changedInfo.salesUnit = editedInfo.salesUnit;
                    if (editedInfo.unitSize && editedInfo.unitSize !== (selectedRow as any).unitSize) changedInfo.unitSize = editedInfo.unitSize;
                    if (editedInfo.costPrice !== undefined && editedInfo.costPrice !== (selectedRow as any).costPrice) changedInfo.costPrice = editedInfo.costPrice;

                    if (Object.keys(changedInfo).length > 0) {
                      await inventoryService.updateProductInfo(selectedRow.supplier, selectedRow.subSku, changedInfo);
                      Object.assign(selectedRow, changedInfo);
                    }
                    setIsEditingInfo(false);
                  } catch (err: any) {
                    alert('Lỗi cập nhật: ' + (err.message || err));
                  } finally {
                    setSavingInfo(false);
                  }
                }} 
                disabled={savingInfo} 
                className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {savingInfo ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="px-5 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors">
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
