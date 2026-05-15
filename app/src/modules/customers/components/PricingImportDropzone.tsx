import React, { useRef, useState, useCallback } from 'react';
import { DollarSign, Download } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface PricingImportDropzoneProps {
  onProcessFile: (file: File) => void;
  onDownloadTemplate: () => void;
}

export default function PricingImportDropzone({ onProcessFile, onDownloadTemplate }: PricingImportDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onProcessFile(file);
  }, [onProcessFile]);

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
        <div>
          <p className="text-sm font-bold text-amber-900">📊 Template bảng giá theo KH</p>
          <p className="text-xs text-amber-600 mt-0.5">Gồm: MÃ KH, TÊN KH, SKU, GIÁ BÁN</p>
        </div>
        <Button variant="secondary" onClick={onDownloadTemplate} className="gap-2 text-amber-700 border-amber-200 hover:bg-amber-100">
          <Download className="w-4 h-4" /> Tải template
        </Button>
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
          ${dragOver ? 'border-amber-500 bg-amber-50/50 scale-[1.01]' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <DollarSign className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-amber-500' : 'text-slate-300'}`} />
        <p className="font-bold text-slate-700">Kéo thả hoặc chọn file Excel bảng giá</p>
        <p className="text-xs text-slate-400 mt-1">.xlsx, .xls</p>
        <input 
          ref={inputRef} 
          type="file" 
          accept=".xlsx,.xls,.csv" 
          className="hidden" 
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onProcessFile(f); }} 
        />
      </div>

      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700 space-y-1">
        <p className="font-bold">⚠️ Lưu ý quan trọng:</p>
        <ul className="list-disc ml-4 space-y-0.5">
          <li>Chỉ cập nhật giá bán — <b>KHÔNG</b> tạo khách hàng mới</li>
          <li>MÃ KH + TÊN KH phải khớp chính xác với DB</li>
          <li>Nếu SKU đã có giá → cập nhật giá mới</li>
          <li>Nếu SKU chưa có → thêm mới vào bảng giá</li>
        </ul>
      </div>
    </>
  );
}
