from pathlib import Path
import base64, hashlib

root = Path('.')
tmp = root / 'tmp' / 'pathology-anki'
parts = [tmp / f'part{i:02d}.txt' for i in range(1, 9)]
b64 = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
deck = base64.b64decode(b64, validate=True)
expected_sha = 'fb0b163bf684faf678e7f4100040e990094944e30f5cc2a5fadc7b5724e8ae56'
if len(deck) != 35165 or hashlib.sha256(deck).hexdigest() != expected_sha or not deck.startswith(b'PK'):
    raise SystemExit(f'Deck validation failed: size={len(deck)} sha={hashlib.sha256(deck).hexdigest()}')

download_dir = root / 'weeks' / 'pathology-hub' / 'downloads'
download_dir.mkdir(parents=True, exist_ok=True)
(download_dir / 'Pathology_Anki_210_Cards.apkg').write_bytes(deck)

index = root / 'weeks' / 'pathology-hub' / 'index.html'
text = index.read_text(encoding='utf-8')

css_anchor = '.stats{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px} .stat{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:9px 12px;font-weight:800;font-size:13px}'
css_add = css_anchor + '''\n.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:13px}\n.anki-download{display:inline-flex;align-items:center;gap:9px;text-decoration:none;background:#fffaf5;color:var(--brown2);border:1px solid rgba(255,255,255,.7);border-radius:12px;padding:10px 13px;font-size:12px;font-weight:900;box-shadow:0 8px 20px rgba(31,19,13,.12);transition:transform .15s ease,filter .15s ease}\n.anki-download:hover{transform:translateY(-1px);filter:brightness(.98)}\n.anki-download span{font-size:10px;font-weight:900;padding:4px 7px;border-radius:999px;background:var(--tan);color:var(--brown)}'''
if '.anki-download{' not in text:
    if css_anchor not in text:
        raise SystemExit('CSS anchor not found')
    text = text.replace(css_anchor, css_add, 1)

hero_anchor = ' <div class="stats"><div class="stat">105 conditions</div><div class="stat">Foundations Weeks 3–10</div><div class="stat">100 validated questions</div></div></div>'
hero_add = ' <div class="stats"><div class="stat">105 conditions</div><div class="stat">Foundations Weeks 3–10</div><div class="stat">100 validated questions</div></div>\n <div class="hero-actions"><a class="anki-download" href="downloads/Pathology_Anki_210_Cards.apkg" download aria-label="Download the 210-card Foundations Pathology Anki deck">↓ Download Anki Deck <span>210 cards</span></a></div></div>'
if 'Download Anki Deck' not in text:
    if hero_anchor not in text:
        raise SystemExit('Hero anchor not found')
    text = text.replace(hero_anchor, hero_add, 1)

if text.count('Download Anki Deck') != 1:
    raise SystemExit('Unexpected Anki download button count')
index.write_text(text, encoding='utf-8')
print('Validated and built 210-card APKG; patched Pathology Hub hero button.')
