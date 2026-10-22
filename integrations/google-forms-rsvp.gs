/** Bind this script to the existing Google Form; run setupRsvp() once as owner.
 * Deploy as Web App: execute as owner, access Anyone. Set config.rsvpEndpoint.
 * No credentials or Form edit IDs belong in the public invitation repository.
 */
function rsvpFields_(form) {
  var definitions = [
    {key: 'guestName', titles: ['姓名'], type: FormApp.ItemType.TEXT},
    {key: 'attending', titles: ['是否參加', '是否出席'], type: FormApp.ItemType.MULTIPLE_CHOICE},
    {key: 'guestCount', titles: ['出席人數'], type: FormApp.ItemType.TEXT},
    {key: 'childSeats', titles: ['兒童座椅', '兒童椅'], type: FormApp.ItemType.TEXT},
    {key: 'vegetarian', titles: ['是否素食'], type: FormApp.ItemType.MULTIPLE_CHOICE},
    {key: 'message', titles: ['給新人的話'], type: FormApp.ItemType.PARAGRAPH_TEXT}
  ];
  var items = form.getItems();
  return definitions.map(function(definition) {
    var matches = items.filter(function(item) { return definition.titles.indexOf(item.getTitle().trim()) !== -1; });
    if (matches.length !== 1 || matches[0].getType() !== definition.type) throw new Error('請核對表單欄位：' + definition.titles[0]);
    return {key: definition.key, item: matches[0], type: definition.type};
  });
}
function setupRsvp() {
  var form = FormApp.getActiveForm();
  if (!form) throw new Error('請從原 Google 表單開啟綁定的 Apps Script，再執行此函式。');
  rsvpFields_(form);
  PropertiesService.getScriptProperties().setProperty('RSVP_FORM_ID', form.getId());
  console.log('設定完成。請部署為網頁應用程式，執行身分選擇自己，存取權選擇任何人。');
}
function validateRsvp_(data) {
  if (!data || typeof data !== 'object' || typeof data.attending !== 'boolean') throw new Error('回覆資料有誤。');
  if (typeof data.requestId !== 'string' || !/^[A-Za-z0-9-]{10,80}$/.test(data.requestId)) throw new Error('回覆識別碼有誤。');
  if (typeof data.guestName !== 'string' || !data.guestName.trim() || data.guestName.length > 80) throw new Error('請填寫姓名。');
  var count = data.attending ? data.guestCount : 0;
  var veg = data.attending ? data.vegetarianCount : 0;
  var seats = data.attending ? data.childSeats : 0;
  if (!Number.isInteger(count) || count < (data.attending ? 1 : 0) || count > 4 ||
      !Number.isInteger(veg) || veg < 0 || veg > count ||
      !Number.isInteger(seats) || seats < 0 || seats > Math.min(2, count)) throw new Error('請確認出席、素食與兒童椅數量。');
  if (typeof data.message !== 'string' || data.message.length > 2000 || typeof data.dietNotes !== 'string' || data.dietNotes.length > 300) throw new Error('留言或飲食備註過長。');
  var extra = data.attending ? ['素食人數：' + veg + ' 位'] : [];
  if (data.attending && data.dietNotes) extra.push('飲食備註：' + data.dietNotes);
  return {
    guestName: data.guestName.trim(), attending: data.attending ? '是' : '否',
    guestCount: String(count), childSeats: String(seats), vegetarian: veg > 0 ? '是' : '否',
    message: [data.message, extra.length ? '【用餐補充】\n' + extra.join('\n') : ''].filter(Boolean).join('\n\n')
  };
}
function rsvpJson_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  var lock = LockService.getScriptLock(), locked = false;
  try {
    var data = JSON.parse(e.postData.contents);
    var values = validateRsvp_(data);
    lock.waitLock(20000); locked = true;
    var properties = PropertiesService.getScriptProperties();
    var formId = properties.getProperty('RSVP_FORM_ID');
    if (!formId) throw new Error('請先執行 setupRsvp。');
    // Retries of an identical request must not add duplicate responses.
    var key = 'rsvp_' + data.requestId;
    var fingerprint = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(values)));
    var saved = properties.getProperty(key);
    if (saved) {
      var previous = JSON.parse(saved);
      if (previous.fingerprint !== fingerprint) throw new Error('請更新回覆後重新送出。');
      return rsvpJson_({ok: true, receipt: previous.receipt});
    }
    var form = FormApp.openById(formId);
    if (!form.isAcceptingResponses()) throw new Error('回覆已截止，請直接聯絡新人。');
    var fields = rsvpFields_(form);
    var response = form.createResponse();
    fields.forEach(function(field) {
      var value = values[field.key], itemResponse;
      if (field.type === FormApp.ItemType.TEXT) itemResponse = field.item.asTextItem().createResponse(value);
      else if (field.type === FormApp.ItemType.PARAGRAPH_TEXT) itemResponse = field.item.asParagraphTextItem().createResponse(value);
      else itemResponse = field.item.asMultipleChoiceItem().createResponse(value);
      response.withItemResponse(itemResponse);
    });
    var submitted = response.submit();
    var receipt = submitted.getId();
    if (!receipt) throw new Error('未能確認存檔，請聯絡新人。');
    properties.setProperty(key, JSON.stringify({fingerprint: fingerprint, receipt: receipt}));
    return rsvpJson_({ok: true, receipt: receipt});
  } catch (error) {
    console.error(error);
    return rsvpJson_({ok: false, error: '目前無法確認收件，請聯絡新人或稍後再試。'});
  } finally { if (locked) lock.releaseLock(); }
}
