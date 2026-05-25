import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ProductRoll } from '../types';

interface BatchQRPrintViewProps {
  rolls: ProductRoll[];
  productName: string;
  specification?: string;
  batchId: string;
}

const BatchQRPrintView: React.FC<BatchQRPrintViewProps> = ({ rolls, productName, specification, batchId }) => {

  const handlePrintAll = () => {
    const qrHTML = rolls.map((roll, idx) => `
      <div class="qr-item">
        <svg id="qr-${idx}"></svg>
        <div class="qr-code">${roll.qrCode}</div>
        <div class="qr-product">${roll.productName}</div>
        ${specification ? `<div class="qr-spec">${specification}</div>` : ''}
      </div>
    `).join('');

    // Build QR SVGs using qrcode.react approach in print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { alert('Vui lòng cho phép popup để in mã QR'); return; }

    // Render QR codes into the container
    const container = document.createElement('div');
    container.id = 'qr-render-container';
    container.style.display = 'none';
    document.body.appendChild(container);

    // Create temp QR SVGs
    const svgStrings: string[] = [];
    rolls.forEach((roll) => {
      const tempDiv = document.getElementById('qr-batch-grid');
      const svgEl = tempDiv?.querySelector(`[data-qr="${roll.qrCode}"] svg`);
      if (svgEl) {
        svgStrings.push(svgEl.outerHTML);
      }
    });

    document.body.removeChild(container);

    const items = rolls.map((roll, idx) => `
      <div class="qr-item">
        ${svgStrings[idx] || `<div class="qr-placeholder">${roll.qrCode}</div>`}
        <div class="qr-code">${roll.qrCode}</div>
        <div class="qr-product">${roll.productName}</div>
        ${specification ? `<div class="qr-spec">${specification}</div>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Codes — ${productName} — Lô ${batchId.slice(-6)}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 10mm; background: #fff; }
      h1 { font-size: 14px; text-align: center; margin-bottom: 4mm; color: #333; }
      .meta { font-size: 10px; text-align: center; color: #999; margin-bottom: 6mm; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; }
      .qr-item {
        border: 1px solid #ddd; border-radius: 3mm; padding: 3mm;
        display: flex; flex-direction: column; align-items: center;
        page-break-inside: avoid;
      }
      .qr-item svg { width: 35mm; height: 35mm; }
      .qr-code { font-family: monospace; font-size: 7px; font-weight: bold; margin-top: 1mm; word-break: break-all; text-align: center; line-height: 1.2; }
      .qr-product { font-size: 8px; font-weight: bold; color: #333; margin-top: 1mm; text-align: center; }
      .qr-spec { font-size: 7px; color: #666; text-align: center; }
      .qr-placeholder { width: 35mm; height: 35mm; display: flex; align-items: center; justify-content: center; font-size: 6px; color: #999; border: 1px dashed #ccc; word-break: break-all; text-align: center; padding: 2mm; }
      @media print {
        body { padding: 5mm; }
        .grid { gap: 3mm; }
      }
    </style></head><body>
      <h1>Mã QR — ${productName}</h1>
      <div class="meta">Lô: ${batchId.slice(-6).toUpperCase()} • Số lượng: ${rolls.length} • ${new Date().toLocaleDateString('vi-VN')}</div>
      <div class="grid">${items}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();},500);}<\/script>
    </body></html>`);
    printWindow.document.close();
  };

  if (!rolls.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-700">
          Mã QR ({rolls.length} mã)
        </h4>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrintAll} className="gap-2 text-xs">
            <Printer className="w-4 h-4" />
            In tất cả QR
          </Button>
        </div>
      </div>

      <div id="qr-batch-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
        {rolls.map(roll => (
          <div
            key={roll.id}
            data-qr={roll.qrCode}
            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
              roll.status === 'trong_kho'
                ? 'border-green-200 bg-green-50/50'
                : roll.status === 'loi_hong'
                ? 'border-red-200 bg-red-50/50'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <QRCodeSVG value={roll.qrCode} size={80} />
            <p className="mt-2 font-mono text-[9px] text-slate-600 text-center break-all leading-tight">
              {roll.qrCode}
            </p>
            <span className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
              roll.status === 'trong_kho'
                ? 'text-green-700 bg-green-100'
                : roll.status === 'loi_hong'
                ? 'text-red-700 bg-red-100'
                : 'text-amber-700 bg-amber-100'
            }`}>
              {roll.status === 'trong_kho' ? '✅ Đã nhập' : roll.status === 'loi_hong' ? '❌ Lỗi/Hỏng' : '⏳ Chờ scan'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchQRPrintView;
