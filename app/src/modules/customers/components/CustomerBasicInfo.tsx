import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Input from '../../../components/ui/Input';
import { Customer, BankAccount } from '../types';
import { PROVINCES } from '../constants';

interface Props {
  formData: Partial<Customer>;
  setField: (key: string, value: any) => void;
  phoneWarning: string;
  bankAccounts: BankAccount[];
}

const sel = "w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm";

const CustomerBasicInfo: React.FC<Props> = ({ formData, setField, phoneWarning, bankAccounts }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Left: Customer Info */}
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Thông tin khách hàng</p>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[10px] text-slate-500 font-bold">Mã KH (Tự động)</label>
            <Input value={formData.code||''} readOnly disabled className="bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" placeholder="Tự động tăng..."/></div>
          <div><label className="text-[10px] text-slate-500 font-bold">Loại KH</label>
            <select value={formData.customerType||'ca_nhan'} onChange={e=>setField('customerType',e.target.value)} className={sel}>
              <option value="ca_nhan">Cá nhân</option><option value="doanh_nghiep">Doanh nghiệp</option></select></div>
          <div><label className="text-[10px] text-slate-500 font-bold">Tên KH *</label>
            <Input value={formData.name||''} onChange={(e:any)=>setField('name',e.target.value)} placeholder="Nguyễn Văn A"/></div>
          <div><label className="text-[10px] text-slate-500 font-bold">SĐT *</label>
            <Input value={formData.phone||''} onChange={(e:any)=>setField('phone',e.target.value)} placeholder="0901..."/>
            {phoneWarning&&<p className="text-[9px] text-amber-600 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/>{phoneWarning}</p>}</div>
          <div className="col-span-2"><label className="text-[10px] text-slate-500 font-bold">Email</label>
            <Input type="email" value={formData.email||''} onChange={(e:any)=>setField('email',e.target.value)} placeholder="email@..."/></div>
          <div className="col-span-2"><label className="text-[10px] text-slate-500 font-bold">Địa chỉ *</label>
            <Input value={formData.address||''} onChange={(e:any)=>setField('address',e.target.value)} placeholder="123 Đường..."/></div>
          <div><label className="text-[10px] text-slate-500 font-bold">Tỉnh / Thành</label>
            <select value={formData.province||''} onChange={e=>setField('province',e.target.value)} className={sel}>
              <option value="">-- Chọn --</option>{PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="text-[10px] text-slate-500 font-bold">Quận / Huyện</label>
            <Input value={formData.district||''} onChange={(e:any)=>setField('district',e.target.value)} placeholder="Quận 9"/></div>
        </div>
        {formData.customerType==='doanh_nghiep'&&(
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200">
            <div><label className="text-[10px] text-slate-500 font-bold">Công ty</label><Input value={formData.company||''} onChange={(e:any)=>setField('company',e.target.value)}/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">MST</label><Input value={formData.taxCode||''} onChange={(e:any)=>setField('taxCode',e.target.value)}/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Liên hệ</label><Input value={formData.contactPerson||''} onChange={(e:any)=>setField('contactPerson',e.target.value)}/></div>
          </div>
        )}
      </div>

      {/* Right: Config + Payment + CRM */}
      <div className="space-y-3">
        {/* Payment */}
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Thanh toán & CRM</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-slate-500 font-bold">Trạng thái</label>
              <select value={formData.operationalStatus||'active'} onChange={e=>setField('operationalStatus',e.target.value)} className={sel}>
                <option value="active">🟢 Đang hoạt động</option>
                <option value="inactive">🟡 Tạm dừng</option>
                <option value="stopped">🔴 Đã ngừng</option>
              </select>
            </div>
            <div><label className="text-[10px] text-slate-500 font-bold">Thanh toán</label>
              <select value={formData.preferredPayment||'cod'} onChange={e=>setField('preferredPayment',e.target.value)} className={sel}>
                <option value="cod">COD</option><option value="bank_transfer">CK</option><option value="credit">Công nợ</option></select></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Telegram</label>
              <Input value={formData.telegramChatId||''} onChange={(e:any)=>setField('telegramChatId',e.target.value)} placeholder="Chat ID"/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Ghi chú</label>
              <Input value={formData.notes||''} onChange={(e:any)=>setField('notes',e.target.value)} placeholder="Ghi chú..."/></div>
          </div>
          {/* Credit limit fields */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
            <div><label className="text-[10px] text-slate-500 font-bold">Hạn mức tín dụng (VND)</label>
              <Input type="number" value={formData.creditLimit ?? 0} onChange={(e:any)=>setField('creditLimit',Number(e.target.value))} placeholder="0 = Không giới hạn"/>
              <p className="text-[9px] text-slate-400 mt-0.5">0 = Không giới hạn</p></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Số ngày thanh toán</label>
              <Input type="number" value={formData.creditDays ?? 30} onChange={(e:any)=>setField('creditDays',Number(e.target.value))} placeholder="30"/>
              <p className="text-[9px] text-slate-400 mt-0.5">Quá hạn sẽ nhắc nợ</p></div>
          </div>
          {formData.preferredPayment==='bank_transfer'&&(
            <div className="mt-2 pt-2 border-t border-slate-200">
              {bankAccounts.length>0&&(<div className="flex flex-wrap gap-1.5 mb-2">
                {bankAccounts.map(ba=>(<button key={ba.id} type="button" onClick={()=>{setField('bankName',ba.bankName);setField('bankAccountNumber',ba.accountNumber);setField('bankAccountHolder',ba.accountHolder);}}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${formData.bankName===ba.bankName&&formData.bankAccountNumber===ba.accountNumber?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-700 border-slate-200 hover:border-blue-400'}`}>
                  🏦 {ba.bankName} · {ba.accountNumber}{ba.isDefault&&<span className="ml-1 text-[9px] opacity-75">(MĐ)</span>}</button>))}</div>)}
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-[10px] text-slate-500 font-bold">Ngân hàng</label><Input value={formData.bankName||''} onChange={(e:any)=>setField('bankName',e.target.value)}/></div>
                <div><label className="text-[10px] text-slate-500 font-bold">Số TK</label><Input value={formData.bankAccountNumber||''} onChange={(e:any)=>setField('bankAccountNumber',e.target.value)}/></div>
                <div><label className="text-[10px] text-slate-500 font-bold">Chủ TK</label><Input value={formData.bankAccountHolder||''} onChange={(e:any)=>setField('bankAccountHolder',e.target.value)}/></div>
              </div>
            </div>)}
        </div>

        {/* CRM compact */}
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Thông thư bổ sung</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-slate-500 font-bold">Người nhận</label>
              <Input value={formData.recipientName||''} onChange={(e:any)=>setField('recipientName',e.target.value)} placeholder="Tên người nhận"/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Nhóm</label>
              <Input value={formData.groupName||''} onChange={(e:any)=>setField('groupName',e.target.value)} placeholder="Đại lý cấp 1..."/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Link nhóm chat</label>
              <Input value={formData.groupChatLink||''} onChange={(e:any)=>setField('groupChatLink',e.target.value)} placeholder="https://zalo.me/g/..."/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Google Maps</label>
              <Input value={formData.googleMapsLink||''} onChange={(e:any)=>setField('googleMapsLink',e.target.value)} placeholder="https://maps.google.com/..."/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Sản phẩm</label>
              <Input value={formData.product||''} onChange={(e:any)=>setField('product',e.target.value)} placeholder="Băng dính, Màng co..."/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">GIP Code</label>
              <Input value={formData.gipCode||''} onChange={(e:any)=>setField('gipCode',e.target.value)} placeholder="GIP-001"/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Boss</label>
              <Input value={formData.boss||''} onChange={(e:any)=>setField('boss',e.target.value)} placeholder="Phụ trách"/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Tag</label>
              <Input value={formData.tag||''} onChange={(e:any)=>setField('tag',e.target.value)} placeholder="VIP, Tiềm năng..."/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Nền tảng</label>
              <Input value={formData.operatingPlatform||''} onChange={(e:any)=>setField('operatingPlatform',e.target.value)} placeholder="Shopee, Lazada..."/></div>
            <div><label className="text-[10px] text-slate-500 font-bold">Đặc điểm KH</label>
              <Input value={formData.customerCharacteristics||''} onChange={(e:any)=>setField('customerCharacteristics',e.target.value)} placeholder="Mô tả..."/></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerBasicInfo;
