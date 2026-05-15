/**
 * Auth Service
 * Handles Firebase logout and seed data generation.
 * 
 * Note: Role/status updates are handled by userService.ts — not duplicated here.
 */
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import api, { clearToken } from './api';

export const logout = async () => {
  await signOut(auth);
  clearToken();
};

export const seedSampleData = async () => {
  // Seed Materials
  const materials = [
    { code: 'MAT-001', name: 'Hạt nhựa PE Nguyên Sinh', group: 'Hạt nhựa', unit: 'kg', currentStock: 1000, minStock: 100, purchasePrice: 35000 },
    { code: 'MAT-002', name: 'Lõi giấy 50cm', group: 'Lõi giấy', unit: 'cái', currentStock: 500, minStock: 50, purchasePrice: 5000 },
  ];
  for (const m of materials) {
    await api.post('/materials', m).catch(() => {});
  }

  // Seed a sample order
  await api.post('/orders', {
    code: `DH-SEED-${Date.now()}`,
    customerName: 'Đại lý Bọc Chống Sốc Miền Nam',
    customerPhone: '0901234567',
    customerAddress: '123 Đường Số 1, Quận 7, TP.HCM',
    quantity: 100,
    priority: 'cao',
    status: 'cho_duyet',
  }).catch(() => {});

  // Seed a fuel log
  await api.post('/fuel-logs', {
    driverId: 'seed_driver',
    amount: 500000,
    volume: 50,
    mileage: 1000,
    notes: 'Đổ xăng đầu ngày',
  }).catch(() => {});
};
