(()=>{
  'use strict';

  const pathname=window.location.pathname;
  const isDrug=/\/drug-practice\/drug_practice_quiz_\d+\.html$/i.test(pathname);
  const isPathology=/\/pathology-hub\/pathology-practice\/pathology_practice_quiz_\d+\.html$/i.test(pathname);
  if(!isDrug&&!isPathology)return;

  if(typeof QUESTIONS==='undefined'||typeof state==='undefined'||typeof QUIZ_NUM==='undefined'||typeof QUIZ_KEY==='undefined'){
    console.warn('MegaHub sync: quiz globals were not found.');
    return;
  }

  const SUPABASE_URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
  const SUPABASE_KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
  const MODULE_NAME=isDrug?'Drug Hub':'Pathology Hub';
  const QUIZ_PREFIX=isDrug?'drug-practice':'pathology-practice';
  const QUIZ_LABEL=isDrug?'Drug Practice Quiz':'Pathology Practice Quiz';
  const QUIZ_NUMBER=Number(QUIZ_NUM);
  const QUIZ_ID=`${QUIZ_PREFIX}-${String(QUIZ_NUMBER).padStart(2,'0')}`;
  const QUIZ_NAME=`${QUIZ_LABEL} ${String(QUIZ_NUMBER).padStart(2,'0')}`;
  const TOKEN_KEY=`${QUIZ_KEY}:supabase-attempt-token`;
  const SYNC_PREFIX=`${QUIZ_KEY}:supabase-sync`;

  let client=null;
  let currentUser=null;
  const pending=new Set();

  function makeToken(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function attemptToken(){
    let value='';
    try{value=localStorage.getItem(TOKEN_KEY)||''}catch(e){}
    if(!value){
      value=makeToken();
      try{localStorage.setItem(TOKEN_KEY,value)}catch(e){}
    }
    return value;
  }

  function marker(type,suffix,token=attemptToken()){
    return `${SYNC_PREFIX}:${type}:${token}:${suffix}`;
  }

  function marked(key){
    try{return localStorage.getItem(key)==='1'}catch(e){return false}
  }

  function mark(key){
    try{localStorage.setItem(key,'1')}catch(e){}
  }

  function summary(){
    try{return JSON.parse(localStorage.getItem(SUMMARY_KEY)||'{}')}catch(e){return {}}
  }

  function loadSupabase(){
    return new Promise((resolve,reject)=>{
      if(window.supabase&&typeof window.supabase.createClient==='function'){
        resolve(window.supabase);
        return;
      }
      const existing=document.querySelector('script[data-megahub-supabase-loader]');
      if(existing){
        existing.addEventListener('load',()=>resolve(window.supabase),{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async=true;
      script.dataset.megahubSupabaseLoader='1';
      script.addEventListener('load',()=>resolve(window.supabase),{once:true});
      script.addEventListener('error',reject,{once:true});
      document.head.appendChild(script);
    });
  }

  function questionMetadata(question,token){
    const id=question.globalId;
    return {
      module:MODULE_NAME,
      section:'Practice Bank',
      source:'hub-practice',
      quiz_number:QUIZ_NUMBER,
      attempt_token:token,
      week:question.week??null,
      drug:question.drug??null,
      tags:Array.isArray(question.tags)?question.tags:[],
      hint_used:Boolean(state.hints&&state.hints[id]),
      source_page:window.location.pathname
    };
  }

  async function syncQuestion(question){
    if(!client||!currentUser||!question)return;
    const id=question.globalId;
    if(!state.submitted||!state.submitted[id])return;
    const token=attemptToken();
    const key=marker('question',String(id),token);
    if(marked(key)||pending.has(key))return;

    const payload={
      user_id:currentUser.id,
      quiz_id:QUIZ_ID,
      question_id:String(id),
      topic:question.topic||null,
      difficulty:question.difficulty||null,
      selected_answer:(state.answers&&state.answers[id])||null,
      correct_answer:question.answer||null,
      is_correct:Boolean(state.answers&&state.answers[id]===question.answer),
      confidence:(state.confidence&&state.confidence[id])||null,
      answered_at:new Date().toISOString(),
      metadata:questionMetadata(question,token)
    };

    pending.add(key);
    try{
      const {error}=await client.from('question_attempts').insert(payload);
      if(error)throw error;
      mark(key);
    }catch(error){
      console.warn(`MegaHub sync: question ${id} was not synced.`,error?.message||error);
    }finally{
      pending.delete(key);
    }
  }

  async function syncQuizCompletion(){
    if(!client||!currentUser||!state.completed)return;
    const token=attemptToken();
    const key=marker('quiz','complete',token);
    if(marked(key)||pending.has(key))return;

    const score=QUESTIONS.filter(question=>state.submitted&&state.submitted[question.globalId]&&state.answers&&state.answers[question.globalId]===question.answer).length;
    const total=QUESTIONS.length;
    const savedSummary=summary();
    const payload={
      user_id:currentUser.id,
      quiz_id:QUIZ_ID,
      quiz_name:QUIZ_NAME,
      score,
      total_questions:total,
      percentage:total?score/total*100:0,
      mode:'practice',
      completed_at:savedSummary.lastCompletedAt||new Date().toISOString(),
      metadata:{
        module:MODULE_NAME,
        section:'Practice Bank',
        source:'hub-practice',
        quiz_number:QUIZ_NUMBER,
        attempt_token:token,
        source_page:window.location.pathname
      }
    };

    pending.add(key);
    try{
      const {error}=await client.from('quiz_attempts').insert(payload);
      if(error)throw error;
      mark(key);
    }catch(error){
      console.warn('MegaHub sync: quiz completion was not synced.',error?.message||error);
    }finally{
      pending.delete(key);
    }
  }

  async function syncReview(question,flagged){
    if(!client||!currentUser||!question)return;
    const questionId=String(question.globalId);
    const operationKey=`review:${QUIZ_ID}:${questionId}`;
    if(pending.has(operationKey))return;
    pending.add(operationKey);

    try{
      const {data,error}=await client.from('review_items').select('id').eq('user_id',currentUser.id).eq('quiz_id',QUIZ_ID).eq('question_id',questionId);
      if(error)throw error;
      const existing=Array.isArray(data)?data:[];
      if(flagged&&!existing.length){
        const {error:insertError}=await client.from('review_items').insert({
          user_id:currentUser.id,
          quiz_id:QUIZ_ID,
          question_id:questionId,
          reason:`Flagged in ${MODULE_NAME}`,
          note:question.topic||null
        });
        if(insertError)throw insertError;
      }else if(!flagged&&existing.length){
        const {error:deleteError}=await client.from('review_items').delete().eq('user_id',currentUser.id).eq('quiz_id',QUIZ_ID).eq('question_id',questionId);
        if(deleteError)throw deleteError;
      }
    }catch(error){
      console.warn(`MegaHub sync: review flag for question ${questionId} was not synced.`,error?.message||error);
    }finally{
      pending.delete(operationKey);
    }
  }

  async function syncExisting(){
    if(!client||!currentUser)return;
    const submitted=QUESTIONS.filter(question=>state.submitted&&state.submitted[question.globalId]);
    await Promise.all(submitted.map(syncQuestion));
    if(state.completed)await syncQuizCompletion();
    if(typeof isFlagged==='function'){
      const flagged=QUESTIONS.filter(question=>{
        try{return isFlagged(question)}catch(e){return false}
      });
      await Promise.all(flagged.map(question=>syncReview(question,true)));
    }
  }

  function bindQuizEvents(){
    const submit=document.getElementById('submitBtn');
    const next=document.getElementById('nextBtn');
    const flag=document.getElementById('flagBtn');
    const retake=document.getElementById('retakeBtn');

    submit?.addEventListener('click',()=>{
      try{syncQuestion(typeof q==='function'?q():QUESTIONS[state.idx])}catch(e){}
    });

    next?.addEventListener('click',()=>{
      try{syncQuizCompletion()}catch(e){}
    });

    flag?.addEventListener('click',()=>{
      try{
        const question=typeof q==='function'?q():QUESTIONS[state.idx];
        const flagged=typeof isFlagged==='function'?isFlagged(question):false;
        syncReview(question,flagged);
      }catch(e){}
    });

    retake?.addEventListener('click',()=>{
      setTimeout(()=>{
        try{
          const submitted=Object.values(state.submitted||{}).filter(Boolean).length;
          if(!state.completed&&submitted===0){
            localStorage.removeItem(TOKEN_KEY);
            attemptToken();
          }
        }catch(e){}
      },0);
    });
  }

  async function init(){
    bindQuizEvents();
    attemptToken();
    try{
      await loadSupabase();
      if(!window.supabase||typeof window.supabase.createClient!=='function')return;
      client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      const {data,error}=await client.auth.getSession();
      if(error)console.warn('MegaHub sync: could not read account session.',error.message);
      currentUser=data?.session?.user||null;
      client.auth.onAuthStateChange((_event,session)=>{
        currentUser=session?.user||null;
        if(currentUser)setTimeout(syncExisting,0);
      });
      if(currentUser)await syncExisting();
    }catch(error){
      console.warn('MegaHub sync is unavailable on this page.',error?.message||error);
    }
  }

  init();
})();
