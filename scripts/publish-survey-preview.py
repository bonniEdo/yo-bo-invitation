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
files = ['index.html', 'survey-config.js', 'assets/survey.css', 'assets/survey-type-size.css', 'assets/survey.js', 'assets/survey-snow-couple.jpg', 'assets/wedding-fonts.css', 'assets/fonts/Autery.otf', 'assets/fonts/Autery-LICENSE.txt']
version = hashlib.sha256(b''.join((source / item).read_bytes() for item in files)).hexdigest()[:12]
html = (source / 'index.html').read_text()
html = html.replace('<meta name="theme-color"', '<meta name="robots" content="noindex,nofollow"><meta name="theme-color"')
html = html.replace('?v=3', '?v=' + version)
(output / 'index.html').write_text(html)
css = (source / 'assets/survey.css').read_text().replace("url('fonts/", "url('../../assets/fonts/")
(output / 'assets/survey.css').write_text(css)
font_css = (source / 'assets/wedding-fonts.css').read_text().replace("url('fonts/", "url('../../assets/fonts/")
(output / 'assets/wedding-fonts.css').write_text(font_css)
(target / 'assets/fonts').mkdir(parents=True, exist_ok=True)
for name in ['Autery.otf', 'Autery-LICENSE.txt']:
    (target / 'assets/fonts' / name).write_bytes((source / 'assets/fonts' / name).read_bytes())
for item in ['survey-config.js', 'assets/survey-type-size.css', 'assets/survey.js', 'assets/survey-snow-couple.jpg']:
    (output / item).write_bytes((source / item).read_bytes())
print('Exported preview to', output)
