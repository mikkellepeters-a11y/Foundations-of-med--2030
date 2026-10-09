(function megahubHome(){
'use strict';
if(window.__MEGAHUB_HOME_LOADED__)return;
window.__MEGAHUB_HOME_LOADED__=true;

const SUPABASE_URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
const SUPABASE_KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
let sb=null;

const E=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const F=n=>Number(n||0).toLocaleString();
const isActive=r=>['active','improving'].includes(String(r?.status||'').toLowerCase());
const isDue=r=>isActive(r)&&r?.next_due_at&&new Date(r.next_due_at)<=new Date();

function addStyles(){
  if(document.getElementById('megahubHomeStyles'))return;
  const s=document.createElement('style');
  s.id='megahubHomeStyles';
  s.textContent=`
    #megaHome{margin-bottom:32px}
    #megaHome *{box-sizing:border-box}
    #megaHome .mh-shell{overflow:hidden;border:1px solid #d8cbbf;border-radius:24px;background:linear-gradient(180deg,#fffaf4,#fbf5ee);box-shadow:0 16px 42px rgba(65,43,31,.09)}
    #megaHome .mh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:22px 22px 18px;border-bottom:1px solid #e1d5ca}
    #megaHome .mh-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#8a654f}
    #megaHome .mh-head h2{margin:5px 0 5px;font-size:clamp(25px,4vw,34px);line-height:1.05;letter-spacing:-.03em}
    #megaHome .mh-head p{margin:0;color:#78695f;font-size:11px;line-height:1.55}
    #megaHome .mh-date{flex:0 0 auto;padding:9px 11px;border-radius:11px;background:#f0e8df;border:1px solid #dfd0c2;color:#694a39;font-size:10px;font-weight:850;white-space:nowrap}
    #megaHome .mh-actions{display:flex;gap:7px;flex-wrap:wrap;padding:13px 22px 0}
    #megaHome .mh-action{display:inline-flex;align-items:center;text-decoration:none;border:1px solid #d9cbbf;background:#fff;color:#694a39;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900}
    #megaHome .mh-action.primary{background:#28543d;border-color:#28543d;color:#fff}
    #megaHome .mh-continue{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:18px;margin:14px 22px 0;padding:18px;border-radius:18px;background:linear-gradient(135deg,#183b2a,#28543d 65%,#527761);color:#fff;box-shadow:0 10px 24px rgba(24,59,42,.16)}
    #megaHome .mh-continue .mh-kicker{color:rgba(255,255,255,.68)}
    #megaHome .mh-continue h3{margin:5px 0 5px;font-size:20px;line-height:1.18;letter-spacing:-.02em}
    #megaHome .mh-continue p{margin:0;color:rgba(255,255,255,.77);font-size:10px;line-height:1.5}
    #megaHome .mh-continue a{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;white-space:nowrap;background:#fff;color:#28543d;border-radius:11px;padding:11px 13px;font-size:10px;font-weight:900}
    #megaHome .mh-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 22px}
    #megaHome .mh-card{min-width:0;padding:14px;border:1px solid #dfd4c9;border-radius:15px;background:#fff}
    #megaHome .mh-card .label{display:block;font-size:8px;text-transform:uppercase;letter-spacing:.07em;font-weight:900;color:#8a7b70}
    #megaHome .mh-card strong{display:block;margin-top:5px;font-size:20px;line-height:1.08;color:#3e3028;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #megaHome .mh-card small{display:block;margin-top:5px;color:#78695f;font-size:9px;line-height:1.4}
    #megaHome .mh-card a{display:inline-flex;margin-top:8px;color:#694a39;text-decoration:none;font-size:8.5px;font-weight:900}
    #megaHome .mh-bottom{display:grid;grid-template-columns:1.2fr .8fr;gap:10px;padding:0 22px 20px}
    #megaHome .mh-panel{border:1px solid #dfd4c9;border-radius:16px;background:#fff;padding:15px}
    #megaHome .mh-panel-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    #megaHome .mh-panel h3{margin:4px 0 5px;font-size:15px;line-height:1.25}
    #megaHome .mh-panel p{margin:0;color:#78695f;font-size:9.5px;line-height:1.5}
    #megaHome .mh-panel .mh-link{display:inline-flex;margin-top:10px;text-decoration:none;color:#694a39;font-size:9px;font-weight:900}
    #megaHome .mh-status{padding:4px 7px;border-radius:999px;background:#e3ece6;border:1px solid #cdded3;color:#28543d;font-size:8px;font-weight:900;white-space:nowrap}
    #megaHome .mh-guest{padding:20px 22px;display:flex;justify-content:space-between;align-items:center;gap:18px}
    #megaHome .mh-guest p{margin:4px 0 0;color:#78695f;font-size:11px;line-height:1.55}
    #megaHome .mh-guest button{border:0;border-radius:11px;background:#694a39;color:#fff;padding:11px 13px;font:900 10px/1 system-ui;cursor:pointer;white-space:nowrap}
    @media(max-width:900px){#megaHome .mh-grid{grid-template-columns:repeat(2,1fr)}#megaHome .mh-bottom{grid-template-columns:1fr}}
    @media(max-width:650px){#megaHome .mh-head,#megaHome .mh-guest{flex-direction:column}#megaHome .mh-date{white-space:normal}#megaHome .mh-actions{padding:12px 14px 0}#megaHome .mh-continue{grid-template-columns:1fr;margin:12px 14px 0;padding:15px}#megaHome .mh-continue a{justify-self:start}#megaHome .mh-grid{grid-template-columns:repeat(2,1fr);padding:12px 14px}#megaHome .mh-bottom{padding:0 14px 14px}#megaHome .mh-head{padding:18px 14px 14px}}
  `;
  document.head.appendChild(s);
}

function mount(){
  let root=document.getElementById('megaHome');
  if(root)return root;
  root=document.createElement('section');
  root.id='megaHome';
  root.setAttribute('aria-label','MegaHub Home');
  root.innerHTML='<div class="mh-shell"><div class="mh-guest"><div><div class="mh-kicker">MegaHub Home</div><h2 style="margin:5px 0 0">Loading your home…</h2></div></div></div>';
  const main=document.querySelector('main');
  const moduleHead=main?.querySelector('.section-head');
  if(moduleHead)moduleHead.insertAdjacentElement('beforebegin',root);
  else main?.insertAdjacentElement('afterbegin',root);
  return root;
}

function greeting(){
  const h=new Date().getHours();
  return h<12?'Good morning':h<17?'Good afternoon':'Good evening';
}
function todayLabel(){return new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});}
function age(iso){
  if(!iso)return '';
  const ms=Date.now()-new Date(iso).getTime();
  if(!Number.isFinite(ms)||ms<0)return '';
  const m=Math.floor(ms/60000);
  if(m<1)return 'just now';
  if(m<60)return m+' min ago';
  const h=Math.floor(m/60);
  if(h<24)return h+' hr'+(h===1?'':'s')+' ago';
  const d=Math.floor(h/24);
  return d+' day'+(d===1?'':'s')+' ago';
}
function currentDay(){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth()+1,d=now.getDate();
  if(y===2026&&m===10&&d<12)return {big:'MSK starts Monday',small:'Week 13 · October 12–16',href:'MSK.html'};
  if(y===2026&&m===10&&d===12)return {big:'7 core lectures',small:'Week 13 Monday · Skin, spine & neural foundations',href:'weeks/week13/index.html'};
  if(y===2026&&m===10&&d===13)return {big:'Week 13',small:'Tuesday · no core lecture block listed in the current hub',href:'weeks/week13/index.html'};
  if(y===2026&&m===10&&d===14)return {big:'2 lectures + SAL',small:'Wednesday · lecture stream + histopathology lab',href:'weeks/week13/index.html'};
  if(y===2026&&m===10&&d===15)return {big:'1 core lecture',small:'Thursday · plus HSS and You+',href:'weeks/week13/index.html'};
  if(y===2026&&m===10&&d===16)return {big:'Finish Week 13',small:'Friday · close out the current week',href:'weeks/week13/index.html'};
  return {big:'Musculoskeletal-Skin',small:'Current module · Week 13 workspace',href:'MSK.html'};
}
function latestStaticPost(){
  const posts=Array.isArray(window.MEGAHUB_BULLETIN_POSTS)?window.MEGAHUB_BULLETIN_POSTS:[];
  return posts[0]||null;
}
function guest(root){
  root.innerHTML=`
    <div class="mh-shell">
      <div class="mh-head">
        <div><div class="mh-kicker">MegaHub Home</div><h2>Your med-school home base.</h2><p>Modules, updates, progress, and the tools you use most — all from one screen.</p></div>
        <div class="mh-date">${E(todayLabel())}</div>
      </div>
      <div class="mh-guest">
        <div><div class="mh-kicker">Personalize This Page</div><h3 style="margin:5px 0 0;font-size:18px">Sign in to unlock your live dashboard.</h3><p>See your current MSK progress, continue where you left off, review due items, leaderboard rank, CBL group, and the latest MegaHub update.</p></div>
        <button id="megaHomeLogin" type="button">Log In / Create Account</button>
      </div>
    </div>`;
  document.getElementById('megaHomeLogin')?.addEventListener('click',()=>document.getElementById('accountButton')?.click());
}
function render(root,d){
  const name=(d.profile?.display_name||d.email?.split('@')[0]||'MegaHub User').trim();
  const progress=(d.progress||[]).filter(x=>x.completed);
  const lectures=progress.filter(x=>x.content_type==='lecture').length;
  const resources=progress.filter(x=>['companion','factoid','anki'].includes(x.content_type)).length;
  const active=(d.reviews||[]).filter(isActive).length;
  const due=(d.reviews||[]).filter(isDue).length;
  const rank=d.leader?.rank?'#'+d.leader.rank:'—';
  const points=d.leader?.points?F(d.leader.points)+' pts':'Complete MSK questions to enter';
  const cbl=d.profile?.cbl_group?('Group '+d.profile.cbl_group):'Not set';
  const resume=d.resume||null;
  const resumeTitle=resume?.resource_title||'Musculoskeletal-Skin';
  const resumeUrl=resume?.resource_url||'MSK.html';
  const resumeBits=[];
  if(resume?.resource_type)resumeBits.push(resume.resource_type);
  if(resume?.week)resumeBits.push('Week '+resume.week);
  if(resume?.lecture)resumeBits.push(resume.lecture);
  const resumeAge=age(resume?.updated_at);if(resumeAge)resumeBits.push(resumeAge);
  const resumeMeta=resumeBits.join(' · ')||'Open the current module';
  const day=currentDay();
  const post=d.post||latestStaticPost();
  const postTitle=post?.title||'The Bulletin';
  const postDate=post?.date||'Latest MegaHub updates';
  const postBody=Array.isArray(post?.body)&&post.body.length?post.body[0]:'Updates, releases, fixes, and class announcements live in the Bulletin.';

  root.innerHTML=`
    <div class="mh-shell">
      <div class="mh-head">
        <div><div class="mh-kicker">MegaHub Home</div><h2>${E(greeting())}, ${E(name)}</h2><p>Your current module, progress, and MegaHub activity in one place.</p></div>
        <div class="mh-date">${E(todayLabel())}</div>
      </div>
      <div class="mh-actions">
        <a class="mh-action primary" href="MSK.html">Open MSK-Skin</a>
        <a class="mh-action" href="bulletin.html">Bulletin</a>
        <a class="mh-action" href="my-profile.html">My Profile</a>
        <a class="mh-action" href="msk-notebook.html">MSK Notebook</a>
        ${d.isAdmin?'<a class="mh-action" href="admin-control.html">Admin Control Center</a>':''}
      </div>
      <div class="mh-continue">
        <div><div class="mh-kicker">Continue Studying</div><h3>${E(resumeTitle)}</h3><p>${E(resumeMeta)}</p></div>
        <a href="${E(resumeUrl)}">Continue →</a>
      </div>
      <div class="mh-grid">
        <div class="mh-card"><span class="label">Today</span><strong>${E(day.big)}</strong><small>${E(day.small)}</small><a href="${E(day.href)}">Open →</a></div>
        <div class="mh-card"><span class="label">Week 13 Progress</span><strong>${F(lectures)}/10</strong><small>${F(resources)} Companion / Factoid / Anki completions</small><a href="weeks/week13/lecture-hub.html">Lecture Hub →</a></div>
        <div class="mh-card"><span class="label">Review Due</span><strong>${F(due)}</strong><small>${F(active)} active MSK review item${active===1?'':'s'}</small><a href="review/msk-review-center.html">Smart Review →</a></div>
        <div class="mh-card"><span class="label">MSK Leaderboard</span><strong>${E(rank)}</strong><small>${E(points)}</small><a href="msk-leaderboard.html">Leaderboard →</a></div>
      </div>
      <div class="mh-bottom">
        <div class="mh-panel">
          <div class="mh-panel-top"><div><div class="mh-kicker">What’s New</div><h3>${E(postTitle)}</h3></div><span class="mh-status">${E(postDate)}</span></div>
          <p>${E(postBody)}</p><a class="mh-link" href="bulletin.html">Open Bulletin →</a>
        </div>
        <div class="mh-panel">
          <div class="mh-panel-top"><div><div class="mh-kicker">Your Groups</div><h3>CBL ${E(cbl)}</h3></div><span class="mh-status">Account</span></div>
          <p>Your saved class and group information stays attached to your MegaHub profile and is used by group-aware features.</p><a class="mh-link" href="my-profile.html">Manage Profile →</a>
        </div>
      </div>
    </div>`;

  const moduleHead=document.querySelector('main > .section-head');
  if(moduleHead){
    const kicker=moduleHead.querySelector('.section-kicker'),h2=moduleHead.querySelector('h2'),note=moduleHead.querySelector('.section-note');
    if(kicker)kicker.textContent='Course Modules';
    if(h2)h2.textContent='Your curriculum';
    if(note)note.textContent='Open a module or pick up from your home dashboard above';
  }
}
async function load(){
  addStyles();
  const root=mount();
  if(!window.supabase){guest(root);return}
  try{
    sb=sb||window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const sessionRes=await sb.auth.getSession();
    const user=sessionRes.data?.session?.user;
    if(!user){guest(root);return}
    const uid=user.id;
    const [profileRes,progressRes,reviewRes,leaderRes,resumeRes,adminRes]=await Promise.all([
      sb.from('profiles').select('display_name,cbl_group,class_year').eq('id',uid).maybeSingle(),
      sb.from('lecture_progress').select('content_type,completed,week,module').eq('user_id',uid).eq('module','msk').eq('week',13),
      sb.from('review_items').select('status,next_due_at,module_key').eq('user_id',uid).eq('module_key','msk'),
      sb.rpc('get_msk_individual_leaderboard'),
      sb.from('module_resume_state').select('resource_title,resource_url,resource_type,week,lecture,updated_at').eq('user_id',uid).eq('module_key','msk').maybeSingle(),
      sb.rpc('is_site_admin')
    ]);
    const leaders=Array.isArray(leaderRes.data)?leaderRes.data:[];
    const leader=leaders.find(x=>x.is_current_user)||null;
    render(root,{email:user.email||'',profile:profileRes.data||null,progress:progressRes.data||[],reviews:reviewRes.data||[],leader,resume:resumeRes.data||null,post:latestStaticPost(),isAdmin:!adminRes.error&&adminRes.data===true});
  }catch(e){
    console.error('MegaHub Home failed',e);
    guest(root);
  }
}
async function start(){
  addStyles();
  await load();
  if(window.supabase){
    try{
      const authClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      authClient.auth.onAuthStateChange(()=>setTimeout(load,0));
    }catch(e){}
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();