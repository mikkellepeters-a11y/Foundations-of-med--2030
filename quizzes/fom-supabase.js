/* Shared Supabase tracking for canonical Foundations of Medicine quizzes. */
(() => {
  if (typeof window.supabase === 'undefined' || typeof QUIZ_KEY === 'undefined' || typeof QUESTIONS === 'undefined') return;

  const SUPABASE_URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
  const SUPABASE_KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const quizId=String(QUIZ_KEY);
  const weekMatch=quizId.match(/^week(\d+)-/i);
  const week=weekMatch?Number(weekMatch[1]):null;
  const section=/comprehensive/i.test(quizId)?'Comprehensive':/prequiz/i.test(quizId)?'Prequiz':/daily/i.test(quizId)?'Daily Quiz':/sal/i.test(quizId)?'SAL':/hpc/i.test(quizId)?'HPC':/review/i.test(quizId)?'Review':'Foundations Quiz';
  const quizName=(document.querySelector('h1')?.textContent||document.title||quizId).trim();
  let attemptSaved=false;

  function statusEl(){
    let el=document.getElementById('fomSupabaseStatus');
    if(el)return el;
    const host=document.querySelector('.review-box')||document.querySelector('.result-content')||document.querySelector('.result-card');
    if(!host)return null;
    el=document.createElement('div');
    el.id='fomSupabaseStatus';
    el.style.cssText='margin-top:10px;padding:8px 10px;border:1px solid var(--line,#ddd);border-radius:10px;font-size:10px;font-weight:750;color:var(--muted,#78695f);background:rgba(255,255,255,.45)';
    host.appendChild(el);
    return el;
  }
  function setStatus(text,kind='neutral'){
    const el=statusEl();if(!el)return;
    el.textContent=text;
    el.style.color=kind==='error'?'var(--bad,#92584f)':kind==='ok'?'var(--good,#55704e)':'var(--muted,#78695f)';
  }
  function confidenceValue(v){
    const x=String(v||'').toLowerCase();
    if(x==='confident'||x==='high')return 'confident';
    if(x==='unsure'||x==='medium')return 'unsure';
    if(x==='guessing'||x==='low')return 'guessing';
    return null;
  }
  function choiceText(q,letter){
    if(!letter||!Array.isArray(q.options))return letter||null;
    const i='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(String(letter).toUpperCase());
    return i>=0?(q.options[i]??letter):letter;
  }
  async function session(){
    const {data:{session},error}=await client.auth.getSession();
    if(error)throw error;
    return session;
  }
  async function syncReview(qn,on){
    try{
      const s=await session();if(!s?.user)return;
      if(on){
        const {error}=await client.from('review_items').upsert({user_id:s.user.id,quiz_id:quizId,question_id:String(qn),reason:'Manual review',updated_at:new Date().toISOString()},{onConflict:'user_id,quiz_id,question_id'});
        if(error)throw error;
      }else{
        const {error}=await client.from('review_items').delete().eq('user_id',s.user.id).eq('quiz_id',quizId).eq('question_id',String(qn));
        if(error)throw error;
      }
    }catch(err){console.error('Filed for Review sync failed',err);setStatus('Could not sync Filed for Review.','error')}
  }

  const originalSetManualFlag=typeof setManualFlag==='function'?setManualFlag:null;
  if(originalSetManualFlag){
    setManualFlag=function(qn,on){const out=originalSetManualFlag.apply(this,arguments);syncReview(qn,!!on);return out};
  }
  if(window.ReviewBank?.fileItem){
    const originalFileItem=window.ReviewBank.fileItem.bind(window.ReviewBank);
    window.ReviewBank.fileItem=function(item){const out=originalFileItem(item);if(item?.sourceQuiz===quizId&&item?.number!=null)syncReview(item.number,true);return out};
  }

  async function loadRemoteReview(){
    if(!originalSetManualFlag)return;
    try{
      const s=await session();if(!s?.user)return;
      const {data,error}=await client.from('review_items').select('question_id').eq('user_id',s.user.id).eq('quiz_id',quizId);
      if(error)throw error;
      (data||[]).forEach(r=>{const n=Number(r.question_id);if(Number.isFinite(n))originalSetManualFlag(n,true)});
    }catch(err){console.warn('Could not load Filed for Review items',err)}
  }

  async function syncAttempt(){
    if(attemptSaved)return;
    const answered=QUESTIONS.filter(q=>responses?.[q.number]!==undefined);
    if(!QUESTIONS.length||!answered.length)return;
    try{
      const s=await session();
      if(!s?.user){setStatus('Guest mode — this result stays local. Sign in before grading to sync.');return}
      setStatus('Syncing to My Profile…');
      const completedAt=new Date().toISOString();
      const correct=QUESTIONS.filter(q=>responses?.[q.number]===q.answer).length;
      const total=QUESTIONS.length;
      const percentage=total?correct/total*100:0;
      const {error:quizError}=await client.from('quiz_attempts').insert({
        user_id:s.user.id,quiz_id:quizId,quiz_name:quizName,score:correct,total_questions:total,percentage,
        mode:typeof mode==='string'?mode:null,completed_at:completedAt,
        metadata:{module:'Foundations of Medicine',week,section,answered_questions:answered.length}
      });
      if(quizError)throw quizError;
      const rows=answered.map(q=>({
        user_id:s.user.id,quiz_id:quizId,question_id:String(q.number),
        topic:q.lecture||q.topic||'Foundations of Medicine',difficulty:q.difficulty||null,
        selected_answer:choiceText(q,responses[q.number]),correct_answer:choiceText(q,q.answer),
        is_correct:responses[q.number]===q.answer,confidence:confidenceValue(confidence?.[q.number]),answered_at:completedAt,
        metadata:{module:'Foundations of Medicine',week,section,lecture:q.lecture||null,original_topic:q.topic||null,concept:q.concept||null,mode:typeof mode==='string'?mode:null}
      }));
      if(rows.length){const {error:qError}=await client.from('question_attempts').insert(rows);if(qError)throw qError}
      attemptSaved=true;setStatus('Synced to My Profile ✓','ok');
    }catch(err){console.error('Foundations Supabase sync failed',err);setStatus('Supabase sync failed: '+(err?.message||'Unknown error'),'error')}
  }

  if(typeof showResults==='function'){
    const originalShowResults=showResults;
    showResults=function(){const out=originalShowResults.apply(this,arguments);syncAttempt();return out};
  }
  if(typeof resetState==='function'){
    const originalResetState=resetState;
    resetState=function(){attemptSaved=false;return originalResetState.apply(this,arguments)};
  }

  loadRemoteReview();
})();
