import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { createRoll, scanRollToStock } from '../../../services/rollService';
import { getInitials } from '../../../utils/format';
import { UserProfile } from '../../../types/user.types';
import ScanToStockPanel from './ScanToStockPanel';

interface Props {
  profile: UserProfile;
  productionOrders: any[];
  refetch: () => void;
}

const InternalProductionTab: React.FC<Props> = ({ profile, productionOrders, refetch }) => {
  const { t } = useTranslation();
  const [selectedProdOrder, setSelectedProdOrder] = useState('');
  const [productName, setProductName] = useState('');
  const [specification, setSpecification] = useState('');
  const [rollLength, setRollLength] = useState<number>(0);
  const [rollWeight, setRollWeight] = useState<number>(0);
  const [producerName, setProducerName] = useState(profile.name);
  const [rollId, setRollId] = useState('');

  const printQR = () => {
    const qrSection = document.getElementById('qr-print-section');
    if (!qrSection) return;
    const svgEl = qrSection.querySelector('svg');
    if (!svgEl) return;
    const svgHTML = svgEl.outerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) { alert(t('production.allow_popup')); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>QR - ${rollId}</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:Arial,sans-serif;background:#fff}svg{width:250px;height:250px;margin:20px}.code{font-family:monospace;font-size:14px;font-weight:bold;margin-top:16px;word-break:break-all;text-align:center;padding:0 20px}.label{font-size:10px;color:#999;text-transform:uppercase;letter-spacing:2px;margin-top:4px}.info{font-size:12px;color:#333;margin-top:12px;text-align:center;line-height:1.6}</style></head><body>${svgHTML}<div class="code">${rollId}</div><div class="label">Mã định danh cuộn hàng</div><div class="info"><strong>${productName}</strong><br/>${specification}<br/>${rollLength}m × ${rollWeight}kg</div><script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>`);
    printWindow.document.close();
  };

  // Auto-print when new QR is created
  useEffect(() => { if (rollId) { const timer = setTimeout(() => printQR(), 800); return () => clearTimeout(timer); } }, [rollId]);

  // ── Auto-select first active LSX when page loads or data updates ──
  useEffect(() => {
    if (selectedProdOrder) return; // already selected, don't override
    const activeOrders = productionOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    if (activeOrders.length > 0) {
      const first = activeOrders[0];
      setSelectedProdOrder(first.id);
      setRollId('');
      setProductName(first.productName || first.specs || '');
      setSpecification(first.specs || '');
      setRollLength(first.rollLength || 0);
      setRollWeight(first.rollWeight || 0);
    }
  }, [productionOrders]);

  const handleCreateRoll = async () => {
    if (!productName || !specification) { alert(t('common.required')); return; }
    const now = new Date();
    const timeStr = format(now, 'ddMMyyHHmmss');
    const id = `ROLL-${timeStr}-${getInitials(producerName)}`;
    const rollData: any = { id, code: id, qrCode: id, productId: selectedProdOrder || `PROD-${timeStr}`, productName, specification, length: rollLength || 0, weight: rollWeight || 0, status: 'dang_san_xuat' };

    if (selectedProdOrder) rollData.productionOrderId = selectedProdOrder;
    try {
      await createRoll(id, rollData);
      setRollId(id);
      refetch(); // refresh counts
    } catch (err: any) { alert(t('common.error') + ': ' + (err.message || err)); }
  };

  const handleProdOrderChange = (orderId: string) => {
    setSelectedProdOrder(orderId); setRollId('');
    if (orderId) {
      const po = productionOrders.find(o => o.id === orderId);
      if (po) { setProductName(po.productName || po.specs || ''); setSpecification(po.specs || ''); setRollLength(po.rollLength || 0); setRollWeight(po.rollWeight || 0); }
    } else { setProductName(''); setSpecification(''); setRollLength(0); setRollWeight(0); }
  };

  const selectedPO = productionOrders.find(o => o.id === selectedProdOrder);

  // Use _goodRolls (excludes loi_hong) for progress — only good rolls count toward target
  const goodRolls = selectedPO?._goodRolls ?? 0;
  const defectRolls = selectedPO?._defectRolls ?? 0;
  const totalRolls = selectedPO?._count?.rolls ?? 0;
  const remaining = selectedPO ? Math.max(0, selectedPO.targetRolls - goodRolls) : 0;
  const percent = selectedPO && selectedPO.targetRolls > 0 ? Math.min(100, Math.round((goodRolls / selectedPO.targetRolls) * 100)) : 0;
  const isFull = remaining <= 0 && selectedPO != null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">{t('production.select_order')} <span className="text-red-500">*</span></label>
            <select className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-medium" value={selectedProdOrder} onChange={(e) => handleProdOrderChange(e.target.value)}>
              <option value="">-- {t('production.select_order')} --</option>
              {productionOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map(o => {
                const good = o._goodRolls ?? 0;
                const defect = o._defectRolls ?? 0;
                const r = Math.max(0, o.targetRolls - good);
                const statusLabels: Record<string, string> = { waiting_material: '⏳ Chờ NVL', ready: '✅ Sẵn sàng', producing: '🔄 Đang SX' };
                const defectLabel = defect > 0 ? ` (${defect} lỗi/hỏng)` : '';
                return <option key={o.id} value={o.id}>{o.code} — {o.specs} — OK: {good}/{o.targetRolls} cuộn{defectLabel} — {statusLabels[o.status] || o.status}</option>;
              })}
            </select>
          </div>

          {selectedPO && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div><p className="text-xs font-bold text-blue-500 uppercase tracking-wider">{t('nav.production_orders')}</p><p className="text-lg font-black text-slate-900">{selectedPO.code}</p></div>
                {selectedPO.deadline && <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase">{t('production_orders.deadline')}</p><p className="text-sm font-bold text-slate-700">{new Date(selectedPO.deadline).toLocaleDateString()}</p></div>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{t('production_orders.target_quantity')}</p>
                  <p className="text-xl font-black text-slate-900">{selectedPO.targetRolls}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-green-100">
                  <p className="text-[9px] font-bold text-green-500 uppercase">OK</p>
                  <p className="text-xl font-black text-green-600">{goodRolls}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-orange-100">
                  <p className="text-[9px] font-bold text-orange-500 uppercase">{t('production_orders.waiting_material')}</p>
                  <p className="text-xl font-black text-orange-600">{remaining}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-red-100">
                  <p className="text-[9px] font-bold text-red-400 uppercase">{t('production.quality_defective')}</p>
                  <p className={`text-xl font-black ${defectRolls > 0 ? 'text-red-500' : 'text-gray-300'}`}>{defectRolls}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-slate-500">{t('production.progress')}</span>
                  <span className={percent >= 100 ? 'text-green-600' : 'text-blue-600'}>{percent}%</span>
                </div>
                <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-slate-200">
                  <div className={`h-full transition-all duration-700 rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
              {defectRolls > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span><strong>{defectRolls} cuộn lỗi/hỏng</strong> — cần sản xuất thêm <strong>{remaining}</strong> cuộn OK để đủ mục tiêu</span>
                </div>
              )}
              {isFull && <p className="text-xs text-green-700 font-bold bg-green-100 px-3 py-1.5 rounded-lg text-center">✅ Đã đủ {selectedPO.targetRolls} cuộn hàng OK! Không cần tạo thêm.</p>}
              {selectedPO.notes && <p className="text-xs text-slate-600"><span className="font-bold">{t('common.note')}:</span> {selectedPO.notes}</p>}
            </div>
          )}

          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('production.product_name')}</label><input type="text" placeholder={t('production.select_order')} className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${selectedProdOrder ? 'bg-slate-50' : 'bg-white'}`} value={productName} onChange={(e) => !selectedProdOrder && setProductName(e.target.value)} readOnly={!!selectedProdOrder} /></div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('production.specification')}</label><input type="text" placeholder={t('production.select_order')} className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${selectedProdOrder ? 'bg-slate-50' : 'bg-white'}`} value={specification} onChange={(e) => !selectedProdOrder && setSpecification(e.target.value)} readOnly={!!selectedProdOrder} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('production.roll_length')}</label><input type="number" className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${selectedProdOrder ? 'bg-slate-50' : ''}`} value={rollLength || ''} onChange={(e) => !selectedProdOrder && setRollLength(Number(e.target.value) || 0)} readOnly={!!selectedProdOrder} /></div>
            <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('production.roll_weight')}</label><input type="number" className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${selectedProdOrder ? 'bg-slate-50' : ''}`} value={rollWeight || ''} onChange={(e) => !selectedProdOrder && setRollWeight(Number(e.target.value) || 0)} readOnly={!!selectedProdOrder} /></div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium text-gray-700">{t('production.producer')}</label><input type="text" className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none" value={producerName} onChange={(e) => setProducerName(e.target.value)} /></div>

          {/* Block new QR if current roll not yet scanned */}
          <Button
            onClick={handleCreateRoll}
            className={`w-full py-3 ${isFull || rollId ? 'opacity-50' : ''}`}
            disabled={!selectedProdOrder || !productName || !specification || isFull || !!rollId}
          >
            {isFull
              ? `🚫 ${t('production.target_reached')}`
              : rollId
                ? `⏳ ${t('production.wait_scan')}`
                : t('production.confirm_create')
            }
          </Button>

          {rollId && (
            <div id="qr-print-section" className="pt-8 border-t border-gray-100 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl w-full text-center">
                <p className="text-xs font-bold text-amber-700">⚠️ Hãy scan mã QR này bên panel nhập kho (bên phải) trước khi tạo cuộn mới</p>
              </div>
              <div className="p-4 bg-white border-4 border-gray-900 rounded-2xl shadow-xl"><QRCodeSVG value={rollId} size={200} /></div>
              <div className="text-center"><p className="font-mono font-bold text-lg text-gray-900 break-all">{rollId}</p><p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">{t('production.roll_id_label')}</p></div>
              <Button onClick={() => printQR()} variant="secondary" className="w-full bg-slate-900 text-white hover:bg-slate-800">{t('production.print_qr')}</Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <ScanToStockPanel onScan={async (code, quality) => {
          try {
            await scanRollToStock(code, quality);
            // If the scanned code matches the pending roll, clear it to allow new QR creation
            if (code === rollId) setRollId('');
            refetch();
            return true;
          } catch { return false; }
        }} />
      </Card>
    </div>
  );
};

export default InternalProductionTab;
