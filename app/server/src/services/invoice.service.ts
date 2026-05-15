/**
 * Invoice Service
 * ─────────────────────────────────────────────────────────
 * Renders the HTML invoice template with dynamic order data
 * and provides Puppeteer-based PDF generation.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Types ──────────────────────────────────────────────────

export interface InvoiceItem {
  no: number;
  productName: string;
  sku: string;
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
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  // Payment
  paymentMethod?: string;
  paymentMethodLabel?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

// ── Constants ──────────────────────────────────────────────

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'invoice.html');

// Load logo from local file as base64 (pre-downloaded, 102KB)
const LOGO_PATH = path.join(path.dirname(TEMPLATE_PATH), 'logo.png');
let COMPANY_LOGO: string = '';
try {
  const buf = fs.readFileSync(LOGO_PATH);
  COMPANY_LOGO = `data:image/png;base64,${buf.toString('base64')}`;
  console.log(`[Invoice] Logo loaded: ${Math.round(buf.length / 1024)}KB`);
} catch {
  console.warn('[Invoice] logo.png not found, PDF will have no logo');
}

const COMPANY_DEFAULTS = {
  companyLogo: COMPANY_LOGO,
  companyAddress: '123 Street, District 9, HCMC',
  companyPhone: '0901 234 567',
};

const STATUS_CLASS_MAP: Record<string, string> = {
  'dang_giao': 'shipping',
  'giao_thanh_cong': 'delivered',
  'cho_xuat_kho': 'pending',
  'dang_chuan_bi': 'pending',
  'da_xuat_kho': 'shipping',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  'dang_giao': 'Dang giao',
  'giao_thanh_cong': 'Da giao',
  'cho_xuat_kho': 'Cho xuat kho',
  'dang_chuan_bi': 'Dang chuan bi',
  'da_xuat_kho': 'Da xuat kho',
};

// ── Formatter ──────────────────────────────────────────────

function formatVND(amount: number): string {
  return '\u20B1' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Template Renderer ──────────────────────────────────────

/**
 * Reads the HTML template and replaces {{placeholders}} with real data.
 */
