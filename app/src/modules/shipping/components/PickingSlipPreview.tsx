/**
 * PickingSlipPreview — Modal for warehouse picking slip
 * CSS/HTML template extracted to utils/printStyles.ts
 */
import React, { useState, useEffect } from 'react';
import { Download, Printer, ExternalLink, Loader2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import api from '../../../services/api';
import { getPickingSlipStyles, buildPrintHTMLBody, GEP_LOGO, GEP_FOOTER } from '../utils/printStyles';

interface PickingSlipItem { no: number; productName: string; subSku: string; sku: string; pcs: number; quantity: number; unit: string; note?: string; }
interface PickingSlipData { pickingSlipNumber: string; orderCode: string; slipDate: string; customerName: string; customerAddress: string; customerPhone: string; statusLabel: string; items: PickingSlipItem[]; totalItems: number; totalQuantity: number; notes?: string; }
interface Props { isOpen: boolean; onClose: () => void; shippingId: string; shippingCode: string; }

const PickingSlipPreview: React.FC<Props> = ({ isOpen, onClose, shippingId, shippingCode }) => {
  const [data, setData] = useState<PickingSlipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (isOpen && shippingId) {
      setLoading(true);
      api.get<PickingSlipData>(`/shipping/${shippingId}/picking-slip/data`)
        .then(setData)
        .catch(() => {
          api.get<any>(`/orders/${shippingId}`).then(order => {
            const items: PickingSlipItem[] = (order.items || []).map((item: any, idx: number) => ({
              no: idx + 1, productName: item.productName || '', subSku: item.subSku || '',
              sku: item.sku || '', pcs: 1, quantity: item.quantity || 0, unit: item.unit || 'cuộn', note: item.note || '',
            }));
            setData({
              pickingSlipNumber: `PK-${order.code}`, orderCode: order.code,
              slipDate: new Date().toLocaleDateString('vi-VN'),
              customerName: order.customerName || '', customerAddress: order.customerAddress || '',
              customerPhone: order.customerPhone || '', statusLabel: order.status || '', items,
              totalItems: items.length, totalQuantity: items.reduce((s: number, i: PickingSlipItem) => s + i.quantity, 0),
              notes: order.note || '',
            });
          }).catch(err => console.error('Failed to load picking slip:', err));
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, shippingId]);

  const buildPrintHTML = () => {
    if (!data) return '';
    const itemRows = data.items.length > 0
      ? data.items.map((item, idx) => `
        <tr${idx % 2 !== 0 ? ' style="background:#f0f4fa"' : ''}>
          <td>${item.no}</td>
          <td style="text-align:left;font-family:'Courier New',monospace;color:#1e40af;font-weight:700">${item.subSku || '—'}</td>
          <td class="product-name" style="text-align:left">${item.productName}</td>
          <td style="font-weight:700">${item.quantity}</td>
          <td>${item.unit}</td>
          <td style="text-align:left">${item.note || ''}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="padding:20px;text-align:center;color:#8a8aa0;font-style:italic">Không có sản phẩm</td></tr>';
    const notesHTML = data.notes ? `<div class="notes-section"><div class="notes-label">Ghi chú:</div><div>${data.notes}</div></div>` : '';
    const body = buildPrintHTMLBody({
      title: 'PHIẾU LẤY HÀNG', date: data.slipDate, orderCode: data.orderCode, logoUrl: GEP_LOGO,
      customerName: data.customerName, customerAddress: data.customerAddress, customerPhone: data.customerPhone,
      tableHeaders: ['<th style="width:50px">STT</th>', 'SUB-SKU', 'Sản phẩm', '<th style="width:80px">Số lượng</th>', '<th style="width:70px">ĐVT</th>', '<th style="width:150px">Ghi chú</th>'],
      itemRows, notesHTML, signatures: ['Người lấy hàng', 'Thủ kho', 'Quản lý'], footerText: GEP_FOOTER,
    });
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Phiếu lấy hàng - ${data.orderCode}</title><style>${getPickingSlipStyles()}</style></head><body>${body}</body></html>`;
  };

  const openWindow = (html: string) => { const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); } return w; };
  const handlePrint = () => { const w = openWindow(buildPrintHTML()); w?.addEventListener('load', () => setTimeout(() => w.print(), 400)); };
  const handleOpenPreview = () => { openWindow(buildPrintHTML()); };

  const handleDownloadPDF = async () => {
    setDownloadLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/shipping/${shippingId}/picking-slip/pdf`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Phieu_lay_hang_${data?.orderCode || shippingCode}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { handlePrint(); }
    finally { setDownloadLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Phiếu lấy hàng" size="lg"
      footer={<div className="flex flex-wrap gap-2 w-full">
        <Button variant="secondary" onClick={handleOpenPreview} className="gap-1.5"><ExternalLink className="w-4 h-4"/>Xem HTML</Button>
        <Button variant="secondary" onClick={handlePrint} className="gap-1.5"><Printer className="w-4 h-4"/>In</Button>
        <Button onClick={handleDownloadPDF} disabled={downloadLoading} className="gap-1.5 bg-emerald-600 shadow-md shadow-emerald-100">
          {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}Tải PDF</Button>
        <div className="flex-1"/><Button variant="secondary" onClick={onClose}>Đóng</Button></div>}>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin"/></div>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex justify-between items-start border-b-2 border-emerald-100 pb-4">
            <div><h3 className="text-xl font-black text-emerald-800 tracking-tight">PHIẾU LẤY HÀNG</h3><p className="text-xs text-slate-400 font-mono mt-1">{data.pickingSlipNumber}</p></div>
            <div className="text-right space-y-1">
              <p className="text-xs text-slate-500"><span className="font-bold text-emerald-600">Ngày:</span> {data.slipDate}</p>
              <p className="text-xs text-slate-500"><span className="font-bold text-emerald-600">Mã đơn:</span> {data.orderCode}</p></div>
          </div>
          <div className="flex justify-between items-start gap-6">
            <div className="flex items-center pl-16 w-[55%]"><img src={GEP_LOGO} alt="GEP" className="w-full h-32 object-contain object-left" onError={(e:any)=>{e.target.style.display='none';}}/></div>
            <div className="w-[45%] bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Khách hàng</p>
              <p className="text-sm font-bold text-slate-900">{data.customerName}</p>
              <p className="text-xs text-slate-500 mt-1">{data.customerAddress}</p>
              <p className="text-xs text-slate-500 font-mono">{data.customerPhone}</p></div>
          </div>
          <div className="overflow-hidden rounded-xl border border-emerald-200">
            <table className="w-full text-left">
              <thead><tr className="bg-emerald-50 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                <th className="px-3 py-2.5 text-center w-10">STT</th><th className="px-3 py-2.5">SUB-SKU</th><th className="px-3 py-2.5">Sản phẩm</th>
                <th className="px-3 py-2.5 text-center w-20">Số lượng</th><th className="px-3 py-2.5 text-center w-16">ĐVT</th><th className="px-3 py-2.5">Ghi chú</th></tr></thead>
              <tbody className="divide-y divide-emerald-100">
                {data.items.length > 0 ? data.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                    <td className="px-3 py-2 text-center text-xs text-slate-400">{item.no}</td>
                    <td className="px-3 py-2 text-xs font-mono text-blue-700 font-bold">{item.subSku || '—'}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.productName}</td>
                    <td className="px-3 py-2 text-center text-sm font-bold text-slate-900">{item.quantity}</td>
                    <td className="px-3 py-2 text-center text-xs text-slate-500">{item.unit}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{item.note || ''}</td></tr>
                )) : <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400 italic">Không có sản phẩm</td></tr>}
              </tbody></table></div>
          {data.notes && <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3"><p className="text-xs font-bold text-amber-600 uppercase mb-1">Ghi chú</p><p className="text-sm text-amber-800">{data.notes}</p></div>}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-emerald-200">
            {['NGƯỜI LẤY HÀNG', 'THỦ KHO', 'QUẢN LÝ'].map(l => <div key={l} className="text-center space-y-12"><p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{l}</p><p className="text-[10px] text-slate-400 italic">Ký, ghi rõ họ tên</p></div>)}</div>
          <div className="text-center text-[10px] text-slate-400 border-t border-emerald-100 pt-3">GEP Eco-Friendly Packaging · 275 Nguyễn Trãi, Thanh Xuân, Hà Nội · Tel: 08484847777</div>
        </div>
      ) : <div className="py-12 text-center text-sm text-slate-400 italic">Không tải được dữ liệu phiếu lấy hàng</div>}
    </Modal>
  );
};

export default PickingSlipPreview;
