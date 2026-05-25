import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  renderPickingSlipHTML,
  generatePickingSlipPDF,
  buildPickingSlipData,
} from '../services/picking-slip.service.js';

/** Helper to load shipping + order data for picking slip */
async function getShippingWithOrder(shippingId: string) {
  const shipping = await prisma.shippingOrder.findUnique({
    where: { id: shippingId },
    include: { items: true },
  });
  if (!shipping) return null;

  const order = await prisma.order.findUnique({
    where: { id: shipping.orderId },
    include: { items: true },
  });

  return { shipping, order };
}

/** GET /api/shipping/:id/picking-slip/preview — HTML preview */
export const previewPickingSlip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getShippingWithOrder(req.params.id);
  if (!data) { sendError(res, 'Shipping order not found', 404); return; }

  const slipData = buildPickingSlipData(data.shipping, data.order);
  const html = renderPickingSlipHTML(slipData);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

/** GET /api/shipping/:id/picking-slip/pdf — Download PDF */
export const downloadPickingSlipPDF = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getShippingWithOrder(req.params.id);
  if (!data) { sendError(res, 'Shipping order not found', 404); return; }

  const slipData = buildPickingSlipData(data.shipping, data.order);

  try {
    const pdfBuffer = await generatePickingSlipPDF(slipData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Phieu_lay_hang_${data.shipping.code}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    if (err.message?.includes('Puppeteer')) {
      const html = renderPickingSlipHTML(slipData);
      const printHtml = html.replace(
        '</body>',
        `<script>
          window.onload = function() {
            if (confirm('Puppeteer không khả dụng. Mở trang in để tạo PDF?')) {
              window.print();
            }
          };
        </script></body>`
      );
      res.setHeader('Content-Type', 'text/html');
      res.send(printHtml);
      return;
    }
    throw err;
  }
});

/** GET /api/shipping/:id/picking-slip/data — JSON data for frontend rendering */
export const getPickingSlipData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getShippingWithOrder(req.params.id);
  if (!data) { sendError(res, 'Shipping order not found', 404); return; }

  const slipData = buildPickingSlipData(data.shipping, data.order);
  sendSuccess(res, slipData);
});
