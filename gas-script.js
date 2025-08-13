// Google Apps Script for KomoMood Data Collection with GitHub Auto-Sync
// Replace SHEET_ID, SHEET_NAME, and GITHUB_TOKEN accordingly
const SHEET_ID = '1E2xzJoxc2K2itz0-5uFKpbhmYM3vNyrtu3nopCVL2hY';
const SHEET_NAME = 'Form Responses 1';
// const ALLOW_ORIGIN = 'https://ktwu01.github.io'

// GitHub API configuration for auto-triggering sync
const GITHUB_REPO = 'ktwu01/komomood';
const GITHUB_WORKFLOW_FILE = 'sync-form.yml';

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

    var passOk = pass === '317';
    if (!date || !koko || !momo || !komo) return json_({ ok: false, error: 'invalid_payload' }, cb);
    if (!passOk) return json_({ ok: false, error: 'invalid_passphrase' }, cb);

    var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActive();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    
    // FIXED: Correct column order to match Google Sheets structure
    // Order: Timestamp, date, kokoMood, momoMood, komoScore, note, passphrase
    sh.appendRow([new Date(), date, koko, momo, komo, note, pass]);
    
    // NEW: Trigger GitHub Actions sync immediately after successful data entry
    try {
      triggerGitHubSync_();
      console.log('GitHub sync triggered successfully');
    } catch (syncError) {
      console.log('GitHub sync failed:', syncError);
      // Don't fail the main request if GitHub sync fails
    }
    
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

/**
 * Trigger GitHub Actions workflow to sync data immediately after form submission
 * Requires GITHUB_TOKEN to be set in Script Properties
 */
function triggerGitHubSync_() {
  // Get GitHub token from Script Properties (set this manually in GAS editor)
  var githubToken = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  
  if (!githubToken) {
    console.log('GITHUB_TOKEN not set in Script Properties, skipping auto-sync');
    return;
  }
  
  var url = 'https://api.github.com/repos/' + GITHUB_REPO + '/actions/workflows/' + GITHUB_WORKFLOW_FILE + '/dispatches';
  
  var payload = {
    'ref': 'main'
  };
  
  var options = {
    'method': 'POST',
    'headers': {
      'Authorization': 'Bearer ' + githubToken,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'KomoMood-GAS-Auto-Sync'
    },
    'payload': JSON.stringify(payload)
  };
  
  var response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() === 204) {
    console.log('GitHub workflow triggered successfully');
  } else {
    console.log('GitHub API response:', response.getResponseCode(), response.getContentText());
    throw new Error('Failed to trigger GitHub workflow: ' + response.getResponseCode());
  }
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
