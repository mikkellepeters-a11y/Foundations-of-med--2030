from pathlib import Path
import json, os, re

ROOT=Path(__file__).resolve().parents[1]
QUIZZES=ROOT/'quizzes'
ADAPTER=QUIZZES/'fom-supabase.js'
SUPA='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

linked=[]
for week in range(2,11):
    idx=ROOT/'weeks'/f'week{week}'/'index.html'
    if not idx.exists():
        continue
    text=idx.read_text(encoding='utf-8',errors='ignore')
    for href in re.findall(r'href=["\']([^"\']+\.html(?:\?[^"\']*)?)["\']',text,re.I):
        href=href.split('?',1)[0]
        if 'quizzes/' not in href.lower():
            continue
        candidate=(idx.parent/href).resolve()
        try: candidate.relative_to(ROOT)
        except ValueError: continue
        if candidate.exists() and candidate.suffix.lower()=='.html' and candidate not in linked:
            linked.append(candidate)

report=[]
for path in linked:
    text=path.read_text(encoding='utf-8',errors='ignore')
    rel=str(path.relative_to(ROOT)).replace('\\','/')
    key_m=re.search(r'const\s+QUIZ_KEY\s*=\s*["\']([^"\']+)["\']',text)
    key=key_m.group(1) if key_m else None
    qcount=None
    # Prefer title/progress counts only as a fallback; question count is finalized later from runtime/canonical filename.
    filename_count=re.search(r'_(\d+)\.html$',path.name,re.I)
    if filename_count: qcount=int(filename_count.group(1))
    row={'path':rel,'quiz_id':key,'question_count_hint':qcount}
    if 'fom-supabase.js' in text:
        row['status']='already-adapter';report.append(row);continue
    if 'quiz_attempts' in text and 'question_attempts' in text:
        row['status']='already-cloud';report.append(row);continue
    if not key or 'const QUESTIONS' not in text or 'function showResults' not in text:
        row['status']='unsupported';report.append(row);continue
    adapter_rel=os.path.relpath(ADAPTER,path.parent).replace('\\','/')
    tags=[]
    if SUPA not in text: tags.append(f'<script src="{SUPA}"></script>')
    tags.append(f'<script src="{adapter_rel}"></script>')
    insert='\n'+'\n'.join(tags)+'\n'
    if '</body>' in text.lower():
        pos=text.lower().rfind('</body>')
        text=text[:pos]+insert+text[pos:]
    else:
        text+=insert
    path.write_text(text,encoding='utf-8')
    row['status']='patched';report.append(row)

out=ROOT/'scripts'/'regular_quiz_supabase_report.json'
out.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'linked':len(linked),'patched':sum(r['status']=='patched' for r in report),'already_cloud':sum(r['status']=='already-cloud' for r in report),'unsupported':sum(r['status']=='unsupported' for r in report)},indent=2))
for r in report: print(f"{r['status']:16} {r['path']} {r.get('quiz_id') or ''}")
