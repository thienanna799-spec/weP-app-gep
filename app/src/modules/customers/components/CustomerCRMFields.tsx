/**
 * CustomerCRMFields — CRM-specific form fields for customer form
 */

import React from 'react';
import Input from '../../../components/ui/Input';
import { Customer, PLATFORM_OPTIONS } from '../types';

interface Props {
  formData: Partial<Customer>;
  setField: (key: string, value: any) => void;
}

const CustomerCRMFields: React.FC<Props> = ({ formData, setField }) => (
  <>
    <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin CRM</p>
    </div>

    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">Người nhận (Recipient)</label>
      <Input value={formData.recipientName || ''} onChange={(e: any) => setField('recipientName', e.target.value)} placeholder="Tên người nhận hàng" />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">Nhóm (Group)</label>
      <Input value={formData.groupName || ''} onChange={(e: any) => setField('groupName', e.target.value)} placeholder="Đại lý cấp 1, Khách lẻ..." />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">🔗 Link nhóm chat</label>
      <Input value={formData.groupChatLink || ''} onChange={(e: any) => setField('groupChatLink', e.target.value)} placeholder="https://zalo.me/g/... hoặc https://t.me/..." />
      <p className="text-[10px] text-slate-400 mt-1">Link nhóm Zalo / Messenger / Telegram (click tên KH để mở)</p>
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">📍 Google Maps Link</label>
      <Input value={formData.googleMapsLink || ''} onChange={(e: any) => setField('googleMapsLink', e.target.value)} placeholder="https://maps.google.com/..." />
      <p className="text-[10px] text-slate-400 mt-1">Link GG Maps chính xác — tài xế click trên APK để mở điều hướng</p>
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">Nền tảng (Platform)</label>
      <select value={formData.operatingPlatform || ''} onChange={(e) => setField('operatingPlatform', e.target.value)}
        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <option value="">-- Chọn --</option>
        {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">Trạng thái hoạt động</label>
      <select value={formData.operationalStatus || 'active'} onChange={(e) => setField('operationalStatus', e.target.value)}
        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <option value="active">🟢 Hoạt động</option>
        <option value="inactive">🟡 Tạm dừng</option>
        <option value="stopped">🔴 Đã ngừng</option>
      </select>
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">Sản phẩm chính</label>
      <Input value={formData.product || ''} onChange={(e: any) => setField('product', e.target.value)} placeholder="Băng dính, Màng co..." />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">GIP Code</label>
      <Input value={formData.gipCode || ''} onChange={(e: any) => setField('gipCode', e.target.value)} placeholder="GIP-001" />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">Boss (Phụ trách)</label>
      <Input value={formData.boss || ''} onChange={(e: any) => setField('boss', e.target.value)} placeholder="Tên người phụ trách" />
    </div>
    <div>
      <label className="text-xs font-bold text-slate-500 mb-1 block">Tag</label>
      <Input value={formData.tag || ''} onChange={(e: any) => setField('tag', e.target.value)} placeholder="VIP, Tiềm năng..." />
    </div>
    <div className="md:col-span-2">
      <label className="text-xs font-bold text-slate-500 mb-1 block">Đặc điểm KH</label>
      <textarea value={formData.customerCharacteristics || ''} onChange={(e) => setField('customerCharacteristics', e.target.value)} rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Mô tả đặc điểm khách hàng..." />
    </div>
  </>
);

export default CustomerCRMFields;
