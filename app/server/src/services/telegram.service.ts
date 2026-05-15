/**
 * Telegram Bot Service
 * ─────────────────────────────────────────────────────────
 * Sends invoices and notifications to customers via Telegram Bot API.
 *
 * Setup:
 *   1. Create a Telegram bot via @BotFather → get TELEGRAM_BOT_TOKEN
 *   2. Set environment variables:
 *      TELEGRAM_BOT_TOKEN=<your_bot_token>
 *      TELEGRAM_DEFAULT_CHAT_ID=<default_chat_id>  (optional)
 *
 * Usage:
 *   - Customer needs to have a `telegramChatId` in the database
 *   - Or use the default chat ID for internal notifications
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set in environment');
  return token;
}

// ── Send Text Message ──────────────────────────────────────

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  try {
    const token = getBotToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json() as any;
    if (!data.ok) {
      console.error('[Telegram] sendMessage failed:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] sendMessage error:', err);
    return false;
  }
}

// ── Send PDF Document ──────────────────────────────────────

export async function sendTelegramDocument(
  chatId: string,
  pdfBuffer: Buffer,
  filename: string,
  caption?: string
): Promise<boolean> {
  try {
    const token = getBotToken();

    // Use FormData to send the PDF as a multipart upload
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), filename);
    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s for document
    const res = await fetch(`${TELEGRAM_API}${token}/sendDocument`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await res.json() as any;
    if (!data.ok) {
      console.error('[Telegram] sendDocument failed:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] sendDocument error:', err);
    return false;
  }
}

// ── Send Invoice Notification ──────────────────────────────

export interface InvoiceNotification {
  chatId: string;
  orderCode: string;
  customerName: string;
  totalPrice: string;
  deliveryStatus: string;
  driverName?: string;
  estimatedDelivery?: string;
}

/**
 * Sends a formatted invoice notification message + PDF attachment to a customer.
 */
export async function sendInvoiceNotification(
  notification: InvoiceNotification,
  pdfBuffer?: Buffer
): Promise<boolean> {
  const { chatId, orderCode, customerName, totalPrice, deliveryStatus, driverName, estimatedDelivery } = notification;

  // Build rich message
  const statusEmoji = deliveryStatus === 'dang_giao' ? '🚚' : deliveryStatus === 'giao_thanh_cong' ? '✅' : '📋';
  const statusLabel = {
    'dang_giao': 'Đang giao hàng',
    'giao_thanh_cong': 'Đã giao thành công',
    'cho_xuat_kho': 'Chờ xuất kho',
    'da_xuat_kho': 'Đã xuất kho',
  }[deliveryStatus] || deliveryStatus;

  let message = `${statusEmoji} <b>Thông báo đơn hàng</b>\n\n`;
  message += `📦 Mã đơn: <code>${orderCode}</code>\n`;
  message += `👤 Khách hàng: <b>${customerName}</b>\n`;
  message += `💰 Tổng tiền: <b>${totalPrice}</b>\n`;
  message += `📌 Trạng thái: <b>${statusLabel}</b>\n`;

  if (driverName) {
    message += `🚗 Tài xế: ${driverName}\n`;
  }
  if (estimatedDelivery) {
    message += `📅 Dự kiến giao: ${estimatedDelivery}\n`;
  }

  message += `\n<i>Cảm ơn quý khách đã sử dụng dịch vụ GEP Packaging!</i>`;

  // Send the text message first
  const textSent = await sendTelegramMessage(chatId, message);

  // Send PDF if available
  if (pdfBuffer) {
    const filename = `Bien_ban_giao_hang_${orderCode}.pdf`;
    const caption = `📄 Biên bản giao hàng ${orderCode}`;
    await sendTelegramDocument(chatId, pdfBuffer, filename, caption);
  }

  return textSent;
}

// ── Internal Staff Notification ────────────────────────────

/**
 * Sends a notification to internal staff group chat when order status changes.
 */
