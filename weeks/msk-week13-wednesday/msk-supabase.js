/* Week 13 Wednesday · approved quiz My Profile and MSK Smart Review integration */
(() => {
  if (window.__MSK_W13_WED_SYNC__ || !window.supabase || typeof BANK === 'undefined' || typeof state === 'undefined') return;
  window.__MSK_W13_WED_SYNC__ = true;
  const client = window.supabase.createClient('https://ofqfdnxpftifnvxnvppe.supabase.co','sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G');
  const quizId='msk-week13-wednesday';
  const status=document.createElement('div');
  status.id='mskSyncStatus';
  status.style.cssText='margin:12px auto;max-width:980px;padding:10px 15px;font:700 12px system-ui;color:#286747;';
  const label=document.createElement('span');
  const retry=document.createElement('button');
  retry.type='button';retry.textContent='Retry My Profile Sync';
  retry.style.cssText='margin-left:12px;padding:7px 12px;border-radius:9px;border:1px solid #bcd1c3;background:#eef6ef;color:#205a3c;cursor:pointer;font:700 11px system-ui';
  status.append(label,retry);document.querySelector('main')?.append(status);
  function msg(s){label.textContent=s;retry.hidden=s.includes('✓');}
  msg('My Profile sync is available when signed in.');
  async function auth(){const {data,error}=await client.auth.getSession();if(error)throw error;return data.session;}
  let busy=false;
  function questions(){return BANK.filter(x=>difficulty==='All'||x.difficulty===difficulty);}
  function completed(){const qs=questions();return qs.length>0&&qs.every(x=>state.answers?.[x.id]?.submitted);}
  function fingerprint(qs){return difficulty+'|'+qs.map(x=>x.id+':'+state.answers[x.id].selected).join('|');}
  async function syncResults(){
    if(busy||!completed())return;
    const qs=questions(),fp=fingerprint(qs);
    if(state.syncedFingerprint===fp){msg('Synced to My Profile ✓');return;}
    busy=true;
    try{
      const session=await auth();
      if(!session?.user){msg('Guest mode — progress stays in this browser. Sign in to sync with My Profile.');return;}
      msg('Syncing results to My Profile…');
      const now=new Date().toISOString();
      const correct=qs.filter(x=>state.answers[x.id].selected===x.answer).length;
      const token='msk-w13-wed-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      const attempt={
        user_id:session.user.id,quiz_id:quizId,quiz_name:'MSK Week 13 Wednesday',
        score:correct,total_questions:qs.length,percentage:100*correct/qs.length,
        mode:'advanced-review',module_key:'msk',attempt_token:token,completed_at:now,
        metadata:{module:'Musculoskeletal–Skin',week:'13',day:'Wednesday',difficulty_filter:difficulty}
      };
      const {error:attemptError}=await client.from('quiz_attempts').insert(attempt);
      if(attemptError)throw attemptError;
      const confidence={high:'confident',medium:'unsure',low:'guessing'};
      const rows=qs.map(x=>{
        const selected=state.answers[x.id].selected;
        return {
          user_id:session.user.id,quiz_id:quizId,question_id:String(x.id),module_key:'msk',
          topic:x.topic||'MSK',difficulty:x.difficulty,week:'13',
          lecture:[1,2,3,6,7,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25].includes(x.id)?'8':'9',
          selected_answer:x.options[selected]?.label||'',correct_answer:x.options[x.answer]?.label||'',
          is_correct:selected===x.answer,
          confidence:confidence[state.conf?.[x.id]]||null,answered_at:now,attempt_token:token,
          metadata:{answer_letter:'ABCDE'[selected],correct_letter:'ABCDE'[x.answer]}
        };
      });
      const {error:questionError}=await client.from('question_attempts').insert(rows);
      if(questionError)throw questionError;
      state.syncedFingerprint=fp;save();msg('Synced to My Profile ✓');
    }catch(e){console.error('Wednesday MSK sync failed',e);msg('My Profile sync failed: '+(e?.message||'Unknown error'));}
    finally{busy=false;}
  }
  async function syncFlag(x,on){
    try{
      const session=await auth();
      if(!session?.user){msg('Sign in to save Filed for Review to My Profile.');return;}
      if(on){
        const {error}=await client.from('review_items').upsert({
          user_id:session.user.id,quiz_id:quizId,question_id:String(x.id),
          module_key:'msk',week:'13',lecture:[1,2,3,6,7,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25].includes(x.id)?'8':'9',
          topic:x.topic||'MSK',difficulty:x.difficulty,
          manually_filed:true,review_reasons:['filed'],status:'active',
          question_snapshot:{stem:x.stem,choices:x.options.map(o=>o.label),answer:'ABCDE'[x.answer],explanation:x.options[x.answer]?.explanation||'',optionExplanations:x.options.map(o=>o.explanation)},
          reason:'Manual review',note:x.topic||null,updated_at:new Date().toISOString()
        },{onConflict:'user_id,module_key,quiz_id,question_id'});
        if(error)throw error;msg('Saved to MSK Smart Review ✓');
      }else{
        const {error}=await client.from('review_items').delete().eq('user_id',session.user.id).eq('module_key','msk').eq('quiz_id',quizId).eq('question_id',String(x.id));
        if(error)throw error;msg('Removed from MSK Filed for Review ✓');
      }
    }catch(e){console.error('Wednesday review sync failed',e);msg('Filed for Review sync failed: '+(e?.message||'Unknown error'));}
  }
  const priorResults=results;
  results=function(){priorResults();void syncResults();};
  retry.onclick=()=>void syncResults();
  document.getElementById('flagBtn')?.addEventListener('click',()=>{
    const x=filtered[index];if(x)void syncFlag(x,!!state.flags[x.id]);
  });
  async function hydrateFlags(){
    try{
      const session=await auth();if(!session?.user)return;
      const {data,error}=await client.from('review_items').select('question_id').eq('user_id',session.user.id).eq('module_key','msk').eq('quiz_id',quizId);
      if(error)throw error;
      for(const x of data||[])state.flags[String(x.question_id)]=true;
      save();render();
    }catch(e){console.warn('Wednesday review hydrate failed',e);}
  }
  void hydrateFlags();
  if(completed())void syncResults();
  client.auth.onAuthStateChange(event=>{
    if(event==='SIGNED_IN')setTimeout(()=>{void hydrateFlags();if(completed())void syncResults();},0);
  });
})();
