/**
 * G-Solution Order Status Checker
 * ================================
 * 1. Đọc danh sách đơn hàng từ Google Sheet (qua Apps Script)
 * 2. Đăng nhập g-solution.vn, tìm kiếm từng waybill
 * 3. Lấy trạng thái đơn hàng
 * 4. Cập nhật trạng thái vào cột C Google Sheet
 * 5. Gửi báo cáo tổng hợp qua Telegram
 */

require('dotenv').config();
const puppeteer = require('puppeteer');

// ─── CONFIG ─────────────────────────────────────────
const CONFIG = {
  gsolution: {
    url: 'https://g-solution.vn',
    email: process.env.GSOLUTION_EMAIL,
    password: process.env.GSOLUTION_PASSWORD,
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  appsScriptUrl: process.env.APPS_SCRIPT_URL,
  searchDelay: 2500,
  batchSize: 10,
};

// ─── SELECTORS (Ant Design based) ──────────────────
const SEL = {
  searchInput: 'input[placeholder="Order ID / Waybill Number / Phone Number"]',
  tableRow: '.ant-table-tbody > tr.ant-table-row',
  statusButton: 'button.btn-status',
  statusText: 'button.btn-status > span:last-child',
  loginEmail: 'input[placeholder*="email" i], input[type="email"], input#email',
  loginPass: 'input[type="password"]',
  loginBtn: 'button[type="submit"], button.ant-btn-primary',
};

// ─── UTILITIES ──────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(icon, msg) {
  const time = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  console.log(`[${time}] ${icon} ${msg}`);
}

// ─── TELEGRAM ───────────────────────────────────────
async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${CONFIG.telegram.token}/sendMessage`;

  // Split long messages (Telegram limit: 4096 chars)
  const chunks = [];
  if (text.length > 4000) {
    let remaining = text;
    while (remaining.length > 0) {
      const chunk = remaining.substring(0, 4000);
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > 3000) {
        chunks.push(remaining.substring(0, lastNewline));
        remaining = remaining.substring(lastNewline + 1);
      } else {
        chunks.push(chunk);
        remaining = remaining.substring(4000);
      }
    }
  } else {
    chunks.push(text);
  }

  for (const chunk of chunks) {
    const payload = {
      chat_id: CONFIG.telegram.chatId,
      text: chunk,
      parse_mode: 'HTML',
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.ok) {
        log('⚠️', `Telegram error: ${data.description}`);
        // Fallback to private chat
        payload.chat_id = '6271188961';
        const res2 = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data2 = await res2.json();
        if (data2.ok) log('✅', 'Telegram sent (private chat fallback)');
        else log('❌', `Telegram fallback failed: ${data2.description}`);
      } else {
        log('✅', 'Telegram message sent');
      }
    } catch (err) {
      log('❌', `Telegram fetch error: ${err.message}`);
    }

    if (chunks.length > 1) await sleep(500);
  }
}

// ─── GOOGLE SHEET (via Apps Script) ─────────────────
async function getOrdersFromSheet() {
  log('📋', 'Đang đọc Google Sheet...');
  const res = await fetch(CONFIG.appsScriptUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const data = await res.json();
  if (data.error) throw new Error(`Sheet error: ${data.error}`);

  log('📋', `Tìm thấy ${data.totalOrders} đơn hàng ngày ${data.today}`);
  return data;
}

async function updateSheetStatuses(updates) {
  if (!updates || updates.length === 0) return;
  log('📝', `Cập nhật ${updates.length} trạng thái vào Sheet...`);

  try {
    const res = await fetch(CONFIG.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    const data = await res.json();
    if (data.error) log('❌', `Sheet update error: ${data.error}`);
    else log('📝', `Đã cập nhật ${data.updatedCount} dòng`);
  } catch (err) {
    log('❌', `Sheet update fetch error: ${err.message}`);
  }
}

// ─── G-SOLUTION: LOGIN ─────────────────────────────
async function loginGSolution(page) {
  log('🔐', 'Đang đăng nhập g-solution.vn...');
  await page.goto(`${CONFIG.gsolution.url}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  // Fill email
  await page.waitForSelector(SEL.loginEmail, { timeout: 10000 });
  await page.click(SEL.loginEmail, { clickCount: 3 });
  await page.type(SEL.loginEmail, CONFIG.gsolution.email, { delay: 30 });

  // Fill password
  await page.waitForSelector(SEL.loginPass, { timeout: 5000 });
  await page.click(SEL.loginPass, { clickCount: 3 });
  await page.type(SEL.loginPass, CONFIG.gsolution.password, { delay: 30 });

  // Click login
  await page.click(SEL.loginBtn);
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await sleep(3000);

  if (page.url().includes('/login')) {
    throw new Error('Đăng nhập thất bại - vẫn ở trang login');
  }
  log('✅', 'Đăng nhập thành công!');
}

