(()=>{
'use strict';
if(window.__MSK_LECTURE_PROGRESS_LOADED__)return;
window.__MSK_LECTURE_PROGRESS_LOADED__=true;
const SUPABASE_URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
const SUPABASE_KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
const MODULE='msk',WEEK=13;
let sb=null,user=null,rows=new Map();
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const normNum=v=>String(parseInt(String(v||'').replace(/\D/g,''),10)||0).padStart(2,'0');
function addStyles(){
 if(document.getElementById('mskLectureProgressStyles'))return;
 const s=document.createElement('style');s.id='mskLectureProgressStyles';
 s.textContent='.msk-progress-strip{grid-column:1/-1;display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px;padding-top:8px;border-top:1px solid #e2ebe5}.lecture-card .msk-progress-strip{margin-top:12px;padding-top:11px}.msk-progress-label{font-size:8px;text-transform:uppercase;letter-spacing:.07em;font-weight:900;color:#718078;margin-right:2px}.msk-progress-toggle{appearance:none;border:1px solid #cdded3;background:#fff;color:#527761;border-radius:999px;padding:5px 8px;font:850 8.5px/1 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;transition:.14s ease}.msk-progress-toggle:hover{border-color:#8fb09a;color:#28543d}.msk-progress-toggle.done{background:#28543d;border-color:#28543d;color:#fff}.msk-progress-toggle.saving{opacity:.55;pointer-events:none}.msk-progress-signin{font-size:8.5px;color:#718078;font-weight:800}.msk-progress-signin a{color:#28543d;font-weight:900}#mskWeekProgressSummary{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 22px;padding:13px 15px;background:#fbfdfb;border:1px solid #ceddd3;border-left:5px solid #28543d;border-radius:15px;box-shadow:0 8px 22px rgba(24,59,42,.06)}#mskWeekProgressSummary .ps-left{display:flex;gap:13px;align-items:center;flex-wrap:wrap}#mskWeekProgressSummary .ps-title{font-size:11px;font-weight:900;color:#21362b}#mskWeekProgressSummary .ps-stat{font-size:9px;color:#63736a;font-weight:800}#mskWeekProgressSummary .ps-stat b{color:#28543d;font-size:12px}#mskWeekProgressSummary .ps-note{font-size:8.5px;color:#7b8a81}@media(max-width:650px){#mskWeekProgressSummary{align-items:flex-start}.msk-progress-strip{gap:5px}.msk-progress-toggle{padding:5px 7px}}';
 document.head.appendChild(s);
}
function contentId(lecture,type){return 'msk-w13-l'+lecture+'-'+type}
function getLectureInfo(el){
 const n=q('.lnum,.lecture-num',el),lecture=normNum(n&&n.textContent);
 const titleEl=q('h3',el)||qa('strong',el).find(x=>!x.closest('.lecture-actions')&&!x.closest('.resource-row'));
 return {lecture:lecture,title:(titleEl&&titleEl.textContent||('Lecture '+lecture)).trim()};
}
function resourceTypes(el){
 const links=qa('.lecture-actions a,.resource-row a',el).filter(a=>{const href=(a.getAttribute('href')||'').trim();return !a.classList.contains('placeholder')&&href&&href!=='#'});
 const out=new Set();
 links.forEach(a=>{const t=((a.textContent||'')+' '+(a.getAttribute('href')||'')).toLowerCase();if(t.includes('companion'))out.add('companion');else if(t.includes('factoid'))out.add('factoid');else if(t.includes('anki')||t.includes('.apkg'))out.add('anki')});
 return [...out];
}
function state(lecture,type){return rows.get(contentId(lecture,type))?.completed===true}
function setBtn(btn,done){btn.classList.toggle('done',done);btn.setAttribute('aria-pressed',done?'true':'false');btn.textContent=(done?'✓ ':'○ ')+btn.dataset.label}
async function save(lecture,type,completed,btn){
 if(!user||!sb)return;
 const id=contentId(lecture,type),previous=state(lecture,type);setBtn(btn,completed);btn.classList.add('saving');
 const now=new Date().toISOString(),payload={user_id:user.id,content_id:id,module:MODULE,week:WEEK,content_type:type,completed:completed,completed_at:completed?now:null,updated_at:now};
 const res=await sb.from('lecture_progress').upsert(payload,{onConflict:'user_id,content_id'}).select().single();btn.classList.remove('saving');
 if(res.error){console.error('MSK lecture progress save failed',res.error);setBtn(btn,previous);toast('Could not save progress. Please try again.');return}
 rows.set(id,res.data);setBtn(btn,completed);updateSummary();window.dispatchEvent(new CustomEvent('msk:lecture-progress-changed',{detail:{week:WEEK,content_id:id,completed:completed}}));
}
function toast(msg){let t=document.getElementById('mskProgressToast');if(!t){t=document.createElement('div');t.id='mskProgressToast';t.style.cssText='position:fixed;left:50%;bottom:22px;transform:translate(-50%,12px);opacity:0;z-index:9999;background:#183b2a;color:#fff;padding:10px 13px;border-radius:10px;font:800 10px/1.3 system-ui;transition:.18s ease;pointer-events:none';document.body.appendChild(t)}t.textContent=msg;t.style.opacity='1';t.style.transform='translate(-50%,0)';clearTimeout(t._tm);t._tm=setTimeout(()=>{t.style.opacity='0';t.style.transform='translate(-50%,12px)'},1600)}
function addStrip(el){
 if(q('.msk-progress-strip',el))return;const info=getLectureInfo(el);if(!info.lecture||info.lecture==='00')return;
 const strip=document.createElement('div');strip.className='msk-progress-strip';
 if(!user){strip.innerHTML='<span class="msk-progress-label">Progress</span><span class="msk-progress-signin"><a href="../../index.html">Sign in</a> to track this lecture.</span>';el.appendChild(strip);return}
 const label=document.createElement('span');label.className='msk-progress-label';label.textContent='Progress';strip.appendChild(label);
 const labels={lecture:'Lecture',companion:'Companion',factoid:'Factoid',anki:'Anki'},types=['lecture',...resourceTypes(el)];
 types.forEach(type=>{const b=document.createElement('button');b.type='button';b.className='msk-progress-toggle';b.dataset.label=labels[type];b.title=type==='lecture'?'Mark this lecture complete':'Mark this resource complete';setBtn(b,state(info.lecture,type));b.addEventListener('click',()=>save(info.lecture,type,!state(info.lecture,type),b));strip.appendChild(b)});
 el.appendChild(strip);
}
function buildSummary(){if(document.getElementById('mskWeekProgressSummary'))return;const box=document.createElement('section');box.id='mskWeekProgressSummary';const nav=q('main .jump')||q('main .toolbar');if(nav)nav.insertAdjacentElement('afterend',box);else q('main')?.insertAdjacentElement('afterbegin',box)}
function count(type){return [...rows.values()].filter(r=>r.completed===true&&r.content_type===type).length}
function updateSummary(){
 const box=document.getElementById('mskWeekProgressSummary');if(!box)return;
 if(!user){box.innerHTML='<div class="ps-left"><span class="ps-title">Week 13 Progress</span><span class="ps-stat">Sign in to save lecture and resource completion.</span></div><span class="ps-note">Progress syncs to your MegaHub account.</span>';return}
 box.innerHTML='<div class="ps-left"><span class="ps-title">Week 13 Progress</span><span class="ps-stat"><b>'+count('lecture')+'/10</b> lectures</span><span class="ps-stat"><b>'+count('companion')+'</b> companions</span><span class="ps-stat"><b>'+count('factoid')+'</b> factoids</span><span class="ps-stat"><b>'+count('anki')+'</b> Anki decks</span></div><span class="ps-note">Tap a progress pill to update it.</span>';
}
async function loadSupabase(){if(window.supabase)return;await new Promise(resolve=>{const existing=[...document.scripts].find(s=>s.src&&s.src.includes('@supabase/supabase-js'));if(existing){existing.addEventListener('load',resolve,{once:true});setTimeout(resolve,800);return}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)})}
async function init(){
 addStyles();buildSummary();await loadSupabase();
 if(window.supabase){sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);try{const ses=await sb.auth.getSession();user=ses.data&&ses.data.session&&ses.data.session.user||null;if(user){const res=await sb.from('lecture_progress').select('id,user_id,content_id,module,week,content_type,completed,completed_at,updated_at').eq('user_id',user.id).eq('module',MODULE).eq('week',WEEK);if(!res.error)(res.data||[]).forEach(r=>rows.set(r.content_id,r))}}catch(e){console.error('MSK lecture progress load failed',e)}}
 qa('.lecture,.lecture-card').forEach(addStrip);updateSummary();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();