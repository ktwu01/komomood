// Google Apps Script for KomoMood Data Collection
// Replace SHEET_ID and SHEET_NAME accordingly
const SHEET_ID = '1E2xzJoxc2K2itz0-5uFKpbhmYM3vNyrtu3nopCVL2hY';
const SHEET_NAME = 'Form Responses 1';
// const ALLOW_ORIGIN = 'https://ktwu01.github.io'

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) { 
  return handleRequest_(e); 
}

function handleRequest_(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var date = String(params.date || '').slice(0, 10);
    var koko = clamp_(params.kokoMood);
    var momo = clamp_(params.momoMood);
    var komo = clamp_(params.komoScore);
    var note = String(params.note || '');
    var pass = String(params.passphrase || '').trim();
    var cb = params.callback;

    var passOk = pass === '0317';
    if (!date || !koko || !momo || !komo) return json_({ ok: false, error: 'invalid_payload' }, cb);
    if (!passOk) return json_({ ok: false, error: 'invalid_passphrase' }, cb);

    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActive();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    
    // FIXED: Correct column order to match Google Sheets structure
    // Order: Timestamp, date, kokoMood, momoMood, komoScore, note, passphrase
    sh.appendRow([new Date(), date, koko, momo, komo, note, pass]);
    
    return json_({ ok: true }, cb);
  } catch (err) {
    return json_({ ok: false, error: String(err) }, (e && e.parameter && e.parameter.callback));
  }
}

function clamp_(n) {
  n = Number(n);
  if (!isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.trunc(n)));
}

function json_(obj, callbackName) {
  var out = JSON.stringify(obj);
  if (callbackName) {
    return ContentService
      .createTextOutput(callbackName + '(' + out + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(out)
    .setMimeType(ContentService.MimeType.JSON);
}
