/**
 * printStyles — Shared CSS for print templates (picking slip, shipping invoice)
 */

const BASE_VARS = `
  :root {
    --brand-primary: #4a6fa5;
    --brand-dark: #2c3e6b;
    --brand-light: #b8cce4;
    --brand-bg: #e8eef6;
    --text-primary: #1a1a2e;
    --text-secondary: #4a4a6a;
    --text-muted: #8a8aa0;
    --border-color: #c5d3e8;
    --row-alt: #f0f4fa;
  }
`;

const BASE_RESET = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
    color: var(--text-primary);
    background: #fff;
    line-height: 1.5;
    font-size: 13px;
  }
`;

const PAGE_LAYOUT = `
  .invoice-page {
    width: 297mm; min-height: 210mm; margin: 0 auto;
    padding: 5mm 15mm 5mm; background: #fff;
    position: relative; display: flex; flex-direction: column;
  }
`;

const HEADER_STYLES = `
  .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4mm; }
  .invoice-title { font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  .invoice-meta { text-align: right; }
  .invoice-meta-row { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 4px; font-size: 12px; }
  .invoice-meta-label { font-weight: 700; min-width: 50px; }
  .invoice-meta-value { color: var(--text-primary); font-weight: 600; border-bottom: 1.5px solid var(--border-color); min-width: 140px; padding-bottom: 2px; }
`;

const INFO_STYLES = `
  .info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12mm; margin-bottom: 5mm; }
  .company-info { flex: 0 0 auto; display: flex; align-items: center; gap: 12px; }
  .company-logo { width: 350px; height: 120px; object-fit: contain; object-position: left center; margin-left: 90px; }
  .customer-info { flex: 0 0 45%; }
  .customer-header { font-weight: 700; font-size: 12px; padding: 5px 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .customer-row { display: flex; margin-bottom: 3px; font-size: 12px; border-bottom: 1px solid #e8ecf2; padding: 3px 0; }
  .customer-label { color: var(--text-secondary); font-weight: 600; min-width: 80px; }
  .customer-value { color: var(--text-primary); font-weight: 500; flex: 1; }
`;

const TABLE_STYLES = `
  .products-table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; font-size: 12px; }
  .products-table thead th { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; text-align: center; }
  .products-table thead th:nth-child(2) { text-align: left; }
  .products-table tbody td { padding: 7px 10px; border: 1px solid var(--border-color); text-align: center; vertical-align: middle; }
  .products-table tbody td:nth-child(2) { text-align: left; }
  .products-table tbody td.product-name { font-weight: 600; color: var(--text-primary); }
`;

const FOOTER_STYLES = `
  .notes-section { margin-bottom: 5mm; padding: 8px 12px; background: #fafbfd; border-left: 3px solid var(--brand-light); border-radius: 0 6px 6px 0; font-size: 11px; color: var(--text-secondary); }
  .notes-label { font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 4mm; }
  .signature-box { text-align: center; width: 30%; margin-bottom: 20mm; }
  .signature-title { font-weight: 700; font-size: 12px; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .signature-line { font-size: 10px; color: var(--text-muted); font-style: italic; }
  .invoice-footer { text-align: center; padding-top: 6mm; font-size: 9px; color: var(--text-muted); margin-top: auto; }
`;

const PRINT_MEDIA = `
  @media print {
    body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
    .invoice-page { margin: 0; padding: 5mm 15mm 20mm; width: 100%; min-height: 100vh; page-break-inside: avoid; }
    .invoice-footer { position: fixed; bottom: 0; left: 15mm; right: 15mm; padding-bottom: 5mm; background: white; }
    @page { size: A4 landscape; margin: 0; }
  }
`;

export function getPickingSlipStyles(): string {
  return `${BASE_VARS}${BASE_RESET}${PAGE_LAYOUT}
    .invoice-page::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, #065f46, #047857); }
    .invoice-title { color: #065f46; }
    .invoice-meta-label { color: #047857; }
    .customer-header { background: #ecfdf5; color: #065f46; border-left: 3px solid #047857; }
    .products-table thead th { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .invoice-footer strong { color: #047857; }
    .invoice-footer { border-top: 2px solid #ecfdf5; }
    ${HEADER_STYLES}${INFO_STYLES}${TABLE_STYLES}${FOOTER_STYLES}${PRINT_MEDIA}`;
}

export function getShippingInvoiceStyles(): string {
  return `${BASE_VARS}${BASE_RESET}${PAGE_LAYOUT}
    .invoice-page::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, var(--brand-dark), var(--brand-primary)); }
    .invoice-title { color: var(--brand-dark); }
    .invoice-meta-label { color: var(--brand-primary); }
    .customer-header { background: var(--brand-bg); color: var(--brand-dark); border-left: 3px solid var(--brand-primary); }
    .products-table thead th { background: var(--brand-bg); color: var(--brand-dark); border: 1px solid var(--border-color); }
    .invoice-footer strong { color: var(--brand-primary); }
    .invoice-footer { border-top: 2px solid var(--brand-bg); }
    ${HEADER_STYLES}${INFO_STYLES}${TABLE_STYLES}${FOOTER_STYLES}${PRINT_MEDIA}`;
}

export function buildPrintHTMLBody(opts: {
  title: string; date: string; orderCode: string; logoUrl: string;
  customerName: string; customerAddress: string; customerPhone: string;
  tableHeaders: string[]; itemRows: string; notesHTML: string;
  signatures: string[]; footerText: string;
}): string {
  return `
  <div class="invoice-page">
    <div class="invoice-header">
      <div class="invoice-title">${opts.title}</div>
      <div class="invoice-meta">
        <div class="invoice-meta-row"><span class="invoice-meta-label">Ngày</span><span class="invoice-meta-value">${opts.date}</span></div>
        <div class="invoice-meta-row"><span class="invoice-meta-label">Mã đơn</span><span class="invoice-meta-value">${opts.orderCode}</span></div>
      </div>
    </div>
    <div class="info-row">
      <div class="company-info"><img src="${opts.logoUrl}" alt="GEP Logo" class="company-logo" onerror="this.style.display='none'" /></div>
      <div class="customer-info">
        <div class="customer-header">Khách hàng</div>
        <div class="customer-row"><span class="customer-label">Tên</span><span class="customer-value">${opts.customerName}</span></div>
        <div class="customer-row"><span class="customer-label">Địa chỉ</span><span class="customer-value">${opts.customerAddress}</span></div>
        <div class="customer-row"><span class="customer-label">SĐT</span><span class="customer-value">${opts.customerPhone}</span></div>
      </div>
    </div>
    <table class="products-table">
      <thead><tr>${opts.tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${opts.itemRows}</tbody>
    </table>
    ${opts.notesHTML}
    <div class="signatures">${opts.signatures.map(s => `<div class="signature-box"><div class="signature-title">${s}</div><div class="signature-line">Ký, ghi rõ họ tên</div></div>`).join('')}</div>
    <div class="invoice-footer">${opts.footerText}</div>
  </div>`;
}

export const GEP_LOGO = 'https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw';
export const GEP_FOOTER = '<strong>GEP Eco-Friendly Packaging</strong> · 275 Nguyễn Trãi, Thanh Xuân, Hà Nội · Tel: 08484847777';
