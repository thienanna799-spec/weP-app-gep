const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE OVERVIEW ===\n');

  // Count records in each table
  const counts = {
    users: await prisma.user.count(),
    customers: await prisma.customer.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    productRolls: await prisma.productRoll.count(),
    productionOrders: await prisma.productionOrder.count(),
    materials: await prisma.material.count(),
    shippingOrders: await prisma.shippingOrder.count(),
    drivers: await prisma.driver.count(),
    bankAccounts: await prisma.bankAccount.count(),
  };

  console.log('📊 Record counts:');
  Object.entries(counts).forEach(([table, count]) => {
    console.log(`   ${table}: ${count}`);
  });

  // Show customers with bank info
  console.log('\n👤 Customers:');
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, phone: true, preferredPayment: true, bankName: true, bankAccountNumber: true, bankAccountHolder: true },
    take: 10,
  });
  customers.forEach(c => {
    console.log(`   [${c.preferredPayment}] ${c.name} | ${c.phone} | Bank: ${c.bankName || '-'} | Acc: ${c.bankAccountNumber || '-'} | Holder: ${c.bankAccountHolder || '-'}`);
  });

  // Show orders
  console.log('\n📦 Orders:');
  const orders = await prisma.order.findMany({
    select: { id: true, code: true, customerName: true, status: true, quantity: true, totalRevenue: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  orders.forEach(o => {
    console.log(`   #${o.code} | ${o.customerName} | Status: ${o.status} | Qty: ${o.quantity} | Revenue: ${o.totalRevenue}`);
  });

  // Show bank accounts
  console.log('\n🏦 Bank Accounts:');
  const banks = await prisma.bankAccount.findMany();
  if (banks.length === 0) {
    console.log('   (Chưa có tài khoản ngân hàng nào)');
  } else {
    banks.forEach(b => {
      console.log(`   ${b.bankName} | ${b.accountNumber} | ${b.accountHolder} | Default: ${b.isDefault}`);
    });
  }

  // Show product rolls
  console.log('\n🏭 Product Rolls:');
  const rolls = await prisma.productRoll.findMany({
    select: { id: true, code: true, productName: true, status: true, positionArea: true, positionShelf: true },
    take: 10,
  });
  rolls.forEach(r => {
    console.log(`   ${r.code} | ${r.productName} | ${r.status} | Area: ${r.positionArea || '-'} Shelf: ${r.positionShelf || '-'}`);
  });

  // Show users
  console.log('\n👥 Users:');
  const users = await prisma.user.findMany({
    select: { uid: true, name: true, email: true, role: true, status: true },
    take: 10,
  });
  users.forEach(u => {
    console.log(`   ${u.name} | ${u.email} | Role: ${u.role} | Status: ${u.status}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
