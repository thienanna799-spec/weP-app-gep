// ============================================================
// Google Apps Script - Copy toàn bộ code này vào Apps Script
// ============================================================
// Sheet ID & GID
const SHEET_ID = '199Ni378nqbaj5sjqRuD5z5RAcx1goAejHe8Jb7_AMc0';
const SHEET_GID = 1468560973;

function getTargetSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheets = ss.getSheets();
  for (const s of sheets) {
    if (s.getSheetId() === SHEET_GID) return s;
  }
  return null;
}

function doGet(e) {
  try {
    const sheet = getTargetSheet();
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const today = new Date();
    const todayStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd/MM/yyyy');

    const orders = [];
    for (let i = 2; i < data.length; i++) { // Skip header rows (row 1-2), divider (row 3)
      const dateCell = data[i][0]; // Column A
      let dateCellStr = '';

      if (dateCell instanceof Date) {
        dateCellStr = Utilities.formatDate(dateCell, Session.getScriptTimeZone(), 'dd/MM/yyyy');
      } else if (dateCell) {
        dateCellStr = String(dateCell).trim();
      }

      if (dateCellStr !== todayStr) continue;

      const waybill = String(data[i][1] || '').trim(); // Column B
      if (!waybill) continue; // Skip empty waybill rows

      orders.push({
        row: i + 1, // 1-indexed row number
        date: dateCellStr,
        waybill: waybill,
        currentStatus: String(data[i][2] || '').trim() // Column C
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      today: todayStr,
      totalOrders: orders.length,
      orders: orders
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = getTargetSheet();
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const updates = payload.updates || [];
    let updatedCount = 0;

    for (const update of updates) {
      if (update.row && update.status) {
        sheet.getRange(update.row, 3).setValue(update.status); // Column C
        updatedCount++;
      }
    }

    SpreadsheetApp.flush(); // Force write

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      updatedCount: updatedCount
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
