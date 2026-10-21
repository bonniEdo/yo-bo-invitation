// Run after changing event details in config.js: node scripts/generate-calendar.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'config.js'), 'utf8'), sandbox);
const config = sandbox.window.WEDDING_CONFIG.INVITATION;
const stamp = time => new Date(`${config.date}T${time}:00+08:00`).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = text => String(text).replaceAll('\\', '\\\\').replace(/\r\n|\r|\n/g, '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
function fold(line) {
  let result = '', length = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (length + size > 73) { result += '\r\n '; length = 1; }
    result += char; length += size;
  }
  return result;
}
const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Walker and Bonnie//Wedding//ZH-TW', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
  `UID:wedding-${config.date}-walker-bonnie@invitation`,
  `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
  `DTSTART:${stamp(config.welcomeTime)}`, `DTEND:${stamp(config.endTime)}`,
  `SUMMARY:${escape(`${config.coupleNames} 的婚禮`)}`,
  `LOCATION:${escape([config.venueName, config.venueRoom, config.venueAddress].filter(Boolean).join(' '))}`,
  `DESCRIPTION:${escape(`${config.welcomeTime} 入座，${config.banquetTime} 開席。期待與你分享幸福！${config.mapsUrl ? '\n交通導航：' + config.mapsUrl : ''}`)}`,
  'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT', 'END:VCALENDAR', ''];
fs.writeFileSync(path.join(root, 'assets/wedding-invitation.ics'), lines.map(fold).join('\r\n'));
console.log('Generated assets/wedding-invitation.ics');
