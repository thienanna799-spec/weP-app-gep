/**
 * Sample Invoice Data (JSON)
 * ─────────────────────────────────────────────────────────
 * Use this as a reference for the InvoiceData structure
 * and for testing the invoice template.
 */

export const SAMPLE_INVOICE = {
  invoiceNumber: "GH-2026-0423",
  invoiceDate: "23/04/2026",
  customerName: "Đại lý Bọc Chống Sốc Miền Nam",
  customerAddress: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  customerPhone: "0901 234 567",
  customerEmail: "miennam@bocchongsoc.vn",
  deliveryStatus: "dang_giao",
  items: [
    {
      no: 1,
      productName: "Màng xốp PE K50 - Loại 1",
      pcs: 1,
      quantity: 20,
      unit: "cuộn",
      unitPrice: 150000,
      amount: 3000000,
      note: ""
    },
    {
      no: 2,
      productName: "Màng xốp PE K80 - Loại 1",
      pcs: 1,
      quantity: 15,
      unit: "cuộn",
      unitPrice: 220000,
      amount: 3300000,
      note: "Đóng gói cẩn thận"
    },
    {
      no: 3,
      productName: "Băng keo trong 48mm",
      pcs: 6,
      quantity: 30,
      unit: "cuộn",
      unitPrice: 12000,
      amount: 360000,
      note: ""
    },
    {
      no: 4,
      productName: "Thùng carton 3 lớp - 40x30x25",
      pcs: 1,
      quantity: 100,
      unit: "cái",
      unitPrice: 8500,
      amount: 850000,
      note: "In logo"
    }
  ],
  subtotal: 7510000,
  vatPercent: 10,
  vatAmount: 751000,
  shippingFee: 0,
  totalPrice: 8261000,
  notes: "Giao tại cổng sau, liên hệ anh Thắng (0912 xxx xxx). Hàng dễ vỡ, vận chuyển cẩn thận.",
  companyLogo: "https://lh3.googleusercontent.com/d/1z8H8EFylPDsYjmuZvG8F8REP5dzOgcKw",
  companyAddress: "123 Đường Sản Xuất, Quận 9, TP. Hồ Chí Minh",
  companyPhone: "0901 234 567"
};
