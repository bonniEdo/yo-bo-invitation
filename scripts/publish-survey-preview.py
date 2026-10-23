#!/usr/bin/env python3
"""Export this branch's survey into a main checkout's survey-preview/ directory."""
import argparse
import hashlib
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--target', type=Path, required=True, help='Separate checkout of the main Pages branch')
args = parser.parse_args()
source = Path(__file__).resolve().parents[1]
target = args.target.resolve()
if target == source or not (target / '.git').exists():
    parser.error('Use a separate git checkout of main as --target.')
output = target / 'survey-preview'
(output / 'assets').mkdir(parents=True, exist_ok=True)
files = ['index.html', 'survey-config.js', 'assets/survey.css', 'assets/survey.js']
version = hashlib.sha256(b''.join((source / item).read_bytes() for item in files)).hexdigest()[:12]
html = (source / 'index.html').read_text()
html = html.replace('<meta name="theme-color"', '<meta name="robots" content="noindex,nofollow"><meta name="theme-color"')
html = html.replace('src="assets/story-confetti.png"', 'src="../assets/story-confetti.png"')
html = html.replace('?v=1', '?v=' + version)
# Let reviewers inspect the whole form without implying that collection is live.
if "endpoint: ''" in (source / 'survey-config.js').read_text():
    html = html.replace('<p id="form-status" class="status" role="status" tabindex="-1"></p>', '<p id="form-status" class="status" role="status" tabindex="-1">設計預覽，目前尚未開放收件。</p>')
    html = html.replace('id="submit-button" class="button primary submit" type="submit"', 'id="submit-button" class="button primary submit" type="submit" disabled')
    html = html.replace('送出我的意願 <span aria-hidden="true">♡</span>', '調查即將開放 <span aria-hidden="true">♡</span>')
(output / 'index.html').write_text(html)
css = (source / 'assets/survey.css').read_text().replace("url('fonts/", "url('../../assets/fonts/")
(output / 'assets/survey.css').write_text(css)
for item in ['survey-config.js', 'assets/survey.js']:
    (output / item).write_bytes((source / item).read_bytes())
print('Exported preview to', output)
