import React, { useState, useEffect } from 'react';
import { ScanSearch, Search, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import OcrAuditReviewModal from './components/OcrAuditReviewModal';

export interface OcrAudit {
  id: string;
  driverId: string;
  referenceId: string;
  documentType: string;
  imageUrl: string;
  declaredValue: number;
  extractedValue: number | null;
  differenceValue: number | null;
  rawOcrText: string | null;
  confidenceScore: number | null;
  riskLevel: 'low' | 'medium' | 'high' | null;
  fraudReason: string | null;
  pipelineStatus: string;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'escalated';
  createdAt: string;
  driver?: { name: string; code: string };
}

const OcrAuditPage: React.FC = () => {
  const { t } = useTranslation();
  const [audits, setAudits] = useState<OcrAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedAudit, setSelectedAudit] = useState<OcrAudit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: OcrAudit[] }>(`/ocr-audit?status=${statusFilter}&risk=${riskFilter}&limit=50`);
      setAudits(res.data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAudits();
  }, [statusFilter, riskFilter]);

  const handleReview = async (status: 'approved' | 'rejected' | 'escalated') => {
    if (!selectedAudit) return;
    try {
      await api.patch(`/ocr-audit/${selectedAudit.id}/review`, { status, note: reviewNote });
      setIsModalOpen(false);
      setReviewNote('');
      fetchAudits();
    } catch (error) {
      alert('Lỗi duyệt hóa đơn');
    }
  };

  const getRiskBadge = (risk: string | null) => {
    if (risk === 'high') return <Badge variant="danger">Cao</Badge>;
    if (risk === 'medium') return <Badge variant="warning">Trung bình</Badge>;
    if (risk === 'low') return <Badge variant="success">Thấp</Badge>;
    return <Badge variant="gray">Chưa rõ</Badge>;
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">OCR Audit Dashboard</h2>
        <p className="text-slate-500 text-sm font-medium">Kiểm toán hóa đơn và công tơ mét bằng AI</p>
      </div>

      <Card className="p-4 flex gap-4 bg-slate-50/50">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trạng thái</label>
          <select className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt (Khớp)</option>
            <option value="rejected">Từ chối (Gian lận)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mức độ rủi ro</label>
          <select className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="high">Rủi ro Cao</option>
            <option value="medium">Cảnh báo</option>
            <option value="low">An toàn</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Tài xế</th>
                <th className="px-6 py-4">Loại chứng từ</th>
                <th className="px-6 py-4">Khai báo</th>
                <th className="px-6 py-4">OCR Đọc được</th>
                <th className="px-6 py-4">Độ lệch</th>
                <th className="px-6 py-4">Rủi ro</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Đang tải...</td></tr>
              ) : audits.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-medium">Không có dữ liệu kiểm toán</td></tr>
              ) : audits.map(audit => (
                <tr key={audit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{audit.driver?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{audit.driver?.code}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                      {audit.documentType === 'fuel_receipt' ? 'Hóa đơn xăng' : audit.documentType === 'odometer' ? 'Đồng hồ KM' : audit.documentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-700">{formatCurrency(audit.declaredValue)}</td>
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">
                    {audit.extractedValue !== null ? formatCurrency(audit.extractedValue) : <span className="text-slate-300">Không rõ</span>}
                  </td>
                  <td className="px-6 py-4">
                    {audit.differenceValue !== null && Math.abs(audit.differenceValue) > 0 ? (
                      <span className="text-red-500 font-bold font-mono">+{formatCurrency(Math.abs(audit.differenceValue))}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {getRiskBadge(audit.riskLevel)}
                      {audit.fraudReason && <span className="text-[10px] text-red-500 font-medium">{audit.fraudReason}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{formatDateTime(audit.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="secondary" 
                      className="px-3 py-1.5 h-auto text-xs gap-1.5"
                      onClick={() => { setSelectedAudit(audit); setIsModalOpen(true); }}
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedAudit && (
        <OcrAuditReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedAudit={selectedAudit}
          reviewNote={reviewNote}
          setReviewNote={setReviewNote}
          onReview={handleReview}
        />
      )}
    </div>
  );
};

export default OcrAuditPage;
                                                        import React from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface MaterialFilterBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedGroup: string;
  setSelectedGroup: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  MATERIAL_GROUPS: string[];
}

const MaterialFilterBar: React.FC<MaterialFilterBarProps> = ({
  searchTerm, setSearchTerm,
  selectedGroup, setSelectedGroup,
  selectedStatus, setSelectedStatus,
  MATERIAL_GROUPS
}) => {
  const { t } = useTranslation();

  return (
    <Card className="p-4 bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder={t('materials.search_placeholder')} 
            className="pl-10" 
            value={searchTerm} 
            onChange={(e: any) => setSearchTerm(e.target.value)} 
          />
        </div>
        <select 
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm" 
          value={selectedGroup} 
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="All">{t('common.all_groups')}</option>
          {MATERIAL_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select 
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm" 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All">{t('common.all_statuses')}</option>
          <option value="còn hàng">{t('materials.in_stock')}</option>
          <option value="sắp hết">{t('materials.low_stock')}</option>
          <option value="hết hàng">{t('materials.out_of_stock')}</option>
          <option value="ngừng sử dụng">{t('materials.discontinued')}</option>
        </select>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 gap-2"><Filter className="w-4 h-4" /><span>{t('common.advanced')}</span></Button>
          <Button variant="secondary" className="p-2"><Download className="w-4 h-4" /></Button>
        </div>
      </div>
    </Card>
  );
};

export default MaterialFilterBar;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      