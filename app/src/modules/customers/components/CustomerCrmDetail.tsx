/**
 * CustomerCrmDetail – Full 360° CRM Profile Modal
 */

import React, { useState, useEffect } from 'react';
import { Phone, MapPin, ShoppingCart, Package, TrendingUp, MessageSquare, Send, Clock, Plus, Check, Trash2, CalendarDays, Loader2, Building2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Badge from '../../../components/ui/Badge';
import { Customer, CrmProfile, FOLLOWUP_TYPE_ICONS } from '../types';
import { customerService } from '../services/customer.service';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDateTime } from '../../../utils/format';
import { CrmOrdersTab, CrmTimelineTab } from './CrmTabs';
import { useSocket } from '../../../hooks/useSocket';

interface Props { isOpen: boolean; onClose: () => void; customer: Customer | null; }

const CustomerCrmDetail: React.FC<Props> = ({ isOpen, onClose, customer }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'overview' | 'orders' | 'timeline'>('overview');
  const [crm, setCrm] = useState<CrmProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [fuTitle, setFuTitle] = useState('');
  const [fuDate, setFuDate] = useState('');
  const [fuType, setFuType] = useState('call');
  const [fuDesc, setFuDesc] = useState('');
  const [fuSaving, setFuSaving] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setTab('overview'); setLoading(true);
      customerService.getCrmProfile(customer.id).then(setCrm).catch(() => setCrm(null)).finally(() => setLoading(false));
    }
  }, [isOpen, customer]);

  const reload = () => { if (customer) customerService.getCrmProfile(customer.id).then(setCrm).catch(() => {}); };

  // ✅ Real-time: auto-refresh CRM data when order status changes while modal is open
  useSocket({
    onOrderUpdate: () => {
      if (isOpen && customer) {
        setTimeout(reload, 500);
      }
    },
    onShippingUpdate: () => {
      if (isOpen && customer) {
        setTimeout(reload, 500);
      }
    },
  });

  const handleAddNote = async () => {
    if (!noteText.trim() || !customer) return;
    setNoteSaving(true);
    try { await customerService.createNote(customer.id, noteText.trim()); setNoteText(''); reload(); }
    catch { alert('Lỗi thêm ghi chú'); } finally { setNoteSaving(false); }
  };
  const handleDeleteNote = async (noteId: string) => { if (!customer || !confirm('Xóa ghi chú này?')) return; await customerService.deleteNote(customer.id, noteId); reload(); };
  const handleAddFollowUp = async () => {
    if (!fuTitle.trim() || !fuDate || !customer) return;
    setFuSaving(true);
    try { await customerService.createFollowUp(customer.id, { title: fuTitle.trim(), description: fuDesc.trim() || undefined, dueDate: fuDate, type: fuType }); setShowFollowUpForm(false); setFuTitle(''); setFuDate(''); setFuType('call'); setFuDesc(''); reload(); }
    catch { alert('Lỗi tạo lịch nhắc'); } finally { setFuSaving(false); }
  };
  const handleCompleteFollowUp = async (fuId: string) => { if (!customer) return; await customerService.updateFollowUp(customer.id, fuId, { status: 'completed' } as any); reload(); };
  const handleDeleteFollowUp = async (fuId: string) => { if (!customer || !confirm('Xóa lịch nhắc này?')) return; await customerService.deleteFollowUp(customer.id, fuId); reload(); };

  if (!customer) return null;

  const headerGradient = customer.customerType === 'doanh_nghiep' ? 'from-indigo-900 via-blue-900 to-slate-900' : 'from-slate-800 via-slate-900 to-slate-950';
  const tabs = [{ key: 'overview', label: t('customers.crm_notes') }, { key: 'orders', label: t('customers.order_history') }, { key: 'timeline', label: 'Timeline' }] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('customers.customer_info') + ' (CRM)'} size="xl">
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div> : (
        <div className="space-y-0 max-h-[80vh] overflow-y-auto">
          {/* Hero Header */}
          <div className={`bg-gradient-to-r ${headerGradient} rounded-2xl p-6 text-white`}>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={customer.isActive ? 'green' : 'red'}>{customer.isActive ? 'Hoạt động' : 'Ngưng'}</Badge>
                  <span className="text-xs font-mono text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">{customer.code}</span>
                  {customer.customerType === 'doanh_nghiep' && <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded"><Building2 className="w-3 h-3 inline mr-1" />Doanh nghiệp</span>}
                </div>
                <h2 className="text-2xl font-black truncate">{customer.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {customer.phone}</span>
                  {customer.address && <span className="flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5" /> {customer.address}</span>}
                </div>
              </div>
              {crm && (
                <div className="flex gap-3 flex-shrink-0">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center min-w-[90px]"><ShoppingCart className="w-5 h-5 mx-auto mb-1 text-blue-300" /><p className="text-2xl font-black">{crm.stats.totalOrders}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Đơn hàng</p></div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center min-w-[90px]"><Package className="w-5 h-5 mx-auto mb-1 text-green-300" /><p className="text-2xl font-black">{crm.stats.totalQuantity.toLocaleString()}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Giao dịch</p></div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center min-w-[110px]"><TrendingUp className="w-5 h-5 mx-auto mb-1 text-red-300" /><p className="text-xl font-black text-red-200">{formatCurrency(crm.stats.totalRevenue)}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Tổng chi tiêu</p></div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 mt-4 border-b border-slate-200">
            {tabs.map(t => (<button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors ${tab === t.key ? 'bg-white text-slate-900 border border-slate-200 border-b-white -mb-px' : 'text-slate-400 hover:text-slate-600'}`}>{t.label}</button>))}
          </div>

          <div className="pt-4">
            {tab === 'overview' && crm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-yellow-500" /> Ghi chú nội bộ</h3>
                  <div className="flex gap-2 mb-4">
                    <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Ghi chú thêm..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500/20 outline-none" rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleAddNote(); } }} />
                    <button onClick={handleAddNote} disabled={noteSaving || !noteText.trim()} className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors self-end">{noteSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {crm.notes.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-4">Chưa có ghi chú nào.</p> : crm.notes.map(note => (
                      <div key={note.id} className="group bg-yellow-50 rounded-lg p-3 relative">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center justify-between mt-2"><span className="text-[10px] text-slate-400">{note.createdByName} · {formatDateTime(note.createdAt)}</span><button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 className="w-3 h-3" /></button></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-ups */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Lịch Chăm sóc</h3>
                    <button onClick={() => setShowFollowUpForm(!showFollowUpForm)} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Thêm lịch</button>
                  </div>
                  {showFollowUpForm && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3 space-y-2">
                      <input value={fuTitle} onChange={(e) => setFuTitle(e.target.value)} placeholder="VD: Gọi báo giá lại" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <div className="flex gap-2">
                        <input type="datetime-local" value={fuDate} onChange={(e) => setFuDate(e.target.value)} className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none" />
                        <select value={fuType} onChange={(e) => setFuType(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-sm"><option value="call">📞 Gọi điện</option><option value="email">✉️ Email</option><option value="visit">🏢 Đến thăm</option><option value="quote">📄 Báo giá</option><option value="other">📋 Khác</option></select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowFollowUpForm(false)} className="text-xs text-slate-500 px-3 py-1.5">Hủy</button>
                        <button onClick={handleAddFollowUp} disabled={fuSaving || !fuTitle.trim() || !fuDate} className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-40">{fuSaving ? 'Đang lưu...' : 'Tạo'}</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {crm.followUps.length === 0 ? <p className="text-xs text-slate-400 italic text-center py-4">Chưa có lịch nhắc nào.</p> : crm.followUps.map(fu => {
                      const isOverdue = fu.isOverdue || (fu.status === 'pending' && new Date(fu.dueDate) < new Date());
                      const isCompleted = fu.status === 'completed';
                      return (
                        <div key={fu.id} className={`group rounded-lg p-3 border transition-colors ${isOverdue ? 'border-red-200 bg-red-50' : isCompleted ? 'border-green-200 bg-green-50 opacity-60' : 'border-slate-200 bg-slate-50'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{FOLLOWUP_TYPE_ICONS[fu.type] || '📋'}</span>
                                <span className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{fu.title}</span>
                                {isOverdue && !isCompleted && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">QUÁ HẠN</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <CalendarDays className="w-3 h-3" /><span className={isOverdue ? 'text-red-500 font-bold' : ''}>{formatDateTime(fu.dueDate)}</span><span>· {fu.createdByName}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!isCompleted && <button onClick={() => handleCompleteFollowUp(fu.id)} className="p-1 text-green-500 hover:bg-green-100 rounded" title="Hoàn thành"><Check className="w-3.5 h-3.5" /></button>}
                              <button onClick={() => handleDeleteFollowUp(fu.id)} className="p-1 text-red-400 hover:bg-red-100 rounded" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {tab === 'orders' && crm && <CrmOrdersTab crm={crm} />}
            {tab === 'timeline' && crm && <CrmTimelineTab crm={crm} />}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CustomerCrmDetail;
