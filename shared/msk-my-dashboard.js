(()=>{
'use strict';
if(window.__MSK_MY_DASHBOARD_LOADED__)return;
window.__MSK_MY_DASHBOARD_LOADED__=true;
const URL='https://ofqfdnxpftifnvxnvppe.supabase.co',KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G',MOD='msk';
let sb=null;
const E=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const F=n=>Number(n||0).toLocaleString();
function css(){
 if(document.getElementById('myMskStyles'))return;
 const s=document.createElement('style');s.id='myMskStyles';s.textContent=
 '#myMskDashboard{margin:0 0 28px;background:linear-gradient(180deg,#fbfdfb,#f5f9f6);border:1px solid #ceddd3;border-radius:22px;box-shadow:0 14px 34px rgba(24,59,42,.09);overflow:hidden;color:#21362b}'+
 '#myMskDashboard *{box-sizing:border-box}.mymsk-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:19px 20px 15px;border-bottom:1px solid #d9e5dc}.mymsk-k{font-size:9px;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#527761}.mymsk-top h2{margin:5px 0;font-size:25px;letter-spacing:-.03em}.mymsk-sub{margin:0;color:#63736a;font-size:11px;line-height:1.5}.mymsk-links{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.mymsk-link{display:inline-flex;text-decoration:none;padding:7px 9px;border-radius:9px;border:1px solid #ceddd3;background:#fff;color:#28543d;font-size:9.5px;font-weight:900}.mymsk-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;padding:14px 20px}.mymsk-metric{background:#fff;border:1px solid #d7e3da;border-radius:14px;padding:12px;min-width:0}.mymsk-metric strong{display:block;font-size:22px;line-height:1.05;letter-spacing:-.035em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mymsk-metric span{display:block;margin-top:5px;color:#63736a;font-size:8px;text-transform:uppercase;letter-spacing:.06em;font-weight:900}.mymsk-metric small{display:block;margin-top:5px;color:#7b8a81;font-size:8.5px;line-height:1.35}.mymsk-focus{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:15px;align-items:center;margin:0 20px 18px;padding:14px 15px;border:1px solid #cdded3;border-radius:16px;background:#e7f0ea}.mymsk-focus-label{font-size:8px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:#527761}.mymsk-focus h3{margin:4px 0;font-size:16px}.mymsk-focus p{margin:0;color:#52665a;font-size:10px;line-height:1.48;max-width:760px}.mymsk-primary{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;white-space:nowrap;border-radius:10px;background:#28543d;color:#fff!important;padding:10px 12px;font-size:9.5px;font-weight:900}.mymsk-load{padding:22px 20px;color:#63736a;font-size:11px}.mymsk-auth{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:16px 20px}.mymsk-auth p{margin:0;color:#63736a;font-size:11px;line-height:1.5}'+
 '@media(max-width:900px){.mymsk-metrics{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.mymsk-top,.mymsk-auth{flex-direction:column}.mymsk-links{justify-content:flex-start}.mymsk-metrics{grid-template-columns:repeat(2,1fr);padding:12px 14px}.mymsk-focus{grid-template-columns:1fr;margin:0 14px 14px}.mymsk-primary{justify-self:start}.mymsk-top{padding:16px 14px 13px}}';
 document.head.appendChild(s);
}
function mount(){
 let r=document.getElementById('myMskDashboard');if(r)return r;
 r=document.createElement('section');r.id='myMskDashboard';r.innerHTML='<div class="mymsk-load">Loading your MSK snapshot…</div>';
 const h=[...document.querySelectorAll('h1,h2,h3')].find(x=>/choose a week/i.test((x.textContent||'').trim()));
 const sec=h&&h.closest('section'),m=document.querySelector('main');
 if(sec&&sec.parentNode)sec.parentNode.insertBefore(r,sec);else if(m)m.insertAdjacentElement('afterbegin',r);else document.body.appendChild(r);
 return r;
}
function script(src,global){
 return new Promise(ok=>{if(window[global])return ok();const e=[...document.scripts].find(x=>x.src&&x.src.includes(src));if(e){e.addEventListener('load',ok,{once:true});return setTimeout(ok,600)}const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=ok;document.head.appendChild(s)});
}
function greet(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening'}
function active(x){return ['active','improving'].includes(String(x&&x.status||'').toLowerCase())}
function due(x){return active(x)&&x.next_due_at&&new Date(x.next_due_at)<=new Date()}
function signedOut(r){
 r.innerHTML='<div class="mymsk-top"><div><div class="mymsk-k">Personal Dashboard</div><h2>My MSK</h2><p class="mymsk-sub">Sign in to connect your question history, review queue, leaderboard activity, and notebook.</p></div></div><div class="mymsk-auth"><p>Your personalized dashboard appears here once you are logged in.</p><a class="mymsk-primary" href="index.html">Log In / Create Account</a></div>';
}
function href(rec){
 if(!rec||!rec.action)return 'weeks/week13/index.html';
 return window.MSKRecommendationEngine?window.MSKRecommendationEngine.buildUrl(rec.action,{builder:'quiz/msk-adaptive-quiz-builder.html',review:'review/msk-review-center.html'})||'weeks/week13/index.html':'review/msk-review-center.html';
}
function render(r,d){
 const radar=window.MSKWeaknessRadar?window.MSKWeaknessRadar.build(d.attempts,d.reviews,{groupBy:'topic'}):[];
 const weak=radar.find(x=>Number(x.score||0)>0)||radar[0]||null;
 const recs=window.MSKRecommendationEngine?window.MSKRecommendationEngine.build(d.attempts,d.reviews,{radarRows:radar,max:1}):[];
 const rec=recs[0]||null,dues=d.reviews.filter(due).length,activeN=d.reviews.filter(active).length;
 const completed=(d.progress||[]).filter(x=>x.completed===true),lectureDone=completed.filter(x=>x.content_type==='lecture').length,compDone=completed.filter(x=>x.content_type==='companion').length,factDone=completed.filter(x=>x.content_type==='factoid').length,ankiDone=completed.filter(x=>x.content_type==='anki').length;
 const w13=d.attempts.filter(a=>String(a.week||'').replace(/[^0-9]/g,'')==='13').length;
 const name=(d.profile&&d.profile.display_name||'MSK learner').trim(),rank=d.leader&&d.leader.rank?'#'+d.leader.rank:'—';
 const weakName=weak?weak.key:'Building baseline',weakSub=weak?'Weakness '+weak.score+'/100':'Answer MSK questions to generate this';
 const title=rec&&rec.title||'Start building your MSK baseline';
 const detail=rec&&rec.detail||'Once you begin answering MSK questions, this area will turn your performance into a personalized next step.';
 const label=rec&&rec.action&&rec.action.label||'Open Week 13';
 r.innerHTML=
 '<div class="mymsk-top"><div><div class="mymsk-k">Personal Dashboard</div><h2>'+E(greet())+', '+E(name)+'</h2><p class="mymsk-sub">Your live MSK snapshot updates from your own account activity.</p></div><div class="mymsk-links"><a class="mymsk-link" href="review/msk-review-center.html">Smart Review</a><a class="mymsk-link" href="msk-notebook.html">Notebook</a><a class="mymsk-link" href="my-profile.html">My Profile</a></div></div>'+
 '<div class="mymsk-metrics">'+
 '<div class="mymsk-metric"><strong>'+F(d.attempts.length)+'</strong><span>Questions Answered</span><small>'+F(w13)+' tagged to Week 13</small></div>'+
 '<div class="mymsk-metric"><strong>'+E(rank)+'</strong><span>MSK Rank</span><small>'+(d.leader?F(d.leader.points)+' participation points':'Complete questions to enter')+'</small></div>'+
 '<div class="mymsk-metric"><strong>'+F(dues)+'</strong><span>Due for Review</span><small>'+F(activeN)+' active review items</small></div>'+
 '<div class="mymsk-metric"><strong>'+F(lectureDone)+'/10</strong><span>Week 13 Lectures</span><small>'+F(compDone)+' Comp · '+F(factDone)+' Fact · '+F(ankiDone)+' Anki</small></div>'+
 '<div class="mymsk-metric"><strong title="'+E(weakName)+'">'+E(weakName)+'</strong><span>Top Focus</span><small>'+E(weakSub)+'</small></div>'+
 '<div class="mymsk-metric"><strong>'+F(d.notes)+'</strong><span>Notebook Notes</span><small>Private + account synced</small></div></div>'+
 '<div class="mymsk-focus"><div><div class="mymsk-focus-label">Recommended Next</div><h3>'+E(title)+'</h3><p>'+E(detail)+'</p></div><a class="mymsk-primary" href="'+E(href(rec))+'">'+E(label)+' →</a></div>';
}
async function load(){
 css();const r=mount();if(!window.supabase){r.innerHTML='<div class="mymsk-load">My MSK could not connect. Refresh to try again.</div>';return}
 try{
  sb=sb||window.supabase.createClient(URL,KEY);
  const ses=await sb.auth.getSession(),user=ses.data&&ses.data.session&&ses.data.session.user;
  if(!user)return signedOut(r);
  await Promise.all([script('shared/msk-weakness-radar.js','MSKWeaknessRadar'),script('shared/msk-recommendation-engine.js','MSKRecommendationEngine')]);
  const uid=user.id;
  const all=await Promise.all([
   sb.from('profiles').select('display_name').eq('id',uid).maybeSingle(),
   sb.from('question_attempts').select('topic,difficulty,is_correct,confidence,answered_at,week,lecture,module_key').eq('user_id',uid).eq('module_key',MOD).order('answered_at',{ascending:false}).limit(2000),
   sb.from('review_items').select('status,next_due_at,review_reasons,manually_filed,miss_count,topic,lecture,week,module_key').eq('user_id',uid).eq('module_key',MOD).limit(2000),
   sb.rpc('get_msk_individual_leaderboard'),
   sb.from('module_notes').select('id',{count:'exact',head:true}).eq('user_id',uid).eq('module_key',MOD),
   sb.from('lecture_progress').select('content_id,content_type,completed,week,module').eq('user_id',uid).eq('module',MOD).eq('week',13)
  ]);
  const leaders=all[3].data||[],leader=leaders.find(x=>x.is_current_user)||null;
  render(r,{profile:all[0].data||null,attempts:all[1].data||[],reviews:all[2].data||[],leader:leader,notes:Number(all[4].count||0),progress:all[5].data||[]});
 }catch(e){console.error('My MSK dashboard failed',e);r.innerHTML='<div class="mymsk-load">Your MSK snapshot could not load right now. The rest of the hub is still available.</div>'}
}
function start(){let n=0;const go=()=>{if(window.supabase&&document.querySelector('main'))return load();if(n++>30)return;setTimeout(go,150)};go()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();