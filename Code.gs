/**
 * Code.gs — Google Apps Script Backend
 * OBR & Voucher Tracker — PRMSU Budget Office
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file replacing the default code
 * 3. Replace SHEET_ID below with your Google Sheet ID
 * 4. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL and paste it into js/api.js → API_URL
 */

const SHEET_ID   = 'YOUR_GOOGLE_SHEET_ID_HERE'; // ← Replace this
const SHEET_NAME = 'Records';

// ─── Column order (must match getHeaders()) ───────────────────
function getHeaders() {
  return [
    'id', 'createdAt', 'year', 'date', 'dateIn', 'timeIn',
    'obrNo', 'payee', 'amount', 'chargeTo', 'receivedBy',
    'particulars', 'dateReleased', 'timeOut', 'dvNo',
    'dvPayee', 'dvAmount', 'dvCharge', 'dvParticulars',
    'oupReceived', 'oupDate', 'oupTime', 'receivedInitial',
    'action', 'location',
  ];
}

// ─── CORS Helper ──────────────────────────────────────────────
function corsResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ─── GET Handler ──────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getAll') {
      return corsResponse({ ok: true, data: getAllRecords() });
    }
    if (action === 'getOne') {
      const record = getRecord(e.parameter.id);
      return corsResponse({ ok: true, data: record });
    }

    return corsResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return corsResponse({ ok: false, error: err.message });
  }
}

// ─── POST Handler ─────────────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action  = payload.action;

    if (action === 'insert') {
      const result = insertRecord(payload.record);
      return corsResponse({ ok: true, data: result });
    }
    if (action === 'update') {
      const result = updateRecord(payload.record);
      return corsResponse({ ok: true, data: result });
    }
    if (action === 'delete') {
      deleteRecord(payload.id);
      return corsResponse({ ok: true });
    }

    return corsResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return corsResponse({ ok: false, error: err.message });
  }
}

// ─── Sheet Access ─────────────────────────────────────────────
function getSheet() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  // Auto-create sheet with headers if missing
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(getHeaders());
    sheet.setFrozenRows(1);

    // Style the header row
    const headerRange = sheet.getRange(1, 1, 1, getHeaders().length);
    headerRange.setBackground('#0d1117');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
  }
  return sheet;
}

// ─── CRUD Operations ──────────────────────────────────────────

/** Return all records as array of objects */
function getAllRecords() {
  const sheet  = getSheet();
  const data   = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Header only

  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

/** Return a single record by id */
function getRecord(id) {
  const sheet   = getSheet();
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      const obj = {};
      headers.forEach((h, j) => { obj[h] = data[i][j]; });
      return obj;
    }
  }
  return null;
}

/** Insert a new record row */
function insertRecord(record) {
  const sheet   = getSheet();
  const headers = getHeaders();
  const row     = headers.map(h => record[h] !== undefined ? record[h] : '');
  sheet.appendRow(row);
  return record;
}

/** Update an existing record by matching id */
function updateRecord(record) {
  const sheet   = getSheet();
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === record.id) {
      const row = headers.map(h => record[h] !== undefined ? record[h] : '');
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return record;
    }
  }
  throw new Error('Record not found: ' + record.id);
}

/** Delete a record by id */
function deleteRecord(id) {
  const sheet   = getSheet();
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw new Error('Record not found: ' + id);
}