export async function notifyStaff(orderCode: string, status: string, updatedBy: string): Promise<void> {
  const chatId = process.env.TELEGRAM_STAFF_CHAT_ID;
  if (!chatId) return; // Skip if no staff chat configured

  const message = `📋 <b>Cập nhật đơn hàng</b>\n\n`
    + `Mã: <code>${orderCode}</code>\n`
    + `Trạng thái: <b>${status}</b>\n`
    + `Người cập nhật: ${updatedBy}`;

  await sendTelegramMessage(chatId, message);
}

// ── Send Photo ─────────────────────────────────────────────

/**
 * Send a photo to Telegram. Supports base64 data URLs or external URLs.
 */
export async function sendTelegramPhoto(
  chatId: string,
  photoData: string,
  caption?: string
): Promise<boolean> {
  try {
    const token = getBotToken();
    const formData = new FormData();
    formData.append('chat_id', chatId);

    if (photoData.startsWith('data:')) {
      // Convert base64 data URL to Blob
      const [meta, base64] = photoData.split(',');
      const mime = meta.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      const binary = Buffer.from(base64, 'base64');
      formData.append('photo', new Blob([binary], { type: mime }), 'proof.jpg');
    } else {
      // External URL
      formData.append('photo', photoData);
    }

    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json() as any;
    if (!data.ok) {
      console.error('[Telegram] sendPhoto failed:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] sendPhoto error:', err);
    return false;
  }
}

// ── Send Video ─────────────────────────────────────────────

export async function sendTelegramVideo(
  chatId: string,
  videoData: string,
  caption?: string
): Promise<boolean> {
  try {
    const token = getBotToken();
    const formData = new FormData();
    formData.append('chat_id', chatId);

    if (videoData.startsWith('data:')) {
      const [meta, base64] = videoData.split(',');
      const mime = meta.match(/data:(.*?);/)?.[1] || 'video/mp4';
      const binary = Buffer.from(base64, 'base64');
      formData.append('video', new Blob([binary], { type: mime }), 'proof.mp4');
    } else {
      formData.append('video', videoData);
    }

    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${TELEGRAM_API}${token}/sendVideo`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json() as any;
    if (!data.ok) {
      console.error('[Telegram] sendVideo failed:', data.description);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Telegram] sendVideo error:', err);
    return false;
  }
}

// ── Send Delivery Proof to Customer ────────────────────────

export interface DeliveryProofData {
  fileType: string;
  fileUrl: string;
}

/**
 * Sends delivery proof photos/videos + thank-you message to the customer's Telegram.
 */
export async function sendDeliveryProofNotification(
  chatId: string,
  orderCode: string,
  customerName: string,
  proofs: DeliveryProofData[]
): Promise<boolean> {
  try {
    // Send each proof file FIRST
    for (let i = 0; i < proofs.length; i++) {
      const proof = proofs[i];
      const caption = `📋 Chứng từ ${i + 1}/${proofs.length} — Đơn ${orderCode}`;

      if (proof.fileType === 'video') {
        await sendTelegramVideo(chatId, proof.fileUrl, caption);
      } else {
        await sendTelegramPhoto(chatId, proof.fileUrl, caption);
      }
    }

    // Then send thank-you message LAST
    const message = `✅ <b>Giao hàng thành công!</b>\n\n`
      + `📦 Mã đơn: <code>${orderCode}</code>\n`
      + `👤 Khách hàng: <b>${customerName}</b>\n\n`
      + `📸 Đã gửi ${proofs.length} ảnh/video chứng từ giao hàng.\n\n`
      + `<i>Cảm ơn quý khách đã sử dụng dịch vụ GEP Eco-Friendly Packaging! 🌿</i>`;

    await sendTelegramMessage(chatId, message);

    console.log(`[Telegram] Sent ${proofs.length} delivery proofs for ${orderCode} to ${chatId}`);
    return true;
  } catch (err) {
    console.error('[Telegram] sendDeliveryProofNotification error:', err);
    return false;
  }
}
