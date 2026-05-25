import * as XLSX from 'xlsx';
import { Customer, OPERATIONAL_STATUS_LABELS } from '../types';

export const exportCustomersToExcel = (
  customers: Customer[],
  t: (key: string) => string,
  idsToExport?: string[]
) => {
  const dataToExport = idsToExport && idsToExport.length > 0 
    ? customers.filter(c => idsToExport.includes(c.id))
    : customers;

  const headers = [
    t('common.code'), 
    t('common.name'), 
    t('customers.recipient'), 
    t('common.phone'), 
    t('common.address'), 
    t('customers.group'), 
    t('customers.platform'), 
    t('common.status'), 
    'Boss', 
    t('common.products'), 
    'GIP', 
    t('common.note')
  ];

  const rows = dataToExport.map(c => [
    c.code, 
    c.name, 
    c.recipientName || '', 
    c.phone, 
    c.address,
    c.groupName || '', 
    c.operatingPlatform || '',
    OPERATIONAL_STATUS_LABELS[c.operationalStatus || 'active'],
    c.boss || '', 
    c.product || '', 
    c.gipCode || '', 
    c.notes || '',
  ]);
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
  XLSX.writeFile(workbook, `Customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
