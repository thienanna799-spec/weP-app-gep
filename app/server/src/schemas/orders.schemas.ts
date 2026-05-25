import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    code: z.string().optional(),
    customerName: z.string().min(1, 'Tên khách hàng không được để trống'),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    customerAddress: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    paymentMethod: z.string().optional(),
    bankAccountId: z.string().optional(),
    paymentStatus: z.string().optional(),
    note: z.string().optional(),
    quantity: z.number().optional(),
    deliveryDeadline: z.string().optional(),
    totalRevenue: z.number().optional(),
    totalCost: z.number().optional(),
    profit: z.number().optional(),
    items: z.array(z.object({
      productName: z.string().min(1, 'Tên sản phẩm không được để trống'),
      specification: z.string().optional(),
      quantity: z.number().min(1, 'Số lượng phải lớn hơn 0'),
      unit: z.string().optional(),
      unitPrice: z.number().nonnegative(),
      subSku: z.string().optional(),
      sku: z.string().optional(),
      note: z.string().optional(),
    })).optional(),
  }),
});
