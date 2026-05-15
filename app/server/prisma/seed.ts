import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive mock data...');

  // 1. DUMMY USER FOR FOREIGN KEYS
  const dummyUser = await prisma.user.upsert({
    where: { email: 'dummy@wep.vn' },
    update: {},
    create: {
      uid: 'dummy-uid-123',
      email: 'dummy@wep.vn',
      name: 'Nguyễn Văn Dummy',
      role: 'staff',
      status: 'active',
      department: 'Phòng Kinh Doanh'
    }
  });

  // 2. BANK ACCOUNTS
  const existingBanks = await prisma.bankAccount.count();
  if (existingBanks === 0) {
    await prisma.bankAccount.createMany({
      data: [
        { bankName: 'Vietcombank', accountNumber: '0123456789', accountHolder: 'CÔNG TY WEP', branch: 'Hà Nội', isDefault: true },
        { bankName: 'Techcombank', accountNumber: '9876543210', accountHolder: 'CÔNG TY WEP', branch: 'HCM', isDefault: false }
      ]
    });
  }

  // 3. CUSTOMERS & CRM
  const customer1 = await prisma.customer.upsert({
    where: { code: 'KH001' },
    update: {},
    create: {
      code: 'KH001', name: 'Công ty Bao Bì Phúc Khang', phone: '0901234567', email: 'pk@example.com',
      address: 'KCN Sóng Thần, Bình Dương', customerType: 'doanh_nghiep', totalOrders: 5, totalRevenue: 150000000,
      crmNotes: { create: [{ content: 'Khách hàng VIP, cần giao hàng đúng hẹn', createdBy: dummyUser.uid, createdByName: dummyUser.name }] }
    }
  });

  const customer2 = await prisma.customer.upsert({
    where: { code: 'KH002' },
    update: {},
    create: {
      code: 'KH002', name: 'Nguyễn Thị Hoa', phone: '0987654321', email: 'hoa.nguyen@example.com',
      address: 'Quận 1, TP. HCM', customerType: 'ca_nhan'
    }
  });

  // 4. MATERIALS
  const mat1 = await prisma.material.upsert({
    where: { code: 'MAT-001' },
    update: {},
    create: { code: 'MAT-001', name: 'Hạt nhựa PE Nguyên Sinh', group: 'Hạt nhựa', unit: 'kg', currentStock: 1000, purchasePrice: 35000, status: 'con_hang' as any }
  });
  const mat2 = await prisma.material.upsert({
    where: { code: 'MAT-002' },
    update: {},
    create: { code: 'MAT-002', name: 'Lõi giấy 50cm', group: 'Lõi giấy', unit: 'cái', currentStock: 500, purchasePrice: 5000, status: 'con_hang' as any }
  });

  // 5. ORDERS
  const order1 = await prisma.order.upsert({
    where: { code: 'ORD-2026-001' },
    update: {},
    create: {
      code: 'ORD-2026-001', customerId: customer1.id, customerName: customer1.name, customerPhone: customer1.phone,
      customerAddress: customer1.address, status: 'da_duyet' as any, quantity: 100, createdBy: dummyUser.uid, createdByName: dummyUser.name,
      totalRevenue: 50000000,
      items: {
        create: [
          { productName: 'Cuộn bóng xốp 50cm x 100m', specification: '50cm x 100m, 5kg', quantity: 50, unit: 'cuộn', unitPrice: 500000 },
          { productName: 'Cuộn bóng xốp 1m x 100m', specification: '1m x 100m, 10kg', quantity: 50, unit: 'cuộn', unitPrice: 500000 }
        ]
      }
    }
  });

  // 6. PRODUCTION ORDERS
  const prodOrder1 = await prisma.productionOrder.upsert({
    where: { code: 'LSX-001' },
    update: {},
    create: {
      code: 'LSX-001', productionDate: new Date(), creatorId: dummyUser.uid, requiredQuantity: 100,
      specs: '50cm x 100m, 5kg', targetRolls: 100, status: 'producing' as any, productName: 'Cuộn bóng xốp 50cm x 100m', orderId: order1.id,
      materials: {
        create: [ { materialId: mat1.id, materialName: mat1.name, quantity: 500 } ]
      }
    }
  });

  // 7. PRODUCT ROLLS (INVENTORY)
  const roll1 = await prisma.productRoll.upsert({
    where: { code: 'ROLL-001' },
    update: {},
    create: {
      id: 'ROLL-001', code: 'ROLL-001', qrCode: 'QR-ROLL-001', productId: 'PROD-001', productName: 'Cuộn bóng xốp 50cm',
      specification: '50cm x 100m, 5kg', length: 100, weight: 5, productionDate: new Date(), status: 'trong_kho' as any,
      creator: dummyUser.uid, productionOrderId: prodOrder1.id, positionWarehouse: 'Kho A', positionArea: 'Khu 1', positionShelf: 'Kệ 1'
    }
  });

  const roll2 = await prisma.productRoll.upsert({
    where: { code: 'ROLL-002' },
    update: {},
    create: {
      id: 'ROLL-002', code: 'ROLL-002', qrCode: 'QR-ROLL-002', productId: 'PROD-001', productName: 'Cuộn bóng xốp 50cm',
      specification: '50cm x 100m, 5kg', length: 100, weight: 5, productionDate: new Date(), status: 'trong_kho' as any,
      creator: dummyUser.uid, productionOrderId: prodOrder1.id, positionWarehouse: 'Kho A', positionArea: 'Khu 1', positionShelf: 'Kệ 1'
    }
  });

  // 8. VEHICLES & DRIVERS
  const vehicle1 = await prisma.vehicle.upsert({
    where: { plateNumber: '51C-123.45' },
    update: {},
    create: {
      plateNumber: '51C-123.45', type: 'Xe tải 2.5 tấn', capacity: 2500, year: 2020, condition: 'Tốt', registrationDate: '2020-01-01', insuranceExpiry: '2025-01-01', status: 'available' as any
    }
  });

  const driver1 = await prisma.driver.upsert({
    where: { code: 'DRV-001' },
    update: {},
    create: {
      code: 'DRV-001', name: 'Lê Văn Lái', phone: '0911223344', email: 'lai.le@example.com', address: 'Thủ Đức, HCM',
      dob: '1990-05-15', idCard: '012345678912', licenseNo: 'B2-998877', licenseType: 'B2', licenseExpiry: '2030-05-15',
      joinedDate: '2023-01-01', currentVehicleId: vehicle1.id
    }
  });

  // 9. SHIPPING ORDERS
  const ship1 = await prisma.shippingOrder.upsert({
    where: { code: 'SHP-001' },
    update: {},
    create: {
      code: 'SHP-001', orderId: order1.id, customerName: order1.customerName, customerPhone: order1.customerPhone, customerAddress: order1.customerAddress,
      totalRolls: 50, totalQuantity: 50, status: 'dang_giao' as any, assignedDriverId: driver1.id, assignedDriverName: driver1.name, assignedVehicle: vehicle1.plateNumber,
      createdBy: dummyUser.uid,
      items: {
        create: [
          { rollId: roll1.id, qrCode: roll1.qrCode, productName: roll1.productName, specification: roll1.specification }
        ]
      }
    }
  });

  console.log('✅ Comprehensive seed completed successfully!');
  console.log('  - Users, Customers, Orders, Materials, Production, Inventory, Shipping data seeded.');
  console.log('  - Login with bachsydonggiphn@gmail.com to get super_admin role automatically');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
