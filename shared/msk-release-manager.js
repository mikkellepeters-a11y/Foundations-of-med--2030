(()=>{
'use strict';
if(window.__MSK_RELEASE_MANAGER_LOADED__)return;
window.__MSK_RELEASE_MANAGER_LOADED__=true;

const URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
const KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
let sb=null,isAdmin=false,states=[];

function effective(row){
  if(row.status==='scheduled'&&row.release_at&&new Date(row.release_at)<=new Date())return 'live';
  return row.status;
}
function accessible(row){
  const s=effective(row);
  return s==='live'||s==='archived'||(isAdmin&&s==='admin_preview');
}
function hrefFor(week){return 'weeks/week'+week+'/index.html';}
function cardFor(week){return document.querySelector('[data-name="MSK-Skin Week '+week+'"]');}

function markOpen(card,row){
  const week=row.week,s=effective(row),preview=s==='admin_preview';
  card.classList.remove('locked-card','placeholder');
  if(card.classList.contains('week-card'))card.classList.add('active-card');
  card.setAttribute('href',hrefFor(week));
  card.setAttribute('data-msk-release-open','1');
  card.removeAttribute('onclick');card.onclick=null;
  const badge=card.querySelector('.locked-badge');if(badge)badge.style.display='none';
  const top=card.querySelector('.card-top');
  let label=card.querySelector('.week-label');
  if(top&&!label){label=document.createElement('span');label.className='week-label';top.appendChild(label);}
  if(label)label.textContent='Week '+week;
  let previewBadge=card.querySelector('.release-preview-badge');
  if(preview){
    if(!previewBadge&&top){
      previewBadge=document.createElement('span');
      previewBadge.className='release-preview-badge';
      previewBadge.textContent='Admin Preview';
      previewBadge.style.cssText='display:inline-flex;margin-left:6px;padding:5px 7px;border-radius:999px;background:#fff4dc;border:1px solid #ead6a4;color:#6c5625;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.05em';
      top.appendChild(previewBadge);
    }
  }else if(previewBadge){previewBadge.remove();}
}
function markLocked(card,row){
  if(!card)return;
  card.removeAttribute('data-msk-release-open');
  if(row.week!==13){
    card.classList.remove('active-card');
    card.classList.add('locked-card');
    card.setAttribute('href','#');
  }
  card.querySelector('.release-preview-badge')?.remove();
  const badge=card.querySelector('.locked-badge');if(badge)badge.style.removeProperty('display');
}
function apply(){
  states.forEach(row=>{
    const card=cardFor(row.week);if(!card)return;
    if(accessible(row))markOpen(card,row);else markLocked(card,row);
  });
}
async function ensureSupabase(){
  if(window.supabase)return true;
  await new Promise(resolve=>{
    const existing=[...document.scripts].find(s=>s.src&&s.src.includes('@supabase/supabase-js'));
    if(existing){existing.addEventListener('load',resolve,{once:true});setTimeout(resolve,800);return;}
    const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s);
  });
  return !!window.supabase;
}
async function refresh(){
  if(!(await ensureSupabase()))return;
  sb=sb||window.supabase.createClient(URL,KEY);
  try{
    const [releaseRes,userRes]=await Promise.all([
      sb.from('module_release_states').select('module_key,week,title,status,release_at').eq('module_key','msk').order('week'),
      sb.auth.getUser()
    ]);
    if(!releaseRes.error)states=releaseRes.data||[];
    const user=userRes.data?.user||null;
    isAdmin=false;
    if(user){
      const adminRes=await sb.rpc('is_site_admin');
      isAdmin=!adminRes.error&&adminRes.data===true;
    }
    apply();
  }catch(e){console.error('MSK release manager failed',e);}
}
document.addEventListener('click',e=>{
  const card=e.target.closest&&e.target.closest('[data-msk-release-open="1"]');
  if(!card)return;
  const name=card.getAttribute('data-name')||'';
  const m=name.match(/Week\s+(\d+)/i);if(!m)return;
  e.preventDefault();e.stopImmediatePropagation();location.href=hrefFor(Number(m[1]));
},true);

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,220),{once:true});
else setTimeout(refresh,220);
window.addEventListener('focus',()=>setTimeout(refresh,100));
setTimeout(refresh,900);
})();