/**
 * DefectiveRollsTab — Shows defective (lỗi) and damaged (hỏng) rolls
 * with quality classification from production scan.
 */
import React, { useMemo, useState } from 'react';
import { AlertTriangle, Ban, PackageX, Search, ChevronRight, PackageCheck } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import { ProductRoll } from '../types';
import { formatDate } from '../../../utils/format';

interface DefectiveRollsTabProps {
  rolls: ProductRoll[];
  onRollClick: (roll: ProductRoll) => void;
}

/** Parse quality type from scan history action text */
function getQualityType(roll: ProductRoll): 'loi' | 'hong' | 'unknown' {
  const scanActions = roll.scanHistory || [];
  for (const scan of scanActions) {
    if (scan.action.includes('Hàng hỏng')) return 'hong';
    if (scan.action.includes('Hàng lỗi')) return 'loi';
  }
  return 'unknown';
}

const QUALITY_CONFIG = {
  loi: { label: 'Hàng lỗi', desc: 'Có lỗi nhỏ, có thể sửa chữa', icon: AlertTriangle, color: 'amber', badgeVariant: 'yellow' as const },
  hong: { label: 'Hàng hỏng', desc: 'Không sử dụng được', icon: Ban, color: 'red', badgeVariant: 'red' as const },
  unknown: { label: 'Lỗi/Hỏng', desc: 'Chưa phân loại chi tiết', icon: PackageX, color: 'gray', badgeVariant: 'gray' as const },
};

const DefectiveRollsTab: React.FC<DefectiveRollsTabProps> = ({ rolls, onRollClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [qualityFilter, setQualityFilter] = useState<'all' | 'loi' | 'hong'>('all');

  const defectiveRolls = useMemo(() =>
    rolls.filter(r => r.status === 'loi_hong').map(r => ({ ...r, qualityType: getQualityType(r) })),
  [rolls]);

  const filtered = defectiveRolls.filter(r => {
    const matchSearch = (r.code || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (r.qrCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchQuality = qualityFilter === 'all' || r.qualityType === qualityFilter;
    return matchSearch && matchQuality;
  });

  const counts = useMemo(() => ({
    total: defectiveRolls.length,
    loi: defectiveRolls.filter(r => r.qualityType === 'loi').length,
    hong: defectiveRolls.filter(r => r.qualityType === 'hong').length,
    unknown: defectiveRolls.filter(r => r.qualityType === 'unknown').length,
  }), [defectiveRolls]);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`p-4 border-l-4 border-slate-400 cursor-pointer transition-all hover:shadow-md ${qualityFilter === 'all' ? 'ring-2 ring-slate-400 shadow-md' : ''}`}
          onClick={() => setQualityFilter('all')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-xl"><PackageX className="w-5 h-5 text-slate-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng lỗi / hỏng</p>
              <p className="text-2xl font-black text-slate-900">{counts.total}</p>
            </div>
          </div>
        </Card>
        <Card className={`p-4 border-l-4 border-amber-500 cursor-pointer transition-all hover:shadow-md ${qualityFilter === 'loi' ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
          onClick={() => setQualityFilter(qualityFilter === 'loi' ? 'all' : 'loi')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase">Hàng lỗi</p>
              <p className="text-2xl font-black text-slate-900">{counts.loi}</p>
            </div>
          </div>
        </Card>
        <Card className={`p-4 border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-md ${qualityFilter === 'hong' ? 'ring-2 ring-red-400 shadow-md' : ''}`}
          onClick={() => setQualityFilter(qualityFilter === 'hong' ? 'all' : 'hong')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-xl"><Ban className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase">Hàng hỏng</p>
              <p className="text-2xl font-black text-slate-900">{counts.hong}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Tìm mã cuộn, sản phẩm lỗi/hỏng..." className="pl-10 h-10"
            value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-none shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Phân loại</th>
                <th className="px-6 py-4">Sản phẩm & Quy cách</th>
                <th className="px-6 py-4">Mã Cuộn / QR</th>
                <th className="px-6 py-4 text-center">Thông số</th>
                <th className="px-6 py-4">Ngày SX</th>
                <th className="px-6 py-4">Ghi nhận bởi</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                  {counts.total === 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <PackageCheck className="w-12 h-12 text-green-300" />
                      <p className="text-green-600 font-bold">Tuyệt vời! Không có hàng lỗi / hỏng</p>
                      <p className="text-xs text-slate-400">Tất cả cuộn sản xuất đều đạt chất lượng</p>
                    </div>
                  ) : 'Không tìm thấy dữ liệu phù hợp'}
                </td></tr>
              ) : filtered.map(roll => {
                const cfg = QUALITY_CONFIG[roll.qualityType];
                const Icon = cfg.icon;
                const scanEntry = roll.scanHistory?.find(s => s.action.includes('Phân loại'));
                return (
                  <tr key={roll.id} className="hover:bg-red-50/30 transition-colors group cursor-pointer" onClick={() => onRollClick(roll)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-${cfg.color}-50`}><Icon className={`w-4 h-4 text-${cfg.color}-600`} /></div>
                        <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{roll.productName}</p>
                      <p className="text-[11px] text-slate-400">{roll.specification}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <p className="text-slate-900 font-bold">{roll.code}</p>
                      <p className="text-slate-400">{roll.qrCode}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-[11px] font-mono">
                      <span className="text-slate-700">{roll.length}m</span>
                      <span className="text-slate-300 mx-1">×</span>
                      <span className="text-slate-400">{roll.weight}kg</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(roll.productionDate)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{scanEntry?.operator || roll.creator}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DefectiveRollsTab;
