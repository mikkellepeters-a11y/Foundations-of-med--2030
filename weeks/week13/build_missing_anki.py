import pathlib,re,html,sqlite3,zipfile,tempfile
from html.parser import HTMLParser
import genanki

ROOT=pathlib.Path(__file__).parent
class Extract(HTMLParser):
 def __init__(self): super().__init__();self.inrow=False;self.incell=False;self.cells=[];self.rows=[];self.current=''
 def handle_starttag(self,tag,attrs):
  if tag=='tr': self.inrow=True;self.cells=[]
  if tag in ('td','th') and self.inrow:self.incell=True;self.current=''
 def handle_data(self,data):
  if self.incell:self.current+=data
 def handle_endtag(self,tag):
  if tag in ('td','th') and self.incell:
   self.cells.append(re.sub(r'\\s+',' ',html.unescape(self.current)).strip());self.incell=False
  if tag=='tr' and self.inrow:
   if len(self.cells)>1:self.rows.append(self.cells[:])
   self.inrow=False
for lecture in (1,2,3):
 p=ROOT/f'lecture{lecture}-factoid.html'
 src=p.read_text(encoding='utf-8')
 e=Extract();e.feed(src)
 entries=[]
 for row in e.rows:
  if len(row)<2:continue
  term,definition=row[0].strip(),row[1].strip()
  if not 2<=len(term)<=70 or not 8<=len(definition)<=280:continue
  if re.search(r'^(term|concept|item|system|type|rule|fast recall|factoid|exam trap|compare|clue|characteristic|high.yield|answer|question|source)',term,re.I):continue
  if not re.search(r'[A-Za-z]',term+definition):continue
  if term.lower() in definition.lower():continue
  entries.append((term,definition))
 # Fallback to explicitly delimited high-yield factoids when markup isn't table-based.
 if len(entries)<25:
  s=re.sub(r'(?is)<style.*?</style>|<script.*?</script>','',src)
  s=re.sub(r'(?i)</(?:p|li|tr|div|section|h[1-6])>','\\n',s)
  s=re.sub(r'<[^>]+>',' ',s)
  for line in html.unescape(s).splitlines():
   line=re.sub(r'\\s+',' ',line).strip()
   if ':' in line and len(line)<220:
    a,b=line.split(':',1);a=a.strip();b=b.strip()
    if 3<=len(a)<=65 and 12<=len(b)<=170 and a.lower() not in b.lower():
     entries.append((a,b))
 seen=set();valid=[]
 for a,b in entries:
  key=a.lower()
  if key in seen:continue
  seen.add(key);valid.append((a,b))
 if len(valid)<12:raise ValueError(f'Not enough source-derived entries: lecture {lecture} got {len(valid)}')
 cloze=genanki.Model(2961105300+lecture,'MSK W13 Cloze L'+str(lecture),fields=[{'name':'Text'},{'name':'Extra'}],templates=[{'name':'Cloze','qfmt':'{{cloze:Text}}','afmt':'{{cloze:Text}}<hr>{{Extra}}'}],model_type=genanki.Model.CLOZE)
 basic=genanki.Model(2961105400+lecture,'MSK W13 Basic L'+str(lecture),fields=[{'name':'Front'},{'name':'Back'}],templates=[{'name':'Basic','qfmt':'{{Front}}','afmt':'{{FrontSide}}<hr>{{Back}}'}])
 deck=genanki.Deck(2961105500+lecture,'MSK · Week 13 · Lecture '+str(lecture))
 for a,b in valid:
  # Question context only on front; one answer, no synonyms in the question itself.
  deck.add_note(genanki.Note(model=basic,fields=['In Week 13 Lecture '+str(lecture)+', what does the term '+a+' refer to?',b]))
  if len(a)<45 and len(b)<160:
   # Single deletion; visible context does not repeat hidden term.
   deck.add_note(genanki.Note(model=cloze,fields=[b+' — {{c1::'+a+'}}','']))
 out=ROOT/f'MSK_Week13_Lecture{lecture}_Combined.apkg'
 genanki.Package(deck).write_to_file(str(out))
 with zipfile.ZipFile(out) as z:
  assert z.testzip() is None
  with tempfile.TemporaryDirectory() as d:
   q=pathlib.Path(d)/'collection.anki2';q.write_bytes(z.read('collection.anki2'))
   db=sqlite3.connect(q)
   assert db.execute('pragma integrity_check').fetchone()[0]=='ok'
   assert db.execute('select count(*) from notes').fetchone()[0] >= len(valid)
   assert db.execute('select count(*) from cards').fetchone()[0] >= len(valid)
 print(lecture,len(valid),len(deck.notes),out)
