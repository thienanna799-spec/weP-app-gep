import React from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface InvoiceTelegramSenderProps {
  telegramChatId: string;
  setTelegramChatId: (id: string) => void;
  handleSendTelegram: () => void;
  telegramLoading: boolean;
  telegramResult: 'success' | 'error' | null;
}

export const InvoiceTelegramSender: React.FC<InvoiceTelegramSenderProps> = ({
  telegramChatId,
  setTelegramChatId,
  handleSendTelegram,
  telegramLoading,
  telegramResult
}) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Send className="w-4 h-4 text-blue-600" />
      <h4 className="text-sm font-bold text-blue-900">Gửi qua Telegram</h4>
    </div>
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Chat ID (để trống = mặc định)"
        value={telegramChatId}
        onChange={(e) => setTelegramChatId(e.target.value)}
        className="flex-1 h-9 px-3 text-sm bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
      />
      <Button
        onClick={handleSendTelegram}
        disabled={telegramLoading}
        className="gap-1.5 bg-blue-600 h-9 px-4 shadow-md shadow-blue-100"
      >
        {telegramLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Gửi
      </Button>
    </div>
    {telegramResult === 'success' && (
      <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Đã gửi thành công qua Telegram!
      </div>
    )}
    {telegramResult === 'error' && (
      <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold">
        <AlertCircle className="w-3.5 h-3.5" />
        Gửi thất bại. Kiểm tra Bot Token và Chat ID.
      </div>
    )}
  </div>
);
