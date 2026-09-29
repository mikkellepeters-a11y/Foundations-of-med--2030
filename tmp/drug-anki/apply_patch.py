from pathlib import Path

path = Path('weeks/drug-hub/index.html')
s = path.read_text(encoding='utf-8')

css_old = ".stats{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px} .stat{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:9px 12px;font-weight:800;font-size:13px}\nmain{padding:26px 22px 70px}"
css_new = ".stats{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px} .stat{background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:9px 12px;font-weight:800;font-size:13px}\n.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:13px}\n.anki-download{display:inline-flex;align-items:center;gap:9px;text-decoration:none;background:#fffaf5;color:var(--brown2);border:1px solid rgba(255,255,255,.7);border-radius:12px;padding:10px 13px;font-size:12px;font-weight:900;box-shadow:0 8px 20px rgba(31,19,13,.12);transition:transform .15s ease,filter .15s ease}\n.anki-download:hover{transform:translateY(-1px);filter:brightness(.98)}\n.anki-download span{font-size:10px;font-weight:900;padding:4px 7px;border-radius:999px;background:var(--tan);color:var(--brown)}\nmain{padding:26px 22px 70px}"

html_old = "  <div class=\"hero-note\"><span class=\"tiny-pill\" aria-hidden=\"true\"></span> Mascot on duty: <b>Maisy</b> · <span style=\"opacity:.9\">Ozzy may stop by sometimes</span></div>\n\n  </div>"
html_new = "  <div class=\"hero-note\"><span class=\"tiny-pill\" aria-hidden=\"true\"></span> Mascot on duty: <b>Maisy</b> · <span style=\"opacity:.9\">Ozzy may stop by sometimes</span></div>\n  <div class=\"hero-actions\"><a class=\"anki-download\" href=\"downloads/Foundations_Pharmacology_Use_First_95.apkg\" download>Download Anki Deck <span>95 cards</span></a></div>\n\n  </div>"

if 'downloads/Foundations_Pharmacology_Use_First_95.apkg' in s:
    raise SystemExit('Anki download button already present; refusing duplicate patch')
if css_old not in s:
    raise SystemExit('CSS anchor not found')
if html_old not in s:
    raise SystemExit('Hero anchor not found')

s = s.replace(css_old, css_new, 1).replace(html_old, html_new, 1)

if s.count('downloads/Foundations_Pharmacology_Use_First_95.apkg') != 1:
    raise SystemExit('Download link QA failed')
if s.count('.anki-download{') != 1:
    raise SystemExit('CSS QA failed')

path.write_text(s, encoding='utf-8')
print('Patched Drug Hub with one 95-card Anki download button.')
