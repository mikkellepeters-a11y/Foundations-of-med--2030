/* MSK Week 13 Monday — Supabase sync for the approved single-file vignette layout. */
(() => {
  if (window.__MSK_W13_MON_SYNC__ || !window.supabase || typeof BANK === 'undefined' || typeof state === 'undefined') return;
  window.__MSK_W13_MON_SYNC__ = true;
  const client = window.supabase.createClient('https://ofqfdnxpftifnvxnvppe.supabase.co', 'sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G');
  const quizId = 'msk-week13-monday';
  const letters = ['A','B','C','D','E'];
  const confidence = {high:'confident', medium:'unsure', low:'guessing'};
  const status = document.createElement('div');
  status.id = 'mskSyncStatus';
  status.style.cssText = 'margin:12px auto;max-width:980px;padding:10px 15px;font:700 12px system-ui;color:#286747';
  status.textContent = 'My Profile sync is available when signed in.';
  document.querySelector('main')?.appendChild(status);
  function msg(value){status.textContent=value;}
  async function session(){
    const {data,error}=await client.auth.getSession();
    if(error) throw error;
    return data.session;
  }
  const txt=(q,l)=>q.options[letters.indexOf(l)] || null;
  let busy=false;
  async function syncResults(){
    if(busy) return;
    const qs=list();
    if(!qs.length || qs.some(q=>!state.answers[q.id])) return;
    const fingerprint=state.difficulty+'|'+qs.map(q=>q.id+':'+state.answers[q.id]).join('|');
    if(state.syncedFingerprint===fingerprint){msg('Synced to My Profile ✓');return;}
    busy=true;
    try{
      const auth=await session();
      if(!auth?.user){msg('Guest mode — results remain in this browser. Sign in to sync with My Profile.');return;}
      msg('Syncing results to My Profile…');
      const now=new Date().toISOString();
      const correct=qs.filter(q=>state.answers[q.id]===q.answer).length;
      const token='msk-w13-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      const {error:quizError}=await client.from('quiz_attempts').insert({
        user_id:auth.user.id,quiz_id:quizId,quiz_name:'MSK Week 13 Monday',
        score:correct,total_questions:qs.length,percentage:correct*100/qs.length,
        mode:'advanced-review',module_key:'msk',attempt_token:token,completed_at:now,
        metadata:{module:'Musculoskeletal–Skin',week:'13',day:'Monday',difficulty_filter:state.difficulty}
      });
      if(quizError) throw quizError;
      const rows=qs.map(q=>({
        user_id:auth.user.id,quiz_id:quizId,question_id:String(q.id),
        topic:q.topic||'MSK',difficulty:q.difficulty,
        selected_answer:txt(q,state.answers[q.id]),correct_answer:txt(q,q.answer),
        is_correct:state.answers[q.id]===q.answer,
        confidence:confidence[state.conf[q.id]]||null,answered_at:now,module_key:'msk',
        week:'13',lecture:String(q.lecture),attempt_token:token,
        metadata:{answer_letter:state.answers[q.id],correct_letter:q.answer,hint_used:!!state.hints[q.id]}
      }));
      const {error:questionError}=await client.from('question_attempts').insert(rows);
      if(questionError) throw questionError;
      state.syncedFingerprint=fingerprint;
      persist();
      msg('Synced to My Profile ✓');
    }catch(e){console.error('MSK sync failed',e);msg('Sync failed: '+(e?.message||'Unknown error'));}
    finally{busy=false;}
  }
  async function syncFlag(q,on){
    try{
      const auth=await session();if(!auth?.user)return;
      if(on){
        const {error}=await client.from('review_items').upsert({
          user_id:auth.user.id,quiz_id:quizId,question_id:String(q.id),
          reason:'Manual review',note:q.topic||null,updated_at:new Date().toISOString()
        },{onConflict:'user_id,quiz_id,question_id'});
        if(error) throw error;
      }else{
        const {error}=await client.from('review_items').delete()
          .eq('user_id',auth.user.id).eq('quiz_id',quizId).eq('question_id',String(q.id));
        if(error) throw error;
      }
    }catch(e){console.warn('MSK flag sync failed',e);}
  }
  const previousResults=results;
  results=function(){previousResults();void syncResults();};
  document.getElementById('resultOverlay')?.addEventListener('click',event=>{if(event.target.id==='resetQuiz'){delete state.syncedFingerprint;persist();}});
  async function hydrateFlags(){
    try{
      const auth=await session();if(!auth?.user)return;
      const {data,error}=await client.from('review_items').select('question_id')
        .eq('user_id',auth.user.id).eq('quiz_id',quizId);
      if(error)throw error;
      for(const item of data||[])state.flag[String(item.question_id)]=true;
      persist();render();
    }catch(error){console.warn('Could not load MSK Filed for Review flags',error);}
  }
  void hydrateFlags();
  document.getElementById('explainOverlay')?.addEventListener('click',event=>{
    if(event.target?.id==='reviewFlag'){
      const q=current();if(q)void syncFlag(q,!!state.flag[q.id]);
    }
  });
  document.getElementById('flagBtn')?.addEventListener('click',()=>{
    const q=current();if(q) void syncFlag(q,!!state.flag[q.id]);
  });
})();
