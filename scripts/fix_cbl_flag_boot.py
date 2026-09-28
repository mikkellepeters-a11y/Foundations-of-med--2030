from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CBL = ROOT / 'weeks' / 'cbl'
FILES = [
    'week3_case_quiz_30.html',
    'week4_case_quiz_27.html',
    'week5_case_quiz_19.html',
    'week6_case_quiz_33.html',
    'week7_case_quiz_35.html',
    'week8_case_quiz_27.html',
    'week9_case_quiz_28.html',
]
OLD = "let flags=JSON.parse(localStorage.getItem(FLAG_KEY)||'{}');"
NEW = """let flags={};
try{
  const savedFlags=localStorage.getItem(FLAG_KEY);
  flags=savedFlags?JSON.parse(savedFlags):{};
  if(!flags || typeof flags!=='object' || Array.isArray(flags)) flags={};
}catch(err){
  console.warn('Resetting unreadable local CBL review flags',err);
  flags={};
  try{localStorage.removeItem(FLAG_KEY)}catch(_){ }
}"""

changed=[]
for name in FILES:
    path=CBL/name
    text=path.read_text(encoding='utf-8')
    if NEW in text:
        continue
    if OLD not in text:
        raise SystemExit(f'Expected legacy flag bootstrap not found in {name}')
    text=text.replace(OLD,NEW,1)
    path.write_text(text,encoding='utf-8')
    changed.append(name)

print(f'Patched {len(changed)} legacy CBL pages:')
for name in changed:
    print(' -',name)
