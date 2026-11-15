const SHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';
const DATA_SHEET = 'TimetableData';
const PROPERTY_KEY = 'VTA_ADMIN_KEY';

function doGet() {
  try {
    const sheet = getDataSheet_();
    const raw = sheet.getRange('A1').getValue();
    const data = raw ? JSON.parse(raw) : emptyData_();
    return json_(data);
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty(PROPERTY_KEY);
    if (!expected || body.key !== expected) return json_({ ok: false, error: 'Unauthorized' });
    if (!body.data || !Array.isArray(body.data.courses) ||
        !Array.isArray(body.data.lectures) || !Array.isArray(body.data.holidays)) {
      return json_({ ok: false, error: 'Invalid timetable data' });
    }
    const data = {
      timezone: 'Asia/Kolkata',
      courses: body.data.courses,
      lectures: body.data.lectures,
      holidays: body.data.holidays
    };
    getDataSheet_().getRange('A1').setValue(JSON.stringify(data));
    return json_({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function getDataSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(DATA_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET);
    sheet.getRange('A1').setValue(JSON.stringify(emptyData_()));
    sheet.getRange('A2').setValue('The timetable JSON is stored in A1. Do not edit A1 manually.');
    sheet.hideSheet();
  }
  return sheet;
}

function emptyData_() {
  return { timezone: 'Asia/Kolkata', courses: [], lectures: [], holidays: [] };
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run this once from the Apps Script editor after setting SHEET_ID.
// It creates the data tab and a random admin key in Script Properties.
// Copy the key from the execution log and keep it private.
function initialiseVTA() {
  getDataSheet_();
  const key = Utilities.getUuid() + '-' + Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty(PROPERTY_KEY, key);
  Logger.log('VTA_ADMIN_KEY: ' + key);
}
