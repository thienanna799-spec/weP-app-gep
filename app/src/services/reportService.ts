import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Order } from '../types/order.types';
import { Roll } from '../types/roll.types';

export const exportDeliveryPDF = (order: Order, rolls: Roll[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('BIÊN BẢN GIAO HÀNG', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Mã đơn: ${order.id}`, 20, 40);
  doc.text(`Ngày giao: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 50);
  
  // Customer Info
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);
  doc.text('THÔNG TIN KHÁCH HÀNG', 20, 65);
  doc.text(`Tên: ${order.customerName}`, 20, 75);
  doc.text(`SĐT: ${order.customerPhone || 'N/A'}`, 20, 85);
  doc.text(`Địa chỉ: ${order.customerAddress || 'N/A'}`, 20, 95);
  
  // Table
  const tableData = rolls.map((r, index) => [
    index + 1,
    r.id,
    r.productName || 'N/A',
    '1'
  ]);

  (doc as any).autoTable({
    startY: 105,
    head: [['STT', 'Mã QR', 'Sản phẩm', 'Số lượng']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 133, 244] }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // Footer
  doc.text('XÁC NHẬN CỦA KHÁCH HÀNG', 20, finalY);
  doc.text('(Ký và ghi rõ họ tên)', 20, finalY + 10);
  
  doc.text('NGƯỜI GIAO HÀNG', 140, finalY);
  doc.text('(Ký và ghi rõ họ tên)', 140, finalY + 10);

  doc.save(`Bien_ban_giao_hang_${order.id}.pdf`);
};

export const exportOrdersToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