// ─── G-SOLUTION: SEARCH & GET STATUS ───────────────
async function searchWaybillStatus(page, waybill) {
  try {
    // Make sure we're on the order page
    if (!page.url().includes('/order')) {
      await page.goto(`${CONFIG.gsolution.url}/order`, { waitUntil: 'networkidle2', timeout: 20000 });
      await sleep(2000);
    }

    // Wait for search input
    await page.waitForSelector(SEL.searchInput, { timeout: 8000 });

    // Clear search and type waybill
    await page.click(SEL.searchInput, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await sleep(200);
    await page.type(SEL.searchInput, waybill, { delay: 20 });
    await page.keyboard.press('Enter');
    await sleep(CONFIG.searchDelay);

    // Wait for table to refresh
    await page.waitForSelector(SEL.tableRow, { timeout: 5000 }).catch(() => null);

    // Extract status from the btn-status button
    const status = await page.evaluate((selectors) => {
      const rows = document.querySelectorAll(selectors.tableRow);
      if (!rows || rows.length === 0) return 'NOT_FOUND';

      // Get the status button from the first row
      const statusBtn = rows[0].querySelector(selectors.statusButton);
      if (statusBtn) {
        // The status text is in the last <span> child of the button
        const spans = statusBtn.querySelectorAll('span');
        for (let i = spans.length - 1; i >= 0; i--) {
          const text = spans[i].textContent.trim();
          // Skip icon spans (they have class 'anticon')
          if (text && !spans[i].classList.contains('anticon') && !spans[i].querySelector('.anticon')) {
            return text;
          }
        }
        return statusBtn.textContent.replace(/[↓↑⬇⬆✓✔☑▼▽]/g, '').trim();
      }

      // Fallback: look for any element with status-related text
      const allCells = rows[0].querySelectorAll('td, .ant-table-cell');
      const statusWords = ['New', 'Pending', 'Confirmed', 'Shipped', 'Delivered',
        'Returning', 'Returned', 'Canceled', 'Cancelled', 'Packing',
        'Printed', 'Wait Print', 'Restocking', 'Need attention',
        'Need confirmation', 'Waiting for pick up', 'Processing'];

      for (const cell of allCells) {
        const t = cell.textContent.trim();
        for (const sw of statusWords) {
          if (t === sw || t.includes(sw)) return sw;
        }
      }

      return 'UNKNOWN';
    }, SEL);

    return status;

  } catch (err) {
    log('⚠️', `Error searching ${waybill}: ${err.message}`);
    return 'ERROR';
  }
}

// ─── REPORT BUILDER ────────────────────────────────
function buildReport(results, today) {
  const statusCount = {};
  let found = 0, notFound = 0, errors = 0;

  for (const r of results) {
    if (r.status === 'NOT_FOUND') { notFound++; continue; }
    if (r.status === 'ERROR' || r.status === 'UNKNOWN') { errors++; continue; }
    found++;
    statusCount[r.status] = (statusCount[r.status] || 0) + 1;
  }

  const emoji = {
    'New': '🆕', 'Pending': '⏳', 'Confirmed': '✅', 'Shipped': '🚚',
    'Delivered': '📬', 'Returned': '↩️', 'Returning': '🔄',
    'Canceled': '🚫', 'Cancelled': '🚫', 'Packing': '📦',
    'Printed': '🖨️', 'Wait Print': '🖨️', 'Restocking': '📥',
    'Need attention': '⚠️', 'Need confirmation': '❓',
    'Waiting for pick up': '🏷️', 'Processing': '⚙️',
  };

  let rpt = `📊 <b>BÁO CÁO ĐƠN HÀNG G-SOLUTION</b>\n`;
  rpt += `📅 Ngày: <b>${today}</b>\n`;
  rpt += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  rpt += `📦 Tổng đơn kiểm tra: <b>${results.length}</b>\n`;
  rpt += `✅ Tìm thấy: <b>${found}</b>\n`;
  rpt += `❌ Không tìm thấy: <b>${notFound}</b>\n`;
  if (errors > 0) rpt += `⚠️ Lỗi: <b>${errors}</b>\n`;

  rpt += `\n📈 <b>THỐNG KÊ TRẠNG THÁI:</b>\n`;
  const sorted = Object.entries(statusCount).sort((a, b) => b[1] - a[1]);
  for (const [st, cnt] of sorted) {
    rpt += `  ${emoji[st] || '📌'} ${st}: <b>${cnt}</b>\n`;
  }

  // Detail list (max 60 items to avoid message limit)
  if (results.length <= 60) {
    rpt += `\n📋 <b>CHI TIẾT:</b>\n`;
    for (const r of results) {
      const e = r.status === 'NOT_FOUND' ? '❌' : r.status === 'ERROR' ? '⚠️' : '✅';
      rpt += `${e} <code>${r.waybill}</code> → ${r.status}\n`;
    }
  }

  rpt += `\n⏰ ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;
  return rpt;
}

// ─── MAIN ───────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('   G-SOLUTION ORDER STATUS CHECKER');
  console.log('   ' + new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));
  console.log('═══════════════════════════════════════════\n');

  // -- Test Telegram mode --
  if (process.argv.includes('--test-telegram')) {
    log('🔔', 'Testing Telegram...');
    await sendTelegram('🔔 <b>Test</b>\nBot G-Solution Checker đang hoạt động! ✅');
    return;
  }

  // -- Validate config --
  if (!CONFIG.appsScriptUrl || CONFIG.appsScriptUrl.includes('PASTE_YOUR')) {
    console.error('❌ Chưa cấu hình APPS_SCRIPT_URL trong file .env');
    console.error('   Xem README.md để biết cách deploy Google Apps Script');
    return;
  }

  // Step 1: Get orders from Google Sheet
  let sheetData;
  try {
    sheetData = await getOrdersFromSheet();
  } catch (err) {
    log('❌', `Lỗi đọc Sheet: ${err.message}`);
    await sendTelegram(`❌ <b>LỖI</b>\nKhông thể đọc Google Sheet:\n${err.message}`);
    return;
  }

  if (sheetData.orders.length === 0) {
    const msg = `📋 Không có đơn hàng nào cho ngày <b>${sheetData.today}</b>`;
    log('📋', msg.replace(/<[^>]+>/g, ''));
    await sendTelegram(msg);
    return;
  }

  // Step 2: Launch browser & login
  log('🌐', 'Khởi động trình duyệt...');
  const browser = await puppeteer.launch({
    headless: false, // false = hiển thị trình duyệt, true = chạy ẩn
    defaultViewport: { width: 1500, height: 850 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1500,900'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  try {
    await loginGSolution(page);

    // Navigate to orders page
    await page.goto(`${CONFIG.gsolution.url}/order`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Step 3: Search each waybill
    const results = [];
    const pendingUpdates = [];

    for (let i = 0; i < sheetData.orders.length; i++) {
      const order = sheetData.orders[i];
      const progress = `[${i + 1}/${sheetData.orders.length}]`;

      log('🔍', `${progress} Tìm kiếm: ${order.waybill}`);
      const status = await searchWaybillStatus(page, order.waybill);
      log(status === 'NOT_FOUND' ? '❌' : '✅', `${progress} ${order.waybill} → ${status}`);

      results.push({ waybill: order.waybill, row: order.row, status });
      pendingUpdates.push({ row: order.row, status });

      // Batch update every N orders
      if (pendingUpdates.length >= CONFIG.batchSize) {
        await updateSheetStatuses([...pendingUpdates]);
        pendingUpdates.length = 0;
      }

      await sleep(300);
    }

    // Update remaining orders
    if (pendingUpdates.length > 0) {
      await updateSheetStatuses(pendingUpdates);
    }

    // Step 4: Build & send report
    log('📊', 'Tạo báo cáo...');
    const report = buildReport(results, sheetData.today);

    // Print to console (strip HTML)
    console.log('\n' + report.replace(/<[^>]+>/g, '') + '\n');

    // Send to Telegram
    await sendTelegram(report);

    log('✅', 'HOÀN TẤT!');

  } catch (err) {
    log('❌', `Lỗi: ${err.message}`);
    await sendTelegram(`❌ <b>LỖI SCRIPT</b>\n${err.message}`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
