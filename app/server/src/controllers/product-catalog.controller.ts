import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/inventory/products
 * Aggregate all unique products from ImportBatch (external import) 
 * and ProductRoll tables to build a unified product catalog.
 * Returns: { products: ProductCatalogItem[] }
 */
export const getProductCatalog = async (_req: Request, res: Response) => {
  try {
    // 1. Get all import batches (external goods) — each represents a unique product declaration
    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rolls: true } },
        rolls: {
          select: {
            id: true,
            status: true,
            stockQuantity: true,
          },
        },
      },
    });

    // 2. Build catalog: group by SKU + supplier + subSku to avoid duplicates
    const catalogMap = new Map<string, any>();

    for (const batch of batches) {
      const key = `${batch.sku || ''}|${batch.supplier || ''}|${batch.subSku || ''}|${batch.productName}`;

      if (!catalogMap.has(key)) {
        // Count stock from rolls
        let inStock = 0;
        let exported = 0;
        let defective = 0;
        let totalQuantity = 0;

        for (const roll of batch.rolls) {
          const qty = roll.stockQuantity || 1;
          if (roll.status === 'trong_kho' || roll.status === 'da_giu_cho_don') {
            inStock += qty;
          } else if (roll.status === 'da_xuat_kho') {
            exported += qty;
          } else if (roll.status === 'loi_hong') {
            defective += qty;
          }
          totalQuantity += qty;
        }

        catalogMap.set(key, {
          id: batch.id,
          sku: batch.sku || '',
          supplier: batch.supplier || '',
          productName: batch.productName,
          subSku: batch.subSku || '',
          color: batch.color || '',
          specification: batch.specification || '',
          otherSpecs: batch.otherSpecs || '',
          costPrice: batch.costPrice,
          totalDeclared: batch.quantity,
          inStock,
          exported,
          defective,
          totalRolls: batch._count.rolls,
          createdAt: batch.createdAt,
          batches: [{ id: batch.id, quantity: batch.quantity, createdAt: batch.createdAt, note: batch.note }],
        });
      } else {
        const existing = catalogMap.get(key)!;
        existing.totalDeclared += batch.quantity;

        // Accumulate stock from this batch's rolls
        for (const roll of batch.rolls) {
          const qty = roll.stockQuantity || 1;
          if (roll.status === 'trong_kho' || roll.status === 'da_giu_cho_don') {
            existing.inStock += qty;
          } else if (roll.status === 'da_xuat_kho') {
            existing.exported += qty;
          } else if (roll.status === 'loi_hong') {
            existing.defective += qty;
          }
          existing.totalRolls += 1;
        }

        existing.batches.push({
          id: batch.id,
          quantity: batch.quantity,
          createdAt: batch.createdAt,
          note: batch.note,
        });
      }
    }

    const products = Array.from(catalogMap.values());

    res.json({ products });
  } catch (error: any) {
    console.error('Error fetching product catalog:', error);
    res.status(500).json({ error: 'Failed to fetch product catalog', details: error.message });
  }
};

/**
 * GET /api/inventory/products/:id
 * Get detailed info about a product catalog entry (from ImportBatch)
 */
export const getProductCatalogItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const batch = await prisma.importBatch.findUnique({
      where: { id },
      include: {
        rolls: {
          select: {
            id: true,
            code: true,
            qrCode: true,
            status: true,
            stockQuantity: true,
            positionWarehouse: true,
            positionArea: true,
            positionSlot: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!batch) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Build status summary
    const statusCounts: Record<string, number> = {};
    for (const roll of batch.rolls) {
      statusCounts[roll.status] = (statusCounts[roll.status] || 0) + (roll.stockQuantity || 1);
    }

    res.json({
      ...batch,
      statusCounts,
    });
  } catch (error: any) {
    console.error('Error fetching product detail:', error);
    res.status(500).json({ error: 'Failed to fetch product detail', details: error.message });
  }
};
