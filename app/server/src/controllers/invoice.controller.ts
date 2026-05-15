/**
 * Invoice Controller
 * ─────────────────────────────────────────────────────────
 * Handles invoice HTML preview, PDF generation, PDF download,
 * and Telegram auto-send.
 */

import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  renderInvoiceHTML,
  generateInvoicePDF,
  buildInvoiceData,
} from '../services/invoice.service.js';
import {
  sendInvoiceNotification,
  notifyStaff,
} from '../services/telegram.service.js';

/** Fetch order with items + resolve bank account for payment info */
async function getOrderWithPayment(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, customer: true },
  });
  if (!order) return null;

  // Attach bank account info if payment is bank_transfer
  let _bankAccount: any = null;
  if (order.paymentMethod === 'bank_transfer' && order.bankAccountId) {
    _bankAccount = await prisma.bankAccount.findUnique({ where: { id: order.bankAccountId } });
  } else if (order.paymentMethod === 'bank_transfer') {
    _bankAccount = await prisma.bankAccount.findFirst({ where: { isDefault: true, isActive: true } });
  }

  return { ...order, _bankAccount };
}

// ── GET /api/invoices/:orderId/preview ──────────────────────
// Returns rendered HTML invoice for in-browser preview
export const previewInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await getOrderWithPayment(req.params.orderId);
  if (!order) { sendError(res, 'Order not found', 404); return; }

  const invoiceData = buildInvoiceData(order, order.items || []);
  const html = renderInvoiceHTML(invoiceData);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ── GET /api/invoices/:orderId/pdf ──────────────────────────
// Generates and downloads PDF invoice
export const downloadInvoicePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await getOrderWithPayment(req.params.orderId);
  if (!order) { sendError(res, 'Order not found', 404); return; }

  const invoiceData = buildInvoiceData(order, order.items || []);

  try {
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Bien_ban_giao_hang_${order.code}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    // Puppeteer not available → return HTML with print instructions
    if (err.message?.includes('Puppeteer')) {
      const html = renderInvoiceHTML(invoiceData);
      const printHtml = html.replace(
        '</body>',
        `<script>
          window.onload = function() {
            if (confirm('Puppeteer không khả dụng. Mở trang in để tạo PDF?')) {
              window.print();
            }
          };
        </script></body>`
      );
      res.setHeader('Content-Type', 'text/html');
      res.send(printHtml);
      return;
    }
    throw err;
  }
});

// ── GET /api/invoices/:orderId/data ─────────────────────────
// Returns structured JSON invoice data for frontend rendering
export const getInvoiceData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await getOrderWithPayment(req.params.orderId);
  if (!order) { sendError(res, 'Order not found', 404); return; }

  const invoiceData = buildInvoiceData(order, order.items || []);
  sendSuccess(res, invoiceData);
});

// ── POST /api/invoices/:orderId/send-telegram ───────────────
// Generates PDF + sends via Telegram Bot
export const sendInvoiceViaTelegram = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chatId } = req.body as { chatId?: string };

  const order = await getOrderWithPayment(req.params.orderId);
  if (!order) { sendError(res, 'Order not found', 404); return; }

  // Determine the target chat ID
  const targetChatId = chatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;
  if (!targetChatId) {
    sendError(res, 'No Telegram chat ID provided. Set TELEGRAM_DEFAULT_CHAT_ID or pass chatId in body.', 400);
    return;
  }

  const invoiceData = buildInvoiceData(order, order.items || []);

  // Try to generate PDF; if Puppeteer unavailable, send text-only
  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generateInvoicePDF(invoiceData);
  } catch (err: any) {
    console.warn('[Invoice] PDF generation failed, sending text-only:', err.message);
  }

  const formatVND = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const sent = await sendInvoiceNotification(
    {
      chatId: targetChatId,
      orderCode: order.code,
      customerName: order.customerName,
      totalPrice: formatVND(invoiceData.totalPrice),
      deliveryStatus: order.status,
      driverName: undefined,
    },
    pdfBuffer
  );

  if (sent) {
    // Log the activity
    await prisma.userActivityLog.create({
      data: {
        userId: req.user!.uid,
        email: req.user!.email,
        action: 'Gửi hóa đơn qua Telegram',
        module: 'Hóa đơn',
        referenceId: order.id,
        description: `Gửi biên bản giao hàng ${order.code} qua Telegram tới ${targetChatId}`,
      },
    });

    sendSuccess(res, { sent: true, chatId: targetChatId }, 200, 'Invoice sent via Telegram');
  } else {
    sendError(res, 'Failed to send Telegram message. Check bot token and chat ID.', 500);
  }
});

// ── Auto-trigger: Call this when order status changes to 'dang_giao' ──

export async function autoSendInvoiceOnShipping(orderId: string, updatedBy: string): Promise<void> {
  try {
    const order = await getOrderWithPayment(orderId);
    if (!order) return;

    // Notify staff channel
    await notifyStaff(order.code, 'Đang giao hàng', updatedBy);

    // Use customer's Telegram chat ID if available, else fall back to default
    const customerChatId = order.customer?.telegramChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;
    if (!customerChatId) return;

    const invoiceData = buildInvoiceData(order, order.items || []);

    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateInvoicePDF(invoiceData);
    } catch {
      // PDF not available, send text only
    }

    const formatVND = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    await sendInvoiceNotification(
      {
        chatId: customerChatId,
        orderCode: order.code,
        customerName: order.customerName,
        totalPrice: formatVND(invoiceData.totalPrice),
        deliveryStatus: 'dang_giao',
      },
      pdfBuffer
    );

    console.log(`[Invoice] Auto-sent invoice for order ${order.code} via Telegram`);
  } catch (err) {
    console.error('[Invoice] Auto-send failed:', err);
  }
}

// ── Auto-trigger: Call this when order is APPROVED (da_duyet) ──

export async function autoSendInvoiceOnApproval(orderId: string, approvedBy: string): Promise<void> {
  try {
    const order = await getOrderWithPayment(orderId);
    if (!order) return;

    // Notify staff channel about approval
    await notifyStaff(order.code, 'Đã duyệt đơn hàng', approvedBy);

    // Send invoice to customer's Telegram or default channel
    const targetChatId = order.customer?.telegramChatId || process.env.TELEGRAM_DEFAULT_CHAT_ID;
    if (!targetChatId) {
      console.log(`[Invoice] No Telegram chatId for order ${order.code}, skipping auto-send`);
      return;
    }

    const invoiceData = buildInvoiceData(order, order.items || []);

    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateInvoicePDF(invoiceData);
    } catch {
      // PDF not available, send text only
    }

    const formatVND = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    await sendInvoiceNotification(
      {
        chatId: targetChatId,
        orderCode: order.code,
        customerName: order.customerName,
        totalPrice: formatVND(invoiceData.totalPrice),
        deliveryStatus: 'da_duyet',
        driverName: undefined,
      },
      pdfBuffer
    );

    console.log(`[Invoice] Auto-sent invoice on approval for order ${order.code} to Telegram (${targetChatId})`);
  } catch (err) {
    console.error('[Invoice] Auto-send on approval failed:', err);
  }
}

