/* Shared Supabase integration for legacy CBL quizzes (Weeks 3-9). */
(() => {
  function recoverCorruptFlagCache(){
    let key=null;
    try{
      if(typeof FLAG_KEY==='string') key=FLAG_KEY;
      else if(typeof QUIZ_KEY==='string') key='cbl-flags:'+QUIZ_KEY;
    }catch(_){ }
    if(!key)return false;
    let raw=null;
    try{raw=localStorage.getItem(key)}catch(_){return false}
    if(!raw)return false;
    try{JSON.parse(raw);return false}catch(_){
      try{localStorage.removeItem(key)}catch(__){ }
      const once='cbl-flag-recovery:'+key;
      try{
        if(sessionStorage.getItem(once)!=='1'){
          sessionStorage.setItem(once,'1');
          location.reload();
          return true;
        }
      }catch(__){
        location.reload();
        return true;
      }
    }
    return false;
  }

  // Legacy CBL pages parse their saved flag state before rendering. If that
  // cache is malformed, the page aborts before renderQuiz() runs. Recover the
  // bad cache and reload once so the existing question bank can render again.
  if(recoverCorruptFlagCache())return;

  if(window.__CBL_SUPABASE_INTEGRATION__)return;
  if (typeof window.supabase === 'undefined' || typeof QUESTIONS === 'undefined' || typeof QUIZ_KEY === 'undefined') return;
  window.__CBL_SUPABASE_INTEGRATION__=true;
  const SUPABASE_URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
  const SUPABASE_KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const match=String(QUIZ_KEY).match(/^week(\d+)-cbl-case-(\d+)$/i);
  const week=match?Number(match[1]):null;
  const QUIZ_NAME=week?`Week ${week} · CBL Case Quiz`:'CBL Case Quiz';
  let saved=false;

  function statusEl(){
    let el=document.getElementById('cblSupabaseStatus');
    if(el)return el;
    const box=document.querySelector('.review-box') || document.querySelector('.result-content');
    if(!box)return null;
    el=document.createElement('div'); el.id='cblSupabaseStatus';
    el.style.cssText='margin-top:10px;font-size:11px;font-weight:700;color:var(--muted,#78695f)';
    box.appendChild(el); return el;
  }
  function setStatus(text,ok=false,bad=false){const el=statusEl();if(!el)return;el.textContent=text;el.style.color=bad?'var(--bad,#9a554c)':ok?'var(--good,#5f7957)':'var(--muted,#78695f)';}
  function mapConfidence(v){return v==='Confident'?'confident':v==='Unsure'?'unsure':v==='Guessing'?'guessing':null}
  function optionText(q,letter){if(!letter||!Array.isArray(q.options))return null;const i='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(letter);return i>=0?q.options[i]??letter:letter}

  async function getSession(){const {data:{session},error}=await client.auth.getSession();if(error)throw error;return session}
  async function loadReviewItems(){
    try{
      const session=await getSession(); if(!session?.user)return;
      const {data,error}=await client.from('review_items').select('question_id').eq('user_id',session.user.id).eq('quiz_id',QUIZ_KEY);
      if(error)throw error;
      const remote={};(data||[]).forEach(r=>{const n=Number(r.question_id);if(Number.isFinite(n))remote[n]=true});
      flags=remote;
      try{localStorage.setItem(FLAG_KEY,JSON.stringify(flags))}catch(_){ }
      if(typeof refreshFlagButtons==='function')refreshFlagButtons();
      if(typeof applyFlagFilter==='function')applyFlagFilter();
    }catch(err){console.warn('Could not load Filed for Review items',err)}
  }
  async function syncFlag(qn,on){
    try{
      const session=await getSession(); if(!session?.user)return;
      if(on){
        const {error}=await client.from('review_items').upsert({user_id:session.user.id,quiz_id:QUIZ_KEY,question_id:String(qn),reason:'Manual review',updated_at:new Date().toISOString()},{onConflict:'user_id,quiz_id,question_id'});
        if(error)throw error;
      }else{
        const {error}=await client.from('review_items').delete().eq('user_id',session.user.id).eq('quiz_id',QUIZ_KEY).eq('question_id',String(qn));
        if(error)throw error;
      }
    }catch(err){console.error('Filed for Review sync failed',err);setStatus('Could not sync Filed for Review.',false,true)}
  }
  async function syncAttempt(){
    if(saved)return;
    const total=QUESTIONS.length;
    const answered=QUESTIONS.filter(q=>responses[q.number]!==undefined);
    if(!total)return;
    try{
      const session=await getSession();
      if(!session?.user){setStatus('Guest mode — result stays local; sign in before grading to sync.',false,false);return}
      setStatus('Syncing to My Profile…');
      const score=QUESTIONS.filter(q=>responses[q.number]===q.answer).length;
      const completedAt=new Date().toISOString();
      const percentage=score/total*100;
      const {error:quizError}=await client.from('quiz_attempts').insert({user_id:session.user.id,quiz_id:QUIZ_KEY,quiz_name:QUIZ_NAME,score,total_questions:total,percentage,mode:typeof mode==='string'?mode:null,completed_at:completedAt,metadata:{week,section:'CBL',answered_questions:answered.length}});
      if(quizError)throw quizError;
      if(answered.length){
        const rows=answered.map(q=>({user_id:session.user.id,quiz_id:QUIZ_KEY,question_id:String(q.number),topic:week?`Week ${week} CBL`:'CBL',difficulty:q.difficulty||null,selected_answer:optionText(q,responses[q.number]),correct_answer:optionText(q,q.answer),is_correct:responses[q.number]===q.answer,confidence:mapConfidence(confidence[q.number]),answered_at:completedAt,metadata:{source:q.source||null,mode:typeof mode==='string'?mode:null}}));
        const {error:qError}=await client.from('question_attempts').insert(rows); if(qError)throw qError;
      }
      saved=true;setStatus('Synced to My Profile ✓',true,false);
    }catch(err){console.error('Supabase sync failed',err);setStatus('Supabase sync failed: '+(err?.message||'Unknown error'),false,true)}
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-flag-q]'); if(!btn)return;
    const qn=Number(btn.dataset.flagQ); setTimeout(()=>syncFlag(qn,!!flags[qn]),0);
  });

  if(typeof showResults==='function'){
    const originalShowResults=showResults;
    showResults=function(){const out=originalShowResults.apply(this,arguments);setStatus('Preparing sync…');syncAttempt();return out};
  }
  if(typeof resetState==='function'){
    const originalResetState=resetState;
    resetState=function(){saved=false;return originalResetState.apply(this,arguments)};
  }
  loadReviewItems();
})();
