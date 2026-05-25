import React from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, FileImage, ShieldAlert } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { OcrAudit } from '../page';

interface OcrAuditReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAudit: OcrAudit;
  reviewNote: string;
  setReviewNote: (val: string) => void;
  onReview: (status: 'approved' | 'rejected' | 'escalated') => void;
}

const OcrAuditReviewModal: React.FC<OcrAuditReviewModalProps> = ({
  isOpen,
  onClose,
  selectedAudit,
  reviewNote,
  setReviewNote,
  onReview
}) => {
  if (!isOpen) return null;

  const diff = selectedAudit.differenceValue || 0;
  const isHighRisk = selectedAudit.riskLevel === 'high';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileImage className="w-6 h-6 text-indigo-600" />
              Chi tiết Phiếu kiểm toán OCR
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Mã tham chiếu: <span className="text-slate-700">{selectedAudit.referenceId}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            
            {/* Left: Image Viewer */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Hình ảnh chứng từ</h3>
              <div className="bg-slate-100 rounded-xl border border-slate-200 aspect-[3/4] flex items-center justify-center overflow-hidden relative group">
                {selectedAudit.imageUrl ? (
                  <img 
                    src={selectedAudit.imageUrl} 
                    alt="Chứng từ" 
                    className="w-full h-full object-contain cursor-zoom-in group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center text-slate-400 flex flex-col items-center">
                    <FileImage className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Không có hình ảnh</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Data & Actions */}
            <div className="flex flex-col gap-6">
              <Card className="p-5 border-blue-100 bg-blue-50/30">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Thông tin trích xuất</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tài xế</p>
                      <p className="font-semibold text-slate-800">{selectedAudit.driver?.name || selectedAudit.driverId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại chứng từ</p>
                      <Badge variant="blue">{selectedAudit.documentType === 'toll_receipt' ? 'Vé trạm thu phí' : selectedAudit.documentType}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tài xế khai báo</p>
                      <p className="font-bold text-slate-800 text-lg">{formatCurrency(selectedAudit.declaredValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AI Trích xuất</p>
                      <p className="font-bold text-indigo-600 text-lg">{selectedAudit.extractedValue ? formatCurrency(selectedAudit.extractedValue) : 'Không rõ'}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border flex items-center justify-between ${diff > 0 ? 'bg-red-50 border-red-200' : diff < 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-600">Chênh lệch</p>
                      <p className={`font-black text-xl ${diff !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                      </p>
                    </div>
                    {isHighRisk && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-100 px-3 py-1.5 rounded-full text-xs font-bold">
                        <ShieldAlert className="w-4 h-4" /> Có dấu hiệu gian lận
                      </div>
                    )}
                  </div>

                  {selectedAudit.fraudReason && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex gap-3 text-orange-800 text-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500" />
                      <p><strong>Lý do cảnh báo:</strong> {selectedAudit.fraudReason}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Review Actions */}
              {selectedAudit.reviewStatus === 'pending' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ghi chú duyệt (Tùy chọn)</label>
                    <textarea 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                      rows={3}
                      placeholder="Nhập ghi chú hoặc lý do từ chối..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="danger" 
                      className="w-full py-3 flex items-center justify-center gap-2"
                      onClick={() => onReview('rejected')}
                    >
                      <XCircle className="w-5 h-5" /> Từ chối (Sai phạm)
                    </Button>
                    <Button 
                      variant="success" 
                      className="w-full py-3 flex items-center justify-center gap-2"
                      onClick={() => onReview('approved')}
                    >
                      <CheckCircle className="w-5 h-5" /> Duyệt Hợp lệ
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-center">
                  <p className="text-slate-500 font-medium">Phiếu này đã được xử lý ({selectedAudit.reviewStatus}).</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OcrAuditReviewModal;
