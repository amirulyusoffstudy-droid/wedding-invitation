/**
 * Guestbook adapter for the Google Sheet linked to the wedding wishes form.
 * Paste this entire file into either a spreadsheet-bound or standalone Apps
 * Script project. For a standalone project, set SPREADSHEET_ID_OR_URL below.
 */

const SPREADSHEET_ID_OR_URL = "PASTE_RESPONSE_SPREADSHEET_ID_OR_URL_HERE";

function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function getResponseSheet_() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const configuredValue = String(SPREADSHEET_ID_OR_URL || "").trim();
  const hasConfiguredValue = configuredValue
    && configuredValue !== "PASTE_RESPONSE_SPREADSHEET_ID_OR_URL_HERE";
  const spreadsheet = activeSpreadsheet || (hasConfiguredValue
    ? configuredValue.startsWith("https://")
      ? SpreadsheetApp.openByUrl(configuredValue)
      : SpreadsheetApp.openById(configuredValue)
    : null);
  if (!spreadsheet) {
    throw new Error("Tetapkan SPREADSHEET_ID_OR_URL untuk Google Sheet respons.");
  }
  const sheet = spreadsheet.getSheets().find((candidate) => {
    const headers = candidate.getRange(1, 1, 1, candidate.getLastColumn()).getDisplayValues()[0]
      .map(normalizeHeader_);
    return headers.includes("nama") && headers.includes("ucapan");
  });
  if (!sheet) throw new Error('Tiada tab dengan lajur "Nama" dan "Ucapan" ditemui.');
  return sheet;
}

function getHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(normalizeHeader_);
}

function findHeader_(headers, name) {
  return headers.indexOf(normalizeHeader_(name));
}

function isResponseRow_(row, nameIndex, messageIndex) {
  return Boolean(cleanSingleLine_(row[nameIndex], 80) || cleanMessage_(row[messageIndex]));
}

function getResponseIndexes_(sheet) {
  const headers = getHeaders_(sheet);
  const nameIndex = findHeader_(headers, "Nama");
  const messageIndex = findHeader_(headers, "Ucapan");
  if (nameIndex === -1 || messageIndex === -1) {
    throw new Error("Lajur Nama atau Ucapan tidak ditemui.");
  }
  return { headers, nameIndex, messageIndex };
}

function getNextResponseRow_(sheet, nameIndex, messageIndex) {
  const dataRowCount = Math.max(sheet.getLastRow() - 1, 1);
  const rows = sheet.getRange(2, 1, dataRowCount, sheet.getLastColumn()).getValues();
  let lastResponseRow = 1;
  rows.forEach((row, index) => {
    if (isResponseRow_(row, nameIndex, messageIndex)) lastResponseRow = index + 2;
  });
  return lastResponseRow + 1;
}

function cleanSingleLine_(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanMessage_(value) {
  return String(value || "").replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, 500);
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  const sheet = getResponseSheet_();
  const approvedIndex = findHeader_(getHeaders_(sheet), "Approved");
  if (approvedIndex !== -1) sheet.deleteColumn(approvedIndex + 1);

  const { nameIndex, messageIndex } = getResponseIndexes_(sheet);
  const dataRowCount = Math.max(sheet.getMaxRows() - 1, 1);
  const dataRange = sheet.getRange(2, 1, dataRowCount, sheet.getLastColumn());
  const responseRows = dataRange.getValues()
    .filter((row) => isResponseRow_(row, nameIndex, messageIndex));

  dataRange.clearContent();
  if (responseRows.length) {
    sheet.getRange(2, 1, responseRows.length, sheet.getLastColumn()).setValues(responseRows);
  }
}

function doGet() {
  try {
    const sheet = getResponseSheet_();
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return json_({ success: true, data: [] });

    const { headers, nameIndex, messageIndex } = getResponseIndexes_(sheet);
    const relationshipIndex = findHeader_(headers, "Hubungan dengan pengantin");

    const wishes = values.slice(1).map((row, index) => ({ row, rowNumber: index + 2 }))
      .slice(-50)
      .reverse()
      .map(({ row, rowNumber }) => ({
        id: `wish-${rowNumber}`,
        name: cleanSingleLine_(row[nameIndex], 80),
        message: cleanMessage_(row[messageIndex]),
        relationship: relationshipIndex === -1 ? "" : cleanSingleLine_(row[relationshipIndex], 80),
        createdAt: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || ""),
      }))
      .filter((wish) => wish.name && wish.message);

    return json_({ success: true, data: wishes });
  } catch (error) {
    return json_({ success: false, error: String(error.message || error) });
  }
}

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const name = cleanSingleLine_(payload.name, 80);
    const message = cleanMessage_(payload.message);
    const relationship = cleanSingleLine_(payload.relationship, 80);
    if (!name || !message) throw new Error("Nama dan ucapan diperlukan.");

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getResponseSheet_();
      const { headers, nameIndex, messageIndex } = getResponseIndexes_(sheet);
      const row = new Array(headers.length).fill("");
      const relationshipIndex = findHeader_(headers, "Hubungan dengan pengantin");
      row[0] = new Date();
      row[nameIndex] = name;
      row[messageIndex] = message;
      if (relationshipIndex !== -1) row[relationshipIndex] = relationship;
      const rowNumber = getNextResponseRow_(sheet, nameIndex, messageIndex);
      if (rowNumber > sheet.getMaxRows()) sheet.insertRowAfter(sheet.getMaxRows());
      sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
      return json_({
        success: true,
        data: {
          id: `wish-${rowNumber}`,
          name,
          message,
          relationship,
          createdAt: new Date().toISOString(),
        },
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json_({ success: false, error: String(error.message || error) });
  }
}
