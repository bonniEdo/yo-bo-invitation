/* Standalone Apps Script. This creates a separate survey spreadsheet, never
 * writes to the final wedding RSVP, and counts households for wedding cakes. */
function setupSurvey() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('SURVEY_SHEET_ID')) {
    console.log(SpreadsheetApp.openById(props.getProperty('SURVEY_SHEET_ID')).getUrl());
    return;
  }
  var book = SpreadsheetApp.create('鑫佑與宛瑩｜出席意願與喜餅調查');
  var sheet = book.getSheets()[0];
  sheet.setName('意願回覆');
  sheet.appendRow(['收到時間','回覆編號','姓名','出席意願','預估人數','喜餅需求','喜餅份數','聯絡方式','留言']);
  sheet.setFrozenRows(1);
  var summary = book.insertSheet('統計');
  summary.getRange('A1:B8').setValues([
    ['項目','目前估計（非最終出席）'],
    ['應該可以出席的人數', '=SUMIF(\'意願回覆\'!D2:D,"yes",\'意願回覆\'!E2:E)'],
    ['還不確定的人數', '=SUMIF(\'意願回覆\'!D2:D,"maybe",\'意願回覆\'!E2:E)'],
    ['需要喜餅（每戶／組一份）', '=SUM(\'意願回覆\'!G2:G)'],
    ['喜餅尚未確定（戶／組）', '=COUNTIF(\'意願回覆\'!F2:F,"maybe")'],
    ['每桌人數（可自行調整）',10],
    ['估計桌數（應該可以出席）','=ROUNDUP(B2/B6,0)'],
    ['含未確定的桌數上限','=ROUNDUP((B2+B3)/B6,0)']
  ]);
  summary.setColumnWidth(1,260); summary.setColumnWidth(2,240);
  props.setProperty('SURVEY_SHEET_ID',book.getId());
  console.log(book.getUrl());
}
function doPost(event) {
  var lock = LockService.getScriptLock();
  try {
    var raw = event && event.postData && event.postData.contents;
    if (!raw || raw.length > 6000) throw new Error('Invalid request');
    var record = JSON.parse(raw);
    if (record.type !== 'attendance-survey' || !/^[\w-]{10,100}$/.test(record.requestId || '')) throw new Error('Invalid request');
    if (['yes','maybe','no'].indexOf(record.attendance) < 0 || ['yes','maybe','no'].indexOf(record.cake) < 0) throw new Error('Invalid choices');
    if (!Number.isInteger(record.guestCount) || record.guestCount < (record.attendance === 'no' ? 0 : 1) || record.guestCount > 4 || (record.attendance === 'no' && record.guestCount !== 0)) throw new Error('Invalid count');
    if (typeof record.guestName !== 'string' || !record.guestName.trim() || record.guestName.length > 80 || typeof record.contact !== 'string' || record.contact.length > 120 || typeof record.message !== 'string' || record.message.length > 500) throw new Error('Invalid text');
    var id = PropertiesService.getScriptProperties().getProperty('SURVEY_SHEET_ID');
    if (!id) throw new Error('Survey not configured');
    lock.waitLock(10000);
    var sheet = SpreadsheetApp.openById(id).getSheetByName('意願回覆');
    var existing = sheet.getLastRow() > 1 ? sheet.getRange(2,2,sheet.getLastRow()-1,1).createTextFinder(record.requestId).matchEntireCell(true).findNext() : null;
    if (!existing) {
      sheet.appendRow([new Date(), record.requestId, surveyText_(record.guestName), record.attendance, record.guestCount, record.cake, record.cake === 'yes' ? 1 : 0, surveyText_(record.contact), surveyText_(record.message)]);
      SpreadsheetApp.flush();
    }
    return surveyJSON_({ok:true,receipt:record.requestId});
  } catch(error) { return surveyJSON_({ok:false,error:'無法儲存回覆，請稍後再試。'}); }
  finally { if(lock.hasLock()) lock.releaseLock(); }
}
function surveyText_(text) { text = text.trim(); return /^[=+@-]/.test(text) ? "'" + text : text; }
function surveyJSON_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
