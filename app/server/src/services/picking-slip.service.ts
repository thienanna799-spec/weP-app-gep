/**
 * Picking Slip Service
 * ─────────────────────────────────────────────────────────
 * Renders the Picking Slip HTML template (clone of invoice.html
 * but without price columns and payment info) and generates PDF.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Types ──────────────────────────────────────────────────

export interface PickingSlipItem {
  no: number;
  productName: string;
  subSku: string;
  pcs: number;
  quantity: number;
  unit: string;
  note?: string;
}

export interface PickingSlipData {
  pickingSlipNumber: string;
  orderCode: string;
  slipDate: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  statusLabel: string;
  statusClass: string;
  items: PickingSlipItem[];
  totalItems: number;
  totalQuantity: number;
  notes?: string;
  companyLogo?: string;
}

// ── Constants ──────────────────────────────────────────────

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'picking-slip.html');

const COMPANY_LOGO = 'https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw';

const STATUS_CLASS_MAP: Record<string, string> = {
  'cho_xuat_kho': 'pending',
  'dang_chuan_bi': 'shipping',
  'da_xuat_kho': 'delivered',
  'da_ban_giao_tai_xe': 'delivered',
  'dang_giao': 'shipping',
  'giao_thanh_cong': 'delivered',
};

const STATUS_LABEL_MAP: Record<string, string> = {
  'cho_xuat_kho': 'CHO_XUAT_KHO',
  'dang_chuan_bi': 'DANG_CHUAN_BI',
  'da_xuat_kho': 'DA_XUAT_KHO',
  'da_ban_giao_tai_xe': 'DA_BAN_GIAO',
  'dang_giao': 'DANG_GIAO',
  'giao_thanh_cong': 'GIAO_THANH_CONG',
};

// ── Template Renderer ──────────────────────────────────────

export function renderPickingSlipHTML(data: PickingSlipData): string {
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Build product rows (same as invoice but without price columns)
  const rows = data.items.map(item => `
    <tr>
      <td>${item.no}</td>
      <td class="product-name">${item.subSku || ''}</td>
      <td>${item.productName}</td>
      <td>${item.pcs}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${item.note || ''}</td>
    </tr>
  `).join('');

  // Handle conditional notes section
  if (data.notes) {
    template = template
      .replace('{{#notes}}', '')
      .replace('{{/notes}}', '')
      .replace('{{notes}}', data.notes);
  } else {
    template = template.replace(/\{\{#notes\}\}[\s\S]*?\{\{\/notes\}\}/g, '');
  }

  // Replace all placeholders
  const replacements: Record<string, string> = {
    '{{pickingSlipNumber}}': data.pickingSlipNumber,
    '{{orderCode}}': data.orderCode,
    '{{slipDate}}': data.slipDate,
    '{{customerName}}': data.customerName,
    '{{customerAddress}}': data.customerAddress,
    '{{customerPhone}}': data.customerPhone,
    '{{statusLabel}}': data.statusLabel,
    '{{statusClass}}': data.statusClass,
    '{{itemRows}}': rows,
    '{{companyLogo}}': data.companyLogo || COMPANY_LOGO,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replaceAll(placeholder, value);
  }

  return template;
}

// ── PDF Generation (via Puppeteer) ─────────────────────────

export async function generatePickingSlipPDF(data: PickingSlipData): Promise<Buffer> {
  const html = renderPickingSlipHTML(data);

  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    throw new Error(
      'Puppeteer is required for PDF generation. Install it: npm install puppeteer'
    );
  }

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ── Build Picking Slip Data from DB ────────────────────────

/**
 * Maps a Prisma ShippingOrder (with order + items) to PickingSlipData.
 * Uses the same item structure as the invoice but omits prices.
 */
export function buildPickingSlipData(shipping: any, order: any): PickingSlipData {
  const orderItems = order?.items || [];

  const items: PickingSlipItem[] = orderItems.map((item: any, idx: number) => ({
    no: idx + 1,
    productName: item.productName || 'Sản phẩm',
    subSku: item.subSku || '',
    pcs: item.pcs || 1,
    quantity: item.quantity || 0,
    unit: item.unit || 'cuộn',
    note: item.note || '',
  }));

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    pickingSlipNumber: `PK-${shipping.code}`,
    orderCode: order?.code || shipping.code,
    slipDate: new Date(shipping.createdAt || Date.now()).toLocaleDateString('vi-VN'),
    customerName: shipping.customerName || '',
    customerAddress: shipping.customerAddress || '',
    customerPhone: shipping.customerPhone || '',
    statusLabel: STATUS_LABEL_MAP[shipping.status] || shipping.status,
    statusClass: STATUS_CLASS_MAP[shipping.status] || 'pending',
    items,
    totalItems: items.length,
    totalQuantity,
    notes: shipping.notes || order?.note || '',
  };
}
