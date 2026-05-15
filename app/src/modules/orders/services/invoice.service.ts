/**
 * Invoice Frontend Service
 * ─────────────────────────────────────────────────────────
 * Provides methods to interact with the invoice API endpoints.
 */

import api from '../../../services/api';

export interface InvoiceItem {
  no: number;
  productName: string;
  pcs: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  note?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryStatus: string;
  items: InvoiceItem[];
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  shippingFee: number;
  totalPrice: number;
  notes?: string;
  telegramChatId?: string;
}

export const invoiceService = {
  /**
   * Get structured invoice data for frontend rendering
   */
  getData: async (orderId: string): Promise<InvoiceData> => {
    return api.get<InvoiceData>(`/invoices/${orderId}/data`);
  },

  /**
   * Get the HTML preview URL (opens in new tab)
   */
  getPreviewUrl: (orderId: string): string => {
    const token = localStorage.getItem('auth_token');
    return `/api/invoices/${orderId}/preview?token=${token}`;
  },

  /**
   * Download PDF invoice
   */
  downloadPDF: async (orderId: string, orderCode: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`/api/invoices/${orderId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // If it returns HTML (fallback), open in new tab for print
      if (res.headers.get('content-type')?.includes('text/html')) {
        const html = await res.text();
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(html);
          w.document.close();
        }
        return;
      }
      throw new Error('Failed to download PDF');
    }

    // Download the PDF blob
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien_ban_giao_hang_${orderCode}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Send invoice via Telegram
   */
  sendViaTelegram: async (orderId: string, chatId?: string): Promise<{ sent: boolean; chatId: string }> => {
    return api.post<{ sent: boolean; chatId: string }>(
      `/invoices/${orderId}/send-telegram`,
      { chatId }
    );
  },

  /**
   * Print invoice in browser (opens HTML in new window and triggers print)
   */
  printInvoice: (orderId: string): void => {
    const url = invoiceService.getPreviewUrl(orderId);
    const w = window.open(url, '_blank');
    if (w) {
      w.addEventListener('load', () => {
        setTimeout(() => w.print(), 500);
      });
    }
  },
};