export function renderInvoiceHTML(data: InvoiceData): string {
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Build product rows
  const rows = data.items.map(item => `
    <tr>
      <td>${item.no}</td>
      <td class="product-name">${item.sku || item.productName}</td>
      <td>${item.pcs}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${formatVND(item.unitPrice)}</td>
      <td>${formatVND(item.amount)}</td>
      <td>${item.note || ''}</td>
    </tr>
  `).join('');

  const emptyRows = '';

  const statusClass = STATUS_CLASS_MAP[data.deliveryStatus] || 'pending';
  const statusLabel = STATUS_LABEL_MAP[data.deliveryStatus] || data.deliveryStatus;

  // Handle conditional notes section
  if (data.notes) {
    template = template
      .replace('{{#notes}}', '')
      .replace('{{/notes}}', '')
      .replace('{{notes}}', data.notes);
  } else {
    // Remove the entire notes section
    template = template.replace(/\{\{#notes\}\}[\s\S]*?\{\{\/notes\}\}/g, '');
  }

  // Handle conditional payment info section
  if (data.paymentMethod) {
    template = template
      .replace('{{#paymentInfo}}', '').replace('{{/paymentInfo}}', '')
      .replaceAll('{{paymentMethodLabel}}', data.paymentMethodLabel || data.paymentMethod);
    if (data.bankName) {
      template = template.replace('{{#bankName}}', '').replace('{{/bankName}}', '')
        .replaceAll('{{bankName}}', data.bankName);
    } else {
      template = template.replace(/\{\{#bankName\}\}[\s\S]*?\{\{\/bankName\}\}/g, '');
    }
    if (data.bankAccountNumber) {
      template = template.replace('{{#bankAccountNumber}}', '').replace('{{/bankAccountNumber}}', '')
        .replaceAll('{{bankAccountNumber}}', data.bankAccountNumber)
        .replaceAll('{{bankAccountHolder}}', data.bankAccountHolder || '');
    } else {
      template = template.replace(/\{\{#bankAccountNumber\}\}[\s\S]*?\{\{\/bankAccountNumber\}\}/g, '');
    }
  } else {
    template = template.replace(/\{\{#paymentInfo\}\}[\s\S]*?\{\{\/paymentInfo\}\}/g, '');
  }

  // Replace all placeholders
  const replacements: Record<string, string> = {
    '{{invoiceNumber}}': data.invoiceNumber,
    '{{invoiceDate}}': data.invoiceDate,
    '{{customerName}}': data.customerName,
    '{{customerAddress}}': data.customerAddress,
    '{{customerPhone}}': data.customerPhone,
    '{{deliveryStatus}}': statusLabel,
    '{{deliveryStatusClass}}': statusClass,
    '{{orderItemsRows}}': rows + emptyRows,
    '{{subtotal}}': formatVND(data.subtotal),
    '{{vatPercent}}': String(data.vatPercent),
    '{{vatAmount}}': formatVND(data.vatAmount),
    '{{shippingFee}}': formatVND(data.shippingFee),
    '{{totalPrice}}': formatVND(data.totalPrice),
    '{{companyLogo}}': data.companyLogo || COMPANY_DEFAULTS.companyLogo,
    '{{companyAddress}}': data.companyAddress || COMPANY_DEFAULTS.companyAddress,
    '{{companyPhone}}': data.companyPhone || COMPANY_DEFAULTS.companyPhone,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replaceAll(placeholder, value);
  }

  return template;
}

// ── PDF Generation (via Puppeteer) ─────────────────────────

/**
 * Generates a PDF buffer from the rendered HTML.
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = renderInvoiceHTML(data);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 10000,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      timeout: 30000,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ── Build Invoice Data from DB Order ───────────────────────

/**
 * Maps a Prisma Order (with items) to InvoiceData.
 */
export function buildInvoiceData(order: any, items: any[]): InvoiceData {
  const invoiceItems: InvoiceItem[] = items.map((item, idx) => ({
    no: idx + 1,
    productName: item.productName || 'Product',
    sku: item.sku || '',
    pcs: item.pcs || 1,
    quantity: item.quantity || 0,
    unit: item.unit || 'cuon',
    unitPrice: item.unitPrice || 0,
    amount: (item.quantity || 0) * (item.unitPrice || 0),
    note: item.note || '',
  }));

  const subtotal = invoiceItems.reduce((sum, i) => sum + i.amount, 0);
  const vatPercent = 10;
  const vatAmount = Math.round(subtotal * vatPercent / 100);
  const shippingFee = 0;
  const totalPrice = subtotal + vatAmount + shippingFee;

  return {
    invoiceNumber: order.code || `INV-${Date.now()}`,
    invoiceDate: new Date(order.createdAt || Date.now()).toLocaleDateString('vi-VN'),
    customerName: order.customerName || '',
    customerAddress: order.customerAddress || '',
    customerPhone: order.customerPhone || '',
    customerEmail: order.customerEmail || '',
    deliveryStatus: order.status || 'dang_chuan_bi',
    items: invoiceItems,
    subtotal,
    vatPercent,
    vatAmount,
    shippingFee,
    totalPrice,
    notes: order.note || '',
    paymentMethod: order.paymentMethod || undefined,
    paymentMethodLabel: order.paymentMethod === 'bank_transfer' ? 'Chuyen khoan' : order.paymentMethod === 'cod' ? 'COD (Thu ho)' : order.paymentMethod === 'credit' ? 'Cong no' : undefined,
    bankName: order._bankAccount?.bankName || undefined,
    bankAccountNumber: order._bankAccount?.accountNumber || undefined,
    bankAccountHolder: order._bankAccount?.accountHolder || undefined,
    telegramChatId: order.customer?.telegramChatId || undefined,
  };
}
