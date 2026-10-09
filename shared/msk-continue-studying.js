(()=>{
'use strict';
if(window.__MSK_CONTINUE_STUDYING_LOADED__)return;
window.__MSK_CONTINUE_STUDYING_LOADED__=true;

const SUPABASE_URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
const SUPABASE_KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
const MODULE_KEY='msk';
const LOCAL_KEY='mskResumeState';

function cleanTitle(){
  const h1=document.querySelector('h1');
  let title=(h1&&h1.textContent||document.title||'MSK Study Resource').trim();
  title=title.replace(/\s*[·|–-]\s*(Musculoskeletal-Skin|MSK-Skin|MegaHub).*$/i,'').trim();
  return title||'MSK Study Resource';
}

function relativePath(){
  const marker='/Foundations-of-med--2030/';
  let p=location.pathname||'';
  if(p.includes(marker))p=p.split(marker)[1];
  else p=p.replace(/^\/+/,'');
  return p+(location.search||'');
}

function classify(path){
  const p=path.toLowerCase();
  if(p.includes('companion'))return 'Companion';
  if(p.includes('factoid'))return 'Factoid';
  if(p.includes('msk-drug-hub'))return 'Drug Hub';
  if(p.includes('msk-pathology-hub'))return 'Pathology Hub';
  if(p.includes('gross-anatomy'))return 'Gross Anatomy';
  if(p.includes('msk-cbl'))return 'CBL';
  if(p.includes('msk-review-center'))return 'Smart Review';
  if(p.includes('adaptive-quiz-builder'))return 'Adaptive Quiz';
  if(p.includes('msk-notebook'))return 'Notebook';
  if(p.includes('lecture-hub'))return 'Lecture Hub';
  if(/weeks\/week\d+\/index\.html/i.test(path))return 'Weekly Hub';
  return 'Study Resource';
}

function buildState(){
  const url=relativePath();
  const weekMatch=url.match(/week(\d+)/i);
  const lectureMatch=url.match(/lecture(\d+)/i);
  return {
    module_key:MODULE_KEY,
    resource_title:cleanTitle(),
    resource_url:url,
    resource_type:classify(url),
    week:weekMatch?Number(weekMatch[1]):null,
    lecture:lectureMatch?('Lecture '+Number(lectureMatch[1])):null,
    updated_at:new Date().toISOString()
  };
}

function saveLocal(state){
  try{localStorage.setItem(LOCAL_KEY,JSON.stringify(state))}catch(e){}
}

async function ensureSupabase(){
  if(window.supabase)return true;
  await new Promise(resolve=>{
    const existing=[...document.scripts].find(s=>s.src&&s.src.includes('@supabase/supabase-js'));
    if(existing){
      if(window.supabase)return resolve();
      existing.addEventListener('load',resolve,{once:true});
      setTimeout(resolve,900);
      return;
    }
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=resolve;s.onerror=resolve;
    document.head.appendChild(s);
  });
  return !!window.supabase;
}

async function sync(){
  const state=buildState();
  saveLocal(state);
  if(!(await ensureSupabase()))return;
  try{
    const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const res=await sb.auth.getSession();
    const user=res.data&&res.data.session&&res.data.session.user;
    if(!user)return;
    await sb.from('module_resume_state').upsert({
      user_id:user.id,
      module_key:MODULE_KEY,
      resource_title:state.resource_title,
      resource_url:state.resource_url,
      resource_type:state.resource_type,
      week:state.week,
      lecture:state.lecture,
      updated_at:state.updated_at
    },{onConflict:'user_id,module_key'});
  }catch(e){
    console.error('MSK continue studying sync failed',e);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,120),{once:true});
else setTimeout(sync,120);
})();