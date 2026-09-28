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

  function recoverEmptyQuestionArea(){
    const host=document.getElementById('quiz');
    if(!host||host.querySelector('.question'))return false;

    let bank=null;
    try{bank=(typeof QUESTIONS!=='undefined'&&Array.isArray(QUESTIONS))?QUESTIONS:null}catch(_){bank=null}
    if(!bank||!bank.length)return false;

    // First retry the page's native renderer. This preserves the full legacy
    // behavior when the original startup path simply stopped early.
    try{
      if(typeof renderQuiz==='function'){
        renderQuiz();
        if(host.querySelector('.question'))return true;
      }
    }catch(err){
      console.warn('Native CBL renderer retry failed; using recovery renderer.',err);
    }

    // Defensive recovery renderer: use the existing QUESTIONS bank without
    // rewriting any content. Existing choice/confidence/flag handlers are used
    // where available, with simple local fallbacks so the quiz is never blank.
    const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    host.innerHTML='';
    bank.forEach(q=>{
      if(!q||!Array.isArray(q.options))return;
      const article=document.createElement('article');
      article.className='question';
      article.id='q-'+q.number;
      const addon=q.source==='High-Yield Add-on';
      const shared=q.shared?`<div class="shared">${q.shared}</div>`:'';
      const imgs=Array.isArray(q.images)&&q.images.length?`<div class="imggrid">${q.images.map(x=>`<div class="figure"><img src="${x.src||''}" alt=""><small>${x.caption||''}</small></div>`).join('')}</div>`:'';
      let flag='';
      try{if(typeof flagButtonHTML==='function')flag=flagButtonHTML(q.number)}catch(_){ }
      let conf='';
      try{if(typeof confidenceHTML==='function')conf=confidenceHTML(q.number)}catch(_){ }
      article.innerHTML=`<div class="qtop"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div class="qnum">Question ${q.number}</div><div class="tags"><span class="tag ${addon?'addon':''}">${q.source||'CBL'}</span></div></div>${flag}</div>${shared}<div class="stem">${q.stem||''}</div>${imgs}<div class="choices"></div>${conf}<div class="feedback" id="fb-${q.number}"></div>`;
      const box=article.querySelector('.choices');
      q.options.forEach((opt,i)=>{
        const L=letters[i];
        const row=document.createElement('div');
        row.className='choice-row';
        row.innerHTML=`<button type="button" class="choice" data-l="${L}"><span class="choice-letter">${L}</span><span class="choice-copy">${opt}</span></button><button type="button" class="strike" data-s="${L}">S̶</button>`;
        const choice=row.querySelector('.choice');
        choice.onclick=()=>{
          try{
            if(typeof choose==='function'){choose(q.number,L);return;}
          }catch(err){console.warn('CBL choice handler recovery',err)}
          article.querySelectorAll('.choice').forEach(b=>b.classList.remove('selected'));
          choice.classList.add('selected');
          try{responses[q.number]=L}catch(_){ }
        };
        const strike=row.querySelector('.strike');
        strike.onclick=()=>{
          try{
            if(typeof toggleStrike==='function'){toggleStrike(q.number,L);return;}
          }catch(err){console.warn('CBL strike handler recovery',err)}
          choice.classList.toggle('struck');
          strike.classList.toggle('active');
        };
        box.appendChild(row);
      });
      article.querySelectorAll('.confidence-btn').forEach(btn=>{
        btn.onclick=()=>{
          try{confidence[q.number]=btn.dataset.c}catch(_){ }
          article.querySelectorAll('.confidence-btn').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
        };
      });
      try{if(typeof bindFlagButton==='function')bindFlagButton(article,q.number)}catch(_){ }
      host.appendChild(article);
    });

    try{if(typeof applyFlagFilter==='function')applyFlagFilter()}catch(_){ }
    try{if(typeof updateProgress==='function')updateProgress()}catch(_){ }
    return !!host.querySelector('.question');
  }

  // Legacy CBL pages parse their saved flag state before rendering. If that
  // cache is malformed, the page aborts before renderQuiz() runs. Recover the
  // bad cache and reload once so the existing question bank can render again.
  if(recoverCorruptFlagCache())return;

  // A few older CBL files can reach the shared integration with an empty quiz
  // container even though their QUESTIONS bank is still present. Recover the
  // native renderer immediately, then verify once more after full page load.
  recoverEmptyQuestionArea();
  window.addEventListener('load',()=>setTimeout(recoverEmptyQuestionArea,0));

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
