from pathlib import Path
import re, json, sqlite3, zipfile, time, hashlib, html, tempfile

SOURCE = Path('weeks/drug-hub/index.html')
OUT = Path('weeks/drug-hub/downloads/Foundations_Pharmacology_Use_First_95.apkg')
text = SOURCE.read_text(encoding='utf-8')
match = re.search(r'const DRUGS=(\[.*?\]);\nconst grid=', text, re.S)
if not match:
    raise SystemExit('Could not recover canonical DRUGS array')
drugs = json.loads(match.group(1))
if len(drugs) != 95:
    raise SystemExit(f'Expected 95 drugs, found {len(drugs)}')

def clean(s):
    return re.sub(r'\s+', ' ', (s or '').strip())

def esc(s):
    return html.escape(clean(s), quote=False)

def tagify(s):
    return re.sub(r'[^A-Za-z0-9]+', '_', clean(s)).strip('_') or 'Other'

notes=[]
for d in drugs:
    name=clean(d['name']); uses=clean(d['uses']); drug_class=clean(d['class'])
    mechanism=clean(d['mechanism']); tox=clean(d['tox']); pearl=clean(d['pearl'])
    category=clean(d['category']); week=clean(d['week']); priority=clean(d['priority'])
    front=f'<b>Use:</b> {esc(uses)}<br><br><b>Drug:</b> {{{{c1::{esc(name)}}}}}'
    extra='<br>'.join([
        f'<b>Class:</b> {esc(drug_class)}',
        f'<b>Mechanism:</b> {esc(mechanism)}',
        f'<b>Key toxicity:</b> {esc(tox)}',
        f'<b>Pearl:</b> {esc(pearl)}'])
    tags=['Foundations_Pharmacology',f'Foundations_Pharmacology::Week_{tagify(week)}',
          f'Foundations_Pharmacology::Category::{tagify(category)}',
          f'Foundations_Pharmacology::Priority::{tagify(priority)}','CardType::Use_First']
    notes.append((name,front,extra,tags))

if len(notes) != 95 or any('Drug Hub' in f or 'Drug Hub' in e for _,f,e,_ in notes):
    raise SystemExit('Card content QA failed')

