import 'dotenv/config';
import { describe, it, expect, vi } from 'vitest';
import { getStockSummary } from '../controllers/stock.summary.controller.js';
import { prisma } from '../lib/prisma.js';
import { Response } from 'express';

describe('Integration Tests: getStockSummary aggregation', () => {
  it('should correctly calculate stock summaries based on prisma queries', async () => {
    const testSuffix = `TEST-${Date.now()}`;
    const subSku = `SUB-${testSuffix}`;
    const sku = `SKU-${testSuffix}`;
    const supplier = `SUPPLIER-${testSuffix}`;
    const userUid = `UID-${testSuffix}`;

    const testUser = await prisma.user.create({
      data: {
        uid: userUid,
        email: `${testSuffix.toLowerCase()}@test.com`,
        name: 'Test Integration User',
        role: 'admin',
        status: 'active'
      }
    });

    const importBatch = await prisma.importBatch.create({
      data: {
        supplier,
        subSku,
        productName: 'Test Product',
        sku,
        specification: '100m/roll',
        nhapKho: 10,
        xuatKho: 2,
        tonKho: 8,
        costPrice: 100000,
        quantity: 10,
        createdBy: userUid,
        createdByName: 'Test User'
      }
    });

    const rollsData = [
      { id: `ROLL-ID-1-${testSuffix}`, code: `ROLL-1-${testSuffix}`, qrCode: `QR-1-${testSuffix}`, productId: `PROD-${testSuffix}`, productName: 'Test Product', sku, subSku, supplier, specification: '100m/roll', status: 'trong_kho', length: 100, weight: 20, productionDate: new Date(), creator: userUid, sourceType: 'manual', importBatchId: importBatch.id },
      { id: `ROLL-ID-2-${testSuffix}`, code: `ROLL-2-${testSuffix}`, qrCode: `QR-2-${testSuffix}`, productId: `PROD-${testSuffix}`, productName: 'Test Product', sku, subSku, supplier, specification: '100m/roll', status: 'trong_kho', length: 100, weight: 20, productionDate: new Date(), creator: userUid, sourceType: 'manual', importBatchId: importBatch.id },
      { id: `ROLL-ID-3-${testSuffix}`, code: `ROLL-3-${testSuffix}`, qrCode: `QR-3-${testSuffix}`, productId: `PROD-${testSuffix}`, productName: 'Test Product', sku, subSku, supplier, specification: '100m/roll', status: 'da_giu_cho_don', length: 100, weight: 20, productionDate: new Date(), creator: userUid, sourceType: 'manual', importBatchId: importBatch.id },
      { id: `ROLL-ID-4-${testSuffix}`, code: `ROLL-4-${testSuffix}`, qrCode: `QR-4-${testSuffix}`, productId: `PROD-${testSuffix}`, productName: 'Test Product', sku, subSku, supplier, specification: '100m/roll', status: 'loi_hong', length: 100, weight: 20, productionDate: new Date(), creator: userUid, sourceType: 'manual', importBatchId: importBatch.id },
    ];

    await prisma.productRoll.createMany({
      data: rollsData as any
    });

    let responseStatus = 200;
    let responseData: any = null;

    let resolveTest: any;
    const testPromise = new Promise((resolve) => {
      resolveTest = resolve;
    });

    const req = {} as any;
    const res = {
      status: (code: number) => {
        responseStatus = code;
        return res;
      },
      json: (data: any) => {
        responseData = data;
        resolveTest();
        return res;
      }
    } as unknown as Response;

    const next = (err: any) => {
      if (err) {
        console.error('Error in controller:', err);
      }
      resolveTest();
    };

    getStockSummary(req, res, next);

    await testPromise;

    console.log('TEST SUFFIX:', testSuffix);
    const entry = responseData?.data?.find((item: any) => item.subSku === subSku);

    expect(responseStatus).toBe(200);
    expect(entry).toBeDefined();
    expect(entry.nhapKho).toBe(10);
    expect(entry.xuatKho).toBe(2);
    expect(entry.tonKho).toBe(8);
    expect(entry.tonThucTe).toBe(3);
    expect(entry.tonKhaDung).toBe(2);
    expect(entry.daGiuDon).toBe(1);
    expect(entry.loi).toBe(1);

    await prisma.productRoll.deleteMany({
      where: { subSku }
    });
    await prisma.importBatch.deleteMany({
      where: { subSku }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
  });
});
