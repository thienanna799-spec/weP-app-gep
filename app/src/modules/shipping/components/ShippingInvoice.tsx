/**
 * ShippingInvoice — Shipping delivery note (no price columns)
 * CSS/HTML template extracted to utils/printStyles.ts
 */
import React, { useState, useEffect } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { invoiceService, InvoiceData } from '../../orders/services/invoice.service';
import { getShippingInvoiceStyles, buildPrintHTMLBody, GEP_LOGO, GEP_FOOTER } from '../utils/printStyles';

interface Props { isOpen: boolean; onClose: () => void; orderId: string; orderCode: string; }

const ShippingInvoice: React.FC<Props> = ({ isOpen, onClose, orderId, orderCode }) => {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      invoiceService.getData(orderId).then(setData).catch(err => console.error('Failed to load invoice:', err)).finally(() => setLoading(false));
    }
  }, [isOpen, orderId]);

  const buildPrintHTML = () => {
    if (!data) return '';
    const itemRows = data.items.length > 0
      ? data.items.map((item, idx) => `
        <tr${idx % 2 !== 0 ? ' style="background:#f0f4fa"' : ''}>
          <td>${item.no}</td>
          <td style="text-align:left;font-family:'Courier New',monospace;color:#047857;font-weight:700">${(item as any).sku || '—'}</td>
          <td class="product-name" style="text-align:left">${item.productName}</td>
          <td style="font-weight:700">${item.quantity}</td>
          <td>${item.unit}</td>
          <td style="text-align:left">${item.note || ''}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="padding:20px;text-align:center;color:#8a8aa0;font-style:italic">Không có sản phẩm</td></tr>';
    const notesHTML = data.notes ? `<div class="notes-section"><div class="notes-label">Ghi chú:</div><div>${data.notes}</div></div>` : '';
    const body = buildPrintHTMLBody({
      title: 'PHIẾU GIAO HÀNG', date: data.invoiceDate, orderCode, logoUrl: GEP_LOGO,
      customerName: data.customerName, customerAddress: data.customerAddress, customerPhone: data.customerPhone,
      tableHeaders: ['<th style="width:50px">STT</th>', 'SKU', 'Sản phẩm', '<th style="width:80px">Số lượng</th>', '<th style="width:70px">ĐVT</th>', '<th style="width:150px">Ghi chú</th>'],
      itemRows, notesHTML, signatures: ['Người giao', 'Người nhận', 'Tài xế'], footerText: GEP_FOOTER,
    });
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Phiếu giao hàng - ${orderCode}</title><style>${getShippingInvoiceStyles()}</style></head><body>${body}</body></html>`;
  };

  const handlePrint = () => { const w = window.open('', '_blank'); if (w) { w.document.write(buildPrintHTML()); w.document.close(); w.addEventListener('load', () => setTimeout(() => w.print(), 400)); } };
  const handleDownload = async () => { setDownloadLoading(true); try { await invoiceService.downloadPDF(orderId, orderCode); } catch { alert('Lỗi tải PDF'); } finally { setDownloadLoading(false); } };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Phiếu giao hàng" size="lg"
      footer={<div className="flex flex-wrap gap-2 w-full">
        <Button variant="secondary" onClick={handlePrint} className="gap-1.5"><Printer className="w-4 h-4"/>In</Button>
        <Button onClick={handleDownload} disabled={downloadLoading} className="gap-1.5 bg-blue-600">
          {downloadLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}Tải PDF</Button>
        <div className="flex-1"/><Button variant="secondary" onClick={onClose}>Đóng</Button></div>}>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin"/></div>
      ) : data ? (
        <div id="shipping-invoice-content" className="space-y-4">
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4">
            <div><h3 className="text-xl font-black text-slate-900 tracking-tight">PHIẾU GIAO HÀNG</h3><p className="text-xs text-slate-400 font-mono mt-1">{data.invoiceNumber}</p></div>
            <div className="text-right space-y-1">
              <p className="text-xs text-slate-500"><span className="font-bold text-slate-400">Ngày:</span> {data.invoiceDate}</p>
              <p className="text-xs text-slate-500"><span className="font-bold text-slate-400">Mã đơn:</span> {orderCode}</p></div>
          </div>
          <div className="flex justify-between items-start gap-6">
            <div className="flex items-center pl-16 w-[55%]"><img src={GEP_LOGO} alt="GEP" className="w-full h-32 object-contain object-left" onError={(e:any)=>{e.target.style.display='none';}}/></div>
            <div className="w-[45%] bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Khách hàng</p>
              <p className="text-sm font-bold text-slate-900">{data.customerName}</p>
              <p className="text-xs text-slate-500 mt-1">{data.customerAddress}</p>
              <p className="text-xs text-slate-500 font-mono">{data.customerPhone}</p></div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-3 py-2.5 text-center w-10">STT</th><th className="px-3 py-2.5">SKU</th><th className="px-3 py-2.5">Sản phẩm</th>
                <th className="px-3 py-2.5 text-center w-20">Số lượng</th><th className="px-3 py-2.5 text-center w-16">ĐVT</th><th className="px-3 py-2.5">Ghi chú</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.length > 0 ? data.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-3 py-2 text-center text-xs text-slate-400">{item.no}</td>
                    <td className="px-3 py-2 text-xs font-mono text-emerald-700 font-bold">{(item as any).sku || '—'}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-800">{item.productName}</td>
                    <td className="px-3 py-2 text-center text-sm font-bold text-slate-900">{item.quantity}</td>
                    <td className="px-3 py-2 text-center text-xs text-slate-500">{item.unit}</td>
                    <td className="px-3 py-2 text-xs text-slate-400">{item.note || ''}</td></tr>
                )) : <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400 italic">Không có sản phẩm</td></tr>}
              </tbody></table></div>
          {data.notes && <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3"><p className="text-xs font-bold text-amber-600 uppercase mb-1">Ghi chú</p><p className="text-sm text-amber-800">{data.notes}</p></div>}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            {['NGƯỜI GIAO', 'NGƯỜI NHẬN', 'TÀI XẾ'].map(l => <div key={l} className="text-center space-y-12"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{l}</p><p className="text-[10px] text-slate-400 italic">Ký, ghi rõ họ tên</p></div>)}</div>
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">GEP Eco-Friendly Packaging · 275 Nguyễn Trãi, Thanh Xuân, Hà Nội · Tel: 08484847777</div>
        </div>
      ) : <div className="py-12 text-center text-sm text-slate-400 italic">Không tải được dữ liệu</div>}
    </Modal>
  );
};

export default ShippingInvoice;
