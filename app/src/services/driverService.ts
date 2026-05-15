import api from './api';

export const addFuelLog = async (data: any) => {
  return api.post('/fuel-logs', data);
};

export const createTestDriver = async () => {
  const testId = `DRV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const driverName = `Tài xế Thử nghiệm ${testId}`;

  await api.post('/drivers', {
    code: testId,
    name: driverName,
    phone: '0901234567',
    email: `${testId.toLowerCase()}@example.com`,
    address: 'Test Address',
    dob: '1990-01-01',
    idCard: '000000000',
    licenseNo: 'B2-000000',
    licenseType: 'B2',
    licenseExpiry: '2030-01-01',
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'available',
  });
};
