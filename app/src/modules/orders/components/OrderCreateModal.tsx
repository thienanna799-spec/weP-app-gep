/**
 * OrderCreateModal — Compact layout, minimal scrolling
 * Logic in useOrderCreateForm hook.
 */
import React from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Order } from '../../../types/order.types';
import CustomerSearchInput from '../../customers/components/CustomerSearchInput';
import { useOrderCreateForm } from '../hooks/useOrderCreateForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Partial<Order>, items: any[]) => Promise<void>;
  saving: boolean;
}

const OrderCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave, saving }) => {
  const h = useOrderCreateForm(isOpen);
  const sel = "w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm";

  const handleCreate = async () => {
    if (!h.formData.customerName?.trim()) { alert('Vui lòng nhập tên khách hàng'); return; }
    if (!h.formData.customerPhone?.trim()) { alert('Vui lòng nhập SĐT'); return; }
    if (!h.formData.customerAddress?.trim()) { alert('Vui lòng nhập địa chỉ'); return; }

    // Filter out items with quantity = 0
    const activeItems = h.formItems.filter(i => i.quantity > 0);
    if (activeItems.length === 0) { alert('Vui lòng nhập số lượng cho ít nhất 1 sản phẩm'); return; }

    // Aggregate items with same SKU: combine quantities, keep same unitPrice
    const skuMap = new Map<string, typeof activeItems[0]>();
    for (const item of activeItems) {
      const key = item.sku || item.subSku;
      const existing = skuMap.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        skuMap.set(key, { ...item });
      }
    }
    const mergedItems = Array.from(skuMap.values());

    const totalQty = mergedItems.reduce((s, i) => s + i.quantity, 0);
    const totalRevenue = mergedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    await onSave({ ...h.formData, quantity: totalQty, totalRevenue: totalRevenue || undefined } as any, mergedItems);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo đơn hàng mới" size="xl"
      footer={<div className="flex justify-end gap-2 w-full">
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}Tạo đơn hàng
        </Button></div>}>
      <div className="space-y-3">
        {/* Row 1: Customer + Config inline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Customer */}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Khách hàng</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-slate-500 font-bold">Tên KH *</label>
                <CustomerSearchInput value={h.formData.customerName||''} onChange={val=>h.setFormData(p=>({...p,customerName:val}))} onSelect={h.selectCustomer} autoFocus placeholder="Tìm hoặc nhập..."/></div>
              <div><label className="text-[10px] text-slate-500 font-bold">SĐT *</label>
                <Input value={h.formData.customerPhone||''} onChange={(e:any)=>h.setFormData(p=>({...p,customerPhone:e.target.value}))} placeholder="0901..."/></div>
              <div><label className="text-[10px] text-slate-500 font-bold">Email</label>
                <Input value={h.formData.customerEmail||''} onChange={(e:any)=>h.setFormData(p=>({...p,customerEmail:e.target.value}))}/></div>
              <div><label className="text-[10px] text-slate-500 font-bold">Địa chỉ *</label>
                <Input value={h.formData.customerAddress||''} onChange={(e:any)=>h.setFormData(p=>({...p,customerAddress:e.target.value}))} placeholder="123 Đường..."/></div>
            </div>
          </div>
          {/* Config + Payment */}
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cấu hình & Thanh toán</p>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[10px] text-slate-500 font-bold">Ưu tiên</label>
                  <select value={h.formData.priority||'trung_binh'} onChange={e=>h.setFormData(p=>({...p,priority:e.target.value as any}))} className={sel}>
                    <option value="thap">Thấp</option><option value="trung_binh">TB</option><option value="cao">Cao</option><option value="khan_cap">Khẩn</option></select></div>
                <div><label className="text-[10px] text-slate-500 font-bold">Phương thức</label>
                  <select value={(h.formData as any).paymentMethod||'bank_transfer'} onChange={e=>h.setFormData(p=>({...p,paymentMethod:e.target.value as any}))} className={sel}>
                    <option value="cod">COD</option><option value="bank_transfer">CK</option><option value="credit">Công nợ</option></select></div>
                <div><label className="text-[10px] text-slate-500 font-bold">Ghi chú</label>
                  <Input value={h.formData.note||''} onChange={(e:any)=>h.setFormData(p=>({...p,note:e.target.value}))}/></div>
              </div>
            </div>
            {(h.formData as any).paymentMethod==='bank_transfer'&&(
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                {h.bankAccounts.length>0&&(<div className="flex flex-wrap gap-1.5 mb-2">
                  {h.bankAccounts.map(ba=>(<button key={ba.id} type="button" onClick={()=>h.setFormData(p=>({...p,bankAccountId:ba.id,bankName:ba.bankName,bankAccountNumber:ba.accountNumber,bankAccountHolder:ba.accountHolder}))}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${(h.formData as any).bankAccountId===ba.id?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}`}>
                    🏦 {ba.bankName} · {ba.accountNumber}{ba.isDefault&&<span className="ml-1 text-[9px] opacity-75">(MĐ)</span>}</button>))}</div>)}
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[10px] text-slate-500 font-bold">Ngân hàng</label><Input value={(h.formData as any).bankName||''} onChange={(e:any)=>h.setFormData(p=>({...p,bankName:e.target.value}))}/></div>
                  <div><label className="text-[10px] text-slate-500 font-bold">Số TK</label><Input value={(h.formData as any).bankAccountNumber||''} onChange={(e:any)=>h.setFormData(p=>({...p,bankAccountNumber:e.target.value}))}/></div>
                  <div><label className="text-[10px] text-slate-500 font-bold">Chủ TK</label><Input value={(h.formData as any).bankAccountHolder||''} onChange={(e:any)=>h.setFormData(p=>({...p,bankAccountHolder:e.target.value}))}/></div>
                </div>
              </div>)}
          </div>
        </div>

        {/* Items — Table layout */}
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm</p>
              {h.autoPopLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />}
              {!h.autoPopLoading && h.autoPopCount > 0 && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                  ✓ {h.autoPopCount} SP từ bảng giá
                </span>
              )}
            </div>
            <button onClick={h.addFormItem} className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"><Plus className="w-3 h-3"/>Thêm SP</button>
          </div>

          {h.autoPopLoading && <p className="text-xs text-blue-500 italic text-center py-2"><Loader2 className="w-4 h-4 animate-spin inline mr-1" />Đang tải...</p>}
          {!h.autoPopLoading && h.formItems.length===0&&<p className="text-xs text-slate-400 italic text-center py-2">Chọn KH để tự động thêm hoặc bấm "+ Thêm SP".</p>}

          {h.formItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1.5fr_70px_60px_90px_50px_30px] gap-1 px-2 py-1.5 bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">
                <span>SUB-SKU</span><span>SKU</span><span className="text-center">Kho</span><span className="text-center">SL</span><span className="text-right">Đơn giá</span><span className="text-right">Tổng</span><span></span>
              </div>
              {/* Table rows */}
              {h.formItems.map((item,idx)=>(
                <div key={idx} className={`border-t border-slate-100 ${item.tonKho === 0 ? 'bg-red-50/30' : ''}`}>
                  <div className="grid grid-cols-[2fr_1.5fr_70px_60px_90px_50px_30px] gap-1 px-2 py-1.5 items-center relative">
                    {/* SUB-SKU */}
                    <div className="relative">
                      <input value={item.subSku} onChange={(e:any)=>h.handleSubSkuChange(idx,e.target.value)} onFocus={()=>h.setSkuSearchIdx(idx)}
                        placeholder="Mã SUB-SKU..."
                        className="w-full h-8 rounded border border-slate-200 px-2 text-[11px] font-mono font-bold text-slate-700 bg-white focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 outline-none"/>
                      {h.skuSearching&&h.skuSearchIdx===idx&&<Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"/>}
                      {h.skuSearchIdx===idx&&h.skuResults.length>0&&(
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-[200px] overflow-auto">
                          {h.skuResults.map((r,ri)=>(<button key={ri} type="button" onClick={()=>h.selectSubSku(idx,r)} className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b border-slate-100 last:border-0">
                            <p className="text-xs font-bold text-slate-800 font-mono">{r.subSku}</p>
                            <p className="text-[10px] text-slate-500">SKU: <span className="font-bold text-indigo-600">{r.sku||'—'}</span> · {r.productName}</p>
                          </button>))}</div>)}
                    </div>
                    {/* SKU */}
                    <div className="h-8 flex items-center rounded border border-indigo-200 bg-indigo-50 px-2 text-[11px] font-mono font-bold text-indigo-700 truncate">
                      {item.sku || '—'}
                    </div>
                    {/* Tồn kho */}
                    <div className={`h-8 flex items-center justify-center rounded border text-[11px] font-bold ${item.tonKho > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                      {item.tonKho.toLocaleString('vi-VN')}
                    </div>
                    {/* SL */}
                    {item.tonKho === 0 ? (
                      <div className="h-8 flex items-center justify-center rounded border bg-slate-100 border-slate-200 text-[11px] text-slate-400 font-bold">0</div>
                    ) : (
                      <input type="number" value={item.quantity} min={0} max={item.tonKho}
                        onChange={(e:any)=>{
                          const val = parseInt(e.target.value)||0;
                          const capped = Math.min(Math.max(0, val), item.tonKho);
                          h.setFormItems(prev=>prev.map((it,i)=>i===idx?{...it,quantity:capped}:it));
                        }}
                        className={`w-full h-8 rounded border px-2 text-[11px] font-bold text-center outline-none focus:ring-2 focus:ring-blue-400/30 ${
                          item.quantity > 0 && item.quantity >= item.tonKho ? 'bg-amber-50 border-amber-400 text-amber-700' : 'border-slate-200'
                        }`}/>
                    )}
                    {/* Đơn giá */}
                    <input type="number" value={item.unitPrice}
                      onChange={(e:any)=>h.setFormItems(prev=>prev.map((it,i)=>i===idx?{...it,unitPrice:parseInt(e.target.value)||0}:it))}
                      className={`w-full h-8 rounded border px-2 text-[11px] font-bold text-right outline-none focus:ring-2 focus:ring-blue-400/30 ${
                        item.unitPrice>0?'bg-green-50 border-green-200 text-green-700':'border-slate-200'
                      }`}/>
                    {/* Subtotal */}
                    <span className="text-[10px] font-bold text-slate-600 text-right">₱{(item.quantity*item.unitPrice).toLocaleString('en-PH')}</span>
                    {/* Delete */}
                    <button onClick={()=>h.removeFormItem(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Xóa"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                  {/* Status messages */}
                  {item.tonKho === 0 && <p className="px-2 pb-1 text-[9px] text-red-500 font-bold">🚫 Hết hàng — nhập kho trước.</p>}
                  {item.tonKho > 0 && item.quantity >= item.tonKho && <p className="px-2 pb-1 text-[9px] text-amber-600 font-bold">⚠ Max {item.tonKho.toLocaleString('vi-VN')} SP</p>}
                </div>
              ))}
              {/* Total */}
              <div className="border-t border-slate-200 px-2 py-2 bg-slate-50 text-right">
                <span className="text-sm font-bold text-slate-600">Tổng: </span>
                <span className="text-base font-bold text-indigo-700">₱{h.formItems.reduce((s,i)=>s+i.quantity*i.unitPrice,0).toLocaleString('en-PH')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default OrderCreateModal;
