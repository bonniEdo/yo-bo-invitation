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
html = html.replace('src="assets/walker-bonnie.jpg"', 'src="../assets/walker-bonnie.jpg"')
html = html.replace('?v=2', '?v=' + version)
(output / 'index.html').write_text(html)
css = (source / 'assets/survey.css').read_text().replace("url('fonts/", "url('../../assets/fonts/")
(output / 'assets/survey.css').write_text(css)
for item in ['survey-config.js', 'assets/survey.js']:
    (output / item).write_bytes((source / item).read_bytes())
print('Exported preview to', output)
