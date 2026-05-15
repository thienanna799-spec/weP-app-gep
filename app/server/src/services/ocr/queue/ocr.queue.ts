import { EventEmitter } from 'events';
import { prisma } from '../../../lib/prisma.js';
import { OcrPipeline, OcrJobPayload } from '../pipeline/run-ocr.pipeline.js';

// Abstracting BullMQ with a local EventEmitter queue for now.
class LocalQueueService extends EventEmitter {
  constructor() {
    super();
    // Worker listening to events
    this.on('process_ocr', async (job: OcrJobPayload) => {
      try {
        await OcrPipeline.run(job);
      } catch (err) {
        console.error('Queue Worker Error:', err);
      }
    });
  }

  /**
   * Thêm một Job vào hàng đợi. 
   * Interface này giống hệt BullMQ `queue.add(name, data)` để tiện nâng cấp sau này.
   */
  async addJob(jobName: string, data: {
    driverId: string;
    vehicleId?: string;
    referenceId: string;
    documentType: string;
    imageUrl: string;
    declaredValue: number;
  }): Promise<string> {
    // 1. Tạo OcrAuditLog ở trạng thái 'queued' ngay khi nhận Job (đây là evidence)
    const auditLog = await prisma.ocrAuditLog.create({
      data: {
        driverId: data.driverId,
        vehicleId: data.vehicleId || null,
        referenceId: data.referenceId,
        documentType: data.documentType,
        imageUrl: data.imageUrl,
        declaredValue: data.declaredValue,
        pipelineStatus: 'queued',
        reviewStatus: 'pending'
      }
    });

    const payload: OcrJobPayload = {
      logId: auditLog.id,
      imageUrl: data.imageUrl,
      documentType: data.documentType,
      declaredValue: data.declaredValue
    };

    // 2. Fire-and-forget event (Non-blocking)
    // Tùy chọn: Dùng setImmediate để đảm bảo chạy ở tick tiếp theo
    setImmediate(() => {
      this.emit('process_ocr', payload);
    });

    return auditLog.id;
  }
}

// Khởi tạo Singleton
export const OcrQueue = new LocalQueueService();