deck_id=1760007001; model_id=1760007002; now=int(time.time()); crt=now//86400
with tempfile.TemporaryDirectory() as td:
    td=Path(td); db=td/'collection.anki2'; media=td/'media'
    con=sqlite3.connect(db); cur=con.cursor()
    cur.executescript('''
CREATE TABLE col (id integer primary key,crt integer not null,mod integer not null,scm integer not null,ver integer not null,dty integer not null,usn integer not null,ls integer not null,conf text not null,models text not null,decks text not null,dconf text not null,tags text not null);
CREATE TABLE notes (id integer primary key,guid text not null,mid integer not null,mod integer not null,usn integer not null,tags text not null,flds text not null,sfld integer not null,csum integer not null,flags integer not null,data text not null);
CREATE TABLE cards (id integer primary key,nid integer not null,did integer not null,ord integer not null,mod integer not null,usn integer not null,type integer not null,queue integer not null,due integer not null,ivl integer not null,factor integer not null,reps integer not null,lapses integer not null,left integer not null,odue integer not null,odid integer not null,flags integer not null,data text not null);
CREATE TABLE revlog (id integer primary key,cid integer not null,usn integer not null,ease integer not null,ivl integer not null,lastIvl integer not null,factor integer not null,time integer not null,type integer not null);
CREATE TABLE graves (usn integer not null,oid integer not null,type integer not null);
CREATE INDEX ix_notes_usn ON notes (usn); CREATE INDEX ix_cards_usn ON cards (usn); CREATE INDEX ix_revlog_usn ON revlog (usn); CREATE INDEX ix_cards_nid ON cards (nid); CREATE INDEX ix_cards_sched ON cards (did,queue,due); CREATE INDEX ix_revlog_cid ON revlog (cid); CREATE INDEX ix_notes_csum ON notes (csum);
''')
    css='.card{font-family:Arial,Helvetica,sans-serif;font-size:22px;text-align:center;color:#222;background:#fff;line-height:1.45;max-width:760px;margin:auto}.cloze{font-weight:700;color:#5b4032}#extra{margin-top:18px;padding-top:12px;border-top:1px solid #ddd;text-align:left;font-size:16px;line-height:1.5;color:#555}'
    model={'id':model_id,'name':'Foundations Pharmacology Use-First Cloze','type':1,'mod':now,'usn':-1,'sortf':0,'did':deck_id,
           'tmpls':[{'name':'Cloze','ord':0,'qfmt':'{{cloze:Text}}','afmt':'{{cloze:Text}}<div id="extra">{{Extra}}</div>','did':None,'bqfmt':'','bafmt':''}],
           'flds':[{'name':'Text','ord':0,'sticky':False,'rtl':False,'font':'Arial','size':20,'media':[]},{'name':'Extra','ord':1,'sticky':False,'rtl':False,'font':'Arial','size':16,'media':[]}],
           'css':css,'latexPre':'','latexPost':'','req':[]}
    deck={'id':deck_id,'name':'Foundations Pharmacology — Use First','desc':'95 concise use-first cloze cards. Use/indication appears first; answer is the drug.','mod':now,'usn':-1,'collapsed':False,'browserCollapsed':False,'dyn':0,'conf':1,'extendNew':10,'extendRev':50,'newToday':[0,0],'revToday':[0,0],'lrnToday':[0,0],'timeToday':[0,0]}
    dconf={'1':{'id':1,'name':'Default','mod':0,'usn':0,'maxTaken':60,'autoplay':True,'timer':0,'replayq':True,'new':{'delays':[1,10],'ints':[1,4],'initialFactor':2500,'separate':True,'order':1,'perDay':20,'bury':True},'rev':{'perDay':200,'ease4':1.3,'fuzz':0.05,'ivlFct':1,'maxIvl':36500,'hardFactor':1.2,'bury':True},'lapse':{'delays':[10],'mult':0,'minInt':1,'leechFails':8,'leechAction':0},'dyn':False}}
    conf={'nextPos':96,'estTimes':True,'activeDecks':[deck_id],'sortType':'noteFld','timeLim':0,'sortBackwards':False,'addToCur':True,'curDeck':deck_id,'newSpread':0,'dueCounts':True,'curModel':model_id,'collapseTime':1200}
    cur.execute('INSERT INTO col VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',(1,crt,now*1000,now*1000,11,0,0,0,json.dumps(conf,separators=(',',':')),json.dumps({str(model_id):model},separators=(',',':')),json.dumps({str(deck_id):deck},separators=(',',':')),json.dumps(dconf,separators=(',',':')),'{}'))
    base=int(time.time()*1000)
    for i,(name,front,extra,tags) in enumerate(notes):
        nid=base+i*2; cid=nid+1; guid=hashlib.sha1((name+'|'+front).encode()).hexdigest()[:10]
        flds=front+'\x1f'+extra; csum=int(hashlib.sha1(name.encode()).hexdigest()[:8],16)
        cur.execute('INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)',(nid,guid,model_id,now,-1,' '+' '.join(tags)+' ',flds,name,csum,0,''))
        cur.execute('INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(cid,nid,deck_id,0,now,-1,0,0,i+1,0,2500,0,0,0,0,0,0,''))
    con.commit()
    if cur.execute('SELECT COUNT(*) FROM notes').fetchone()[0] != 95 or cur.execute('SELECT COUNT(*) FROM cards').fetchone()[0] != 95:
        raise SystemExit('APKG database count QA failed')
    con.close(); media.write_text('{}',encoding='utf-8')
    OUT.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED) as z:
        z.write(db,'collection.anki2'); z.write(media,'media')

with zipfile.ZipFile(OUT) as z:
    if set(z.namelist()) != {'collection.anki2','media'}:
        raise SystemExit('APKG container QA failed')
print(f'Built validated 95-card deck: {OUT} ({OUT.stat().st_size} bytes)')
