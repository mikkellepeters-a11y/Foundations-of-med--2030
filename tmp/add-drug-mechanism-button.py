from pathlib import Path

path = Path('weeks/drug-hub/index.html')
text = path.read_text(encoding='utf-8')
old = '  <div class="hero-actions"><a class="anki-download" href="downloads/Foundations_Pharmacology_Use_First_95.apkg" download>Download Anki Deck <span>95 cards</span></a></div>\n'
new = '  <div class="hero-actions"><a class="anki-download" href="downloads/Foundations_Pharmacology_Use_First_95.apkg" download>Use-First Anki Deck <span>95 cards</span></a><a class="anki-download" href="downloads/Foundations_Pharmacology_Mechanism_First_95.apkg" download>Mechanism Anki Deck <span>95 cards</span></a></div>\n'
if text.count(old) != 1:
    raise SystemExit(f'Expected exactly one existing Anki hero action; found {text.count(old)}')
text = text.replace(old, new, 1)
if text.count('Foundations_Pharmacology_Use_First_95.apkg') != 1:
    raise SystemExit('Use-first deck link count invalid after patch')
if text.count('Foundations_Pharmacology_Mechanism_First_95.apkg') != 1:
    raise SystemExit('Mechanism deck link count invalid after patch')
path.write_text(text, encoding='utf-8')
print('Drug Hub hero now has separate Use-First and Mechanism Anki download buttons.')
