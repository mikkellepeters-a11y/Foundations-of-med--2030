(()=>{
'use strict';
const script=document.currentScript;
const week=Number(script?.dataset?.week||(location.pathname.match(/week(\d+)/i)||[])[1]||0);
const status=document.getElementById('statusWrap');
const shell=document.getElementById('adminShell');
const URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
const KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';

const deny=(message)=>{
  if(shell)shell.hidden=true;
  if(status){
    status.hidden=false;
    status.innerHTML='<h2>Week '+week+' is locked</h2><p></p><a href="../../MSK.html">← Return to MSK Hub</a>';
    status.querySelector('p').textContent=message||'This week has not been released yet.';
  }
};
const allow=()=>{
  if(status)status.hidden=true;
  if(shell)shell.hidden=false;
};
const effective=row=>{
  if(row?.status==='scheduled'&&row.release_at&&new Date(row.release_at)<=new Date())return 'live';
  return row?.status||'draft';
};
async function boot(){
  if(!window.supabase){deny('Release verification is unavailable right now.');return;}
  const sb=window.supabase.createClient(URL,KEY);
  try{
    const releaseRes=await sb.from('module_release_states').select('status,release_at').eq('module_key','msk').eq('week',week).maybeSingle();
    const row=releaseRes.data||{status:'draft',release_at:null};
    const state=effective(row);
    if(state==='live'||state==='archived'){allow();return;}
    const userRes=await sb.auth.getUser();
    const user=userRes.data?.user||null;
    if(user){
      const adminRes=await sb.rpc('is_site_admin');
      if(!adminRes.error&&adminRes.data===true){allow();return;}
    }
    if(state==='scheduled'&&row.release_at){
      deny('This week is scheduled to open '+new Date(row.release_at).toLocaleString()+'.');
    }else if(state==='admin_preview'){
      deny('This week is currently in administrator preview.');
    }else{
      deny('This week has not been released yet.');
    }
  }catch(e){console.error('MSK week release gate failed',e);deny('Could not verify this week\'s release status.');}
}
boot();
})();