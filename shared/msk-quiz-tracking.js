(function(){
  'use strict';

  const MODULE_KEY='msk';
  const MODULE_NAME='Musculoskeletal-Skin';
  const SUPABASE_URL='https://ofqfdnxpftifnvxnvppe.supabase.co';
  const SUPABASE_KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
  const TOKEN_PREFIX='msk:quiz-attempt:v1:';
  const MARKER_PREFIX='msk:quiz-sync:v1:';

  const CONTRACT={
    module_key:MODULE_KEY,
    required_question_fields:['question_id','week','lecture','topic','difficulty','stem','choices','correct_answer'],
    confidence_values:['guessing','unsure','confident'],
    notes:'Every production MSK question must have a permanent question_id. quiz_id must remain stable across deployments.'
  };

  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const text=value=>String(value??'').trim();
  const norm=value=>text(value).toLowerCase().replace(/\s+/g,' ');
  const makeToken=()=>window.crypto&&typeof window.crypto.randomUUID==='function'
    ?window.crypto.randomUUID()
    :`${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

  function choiceText(choice){
    if(choice==null)return '';
    if(typeof choice==='string'||typeof choice==='number')return String(choice);
    if(typeof choice==='object')return String(choice.text??choice.label??choice.value??choice.answer??'');
    return String(choice);
  }

  function selectedStorageValue(selected,choices){
    if(typeof selected==='number'&&Number.isInteger(selected)&&selected>=0&&selected<choices.length){
      return String.fromCharCode(65+selected);
    }
    if(selected&&typeof selected==='object')return choiceText(selected);
    return String(selected??'');
  }

  function isCorrectAnswer(selected,answer,choices){
    const selectedText=selectedStorageValue(selected,choices);
    const selectedNorm=norm(selectedText);
    const answerNorm=norm(answer);
    if(selectedNorm===answerNorm)return true;
    for(let i=0;i<choices.length;i++){
      const choice=choiceText(choices[i]);
      const letter=String.fromCharCode(65+i);
      const oneBased=String(i+1);
      const choiceIsAnswer=answerNorm===norm(choice)||answerNorm===norm(letter)||answerNorm===oneBased;
      if(!choiceIsAnswer)continue;
      return selectedNorm===norm(choice)||selectedNorm===norm(letter)||selectedNorm===oneBased;
    }
    return false;
  }

  function normalizeQuestion(question,quiz){
    const q=question||{};
    const choices=clone(q.choices??q.options??[]);
    return {
      id:text(q.question_id??q.questionId??q.id??q.globalId),
      question_id:text(q.question_id??q.questionId??q.id??q.globalId),
      quiz_id:text(q.quiz_id??q.quizId??quiz.quizId),
      week:text(q.week??quiz.week),
      lecture:text(q.lecture??quiz.lecture),
      topic:text(q.topic??quiz.topic),
      difficulty:text(q.difficulty??quiz.difficulty),
      stem:text(q.stem??q.questionStem??q.prompt),
      choices,
      answer:q.correct_answer??q.correctAnswer??q.answer??'',
      explanation:text(q.explanation??q.rationale),
      metadata:clone(q.metadata||{})
    };
  }

  function validateQuestion(question,quiz){
    const q=normalizeQuestion(question,quiz);
    const missing=[];
    if(!q.question_id)missing.push('question_id');
    if(!q.quiz_id)missing.push('quiz_id');
    if(!q.week)missing.push('week');
    if(!q.lecture)missing.push('lecture');
    if(!q.topic)missing.push('topic');
    if(!q.difficulty)missing.push('difficulty');
    if(!q.stem)missing.push('stem');
    if(!Array.isArray(q.choices)||q.choices.length<2)missing.push('choices');
    if(q.answer===null||q.answer===undefined||text(q.answer)==='')missing.push('correct_answer');
    return {valid:missing.length===0,missing,question:q};
  }

  function reviewPayload(userId,item){
    const reasons=Array.isArray(item.review_reasons)?item.review_reasons:[];
    return {
      user_id:userId,
      module_key:MODULE_KEY,
      quiz_id:item.quiz_id,
      question_id:String(item.question_id),
      reason:reasons.join(', ')||null,
      note:item.topic||null,
      review_reasons:reasons,
      status:item.status||'active',
      manually_filed:Boolean(item.manually_filed),
      miss_count:Number(item.miss_count||0),
      correct_streak:Number(item.correct_streak||0),
      review_attempts:Number(item.review_attempts||0),
      review_stage:Number(item.review_stage||0),
      last_confidence:item.last_confidence??null,
      last_result_correct:item.last_result_correct??null,
      first_flagged_at:item.first_flagged_at??null,
      last_reviewed_at:item.last_reviewed_at??null,
      next_due_at:item.next_due_at??null,
      mastered_at:item.mastered_at??null,
      week:item.week||null,
      lecture:item.lecture||null,
      topic:item.topic||null,
      difficulty:item.difficulty||null,
      question_snapshot:clone(item.question_snapshot||{}),
      metadata:clone(item.metadata||{})
    };
  }

  function createMemoryStore(seed){
    const data={
      question_attempts:clone(seed?.question_attempts||[]),
      quiz_attempts:clone(seed?.quiz_attempts||[]),
      review_items:clone(seed?.review_items||[])
    };
    let nextId=1;
    return {
      kind:'memory',
      async getReviewItem(userId,quizId,questionId){
        return clone(data.review_items.find(row=>row.user_id===userId&&row.module_key===MODULE_KEY&&row.quiz_id===quizId&&String(row.question_id)===String(questionId))||null);
      },
      async getQuestionStats(userId,quizId,questionId){
        const rows=data.question_attempts.filter(row=>row.user_id===userId&&row.module_key===MODULE_KEY&&row.quiz_id===quizId&&String(row.question_id)===String(questionId));
        return {attempts:rows.length,misses:rows.filter(row=>!row.is_correct).length};
      },
      async recordQuestionAttempt(payload){
        const duplicate=data.question_attempts.some(row=>row.user_id===payload.user_id&&row.module_key===MODULE_KEY&&row.quiz_id===payload.quiz_id&&row.attempt_token===payload.attempt_token&&String(row.question_id)===String(payload.question_id));
        if(duplicate){const err=new Error('duplicate question attempt');err.code='23505';throw err;}
        const row={id:`memory-question-${nextId++}`,...clone(payload)};data.question_attempts.push(row);return clone(row);
      },
      async recordQuizAttempt(payload){
        const duplicate=data.quiz_attempts.some(row=>row.user_id===payload.user_id&&row.module_key===MODULE_KEY&&row.quiz_id===payload.quiz_id&&row.attempt_token===payload.attempt_token);
        if(duplicate){const err=new Error('duplicate quiz attempt');err.code='23505';throw err;}
        const row={id:`memory-quiz-${nextId++}`,...clone(payload)};data.quiz_attempts.push(row);return clone(row);
      },
      async upsertReviewItem(userId,item){
        const payload=reviewPayload(userId,item);
        const idx=data.review_items.findIndex(row=>row.user_id===userId&&row.module_key===MODULE_KEY&&row.quiz_id===payload.quiz_id&&String(row.question_id)===String(payload.question_id));
        if(idx>=0){
          data.review_items[idx]={...data.review_items[idx],...clone(payload),updated_at:new Date().toISOString()};
          return clone(data.review_items[idx]);
        }
        const row={id:`memory-review-${nextId++}`,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...clone(payload)};
        data.review_items.push(row);return clone(row);
      },
      inspect(){return clone(data)}
    };
  }

  function createSupabaseStore(client){
    return {
      kind:'supabase',
      async getReviewItem(userId,quizId,questionId){
        const {data,error}=await client.from('review_items').select('*')
          .eq('user_id',userId).eq('module_key',MODULE_KEY).eq('quiz_id',quizId).eq('question_id',String(questionId)).maybeSingle();
        if(error)throw error;return data||null;
      },
      async getQuestionStats(userId,quizId,questionId){
        const {data,error}=await client.from('question_attempts').select('is_correct')
          .eq('user_id',userId).eq('module_key',MODULE_KEY).eq('quiz_id',quizId).eq('question_id',String(questionId));
        if(error)throw error;const rows=data||[];return {attempts:rows.length,misses:rows.filter(row=>!row.is_correct).length};
      },
      async recordQuestionAttempt(payload){
        const {data,error}=await client.from('question_attempts').insert(payload).select('id').single();
        if(error)throw error;return data;
      },
      async recordQuizAttempt(payload){
        const {data,error}=await client.from('quiz_attempts').insert(payload).select('id').single();
        if(error)throw error;return data;
      },
      async upsertReviewItem(userId,item){
        const payload=reviewPayload(userId,item);
        const {data,error}=await client.from('review_items').upsert(payload,{onConflict:'user_id,module_key,quiz_id,question_id'}).select('*').single();
        if(error)throw error;return data;
      }
    };
  }

  function loadSupabase(){
    return new Promise((resolve,reject)=>{
      if(window.supabase&&typeof window.supabase.createClient==='function')return resolve(window.supabase);
      const existing=document.querySelector('script[data-msk-tracking-supabase]');
      if(existing){
        existing.addEventListener('load',()=>resolve(window.supabase),{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async=true;
      script.dataset.mskTrackingSupabase='1';
      script.addEventListener('load',()=>resolve(window.supabase),{once:true});
      script.addEventListener('error',reject,{once:true});
      document.head.appendChild(script);
    });
  }

  async function createSupabaseContext(){
    await loadSupabase();
    const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    const user=data?.session?.user||null;
    if(!user)throw new Error('MSK quiz tracking requires a signed-in MegaHub user.');
    return {client,user,store:createSupabaseStore(client)};
  }

  function tokenStorageKey(quizId){return `${TOKEN_PREFIX}${quizId}`}
  function markerKey(quizId,attemptToken,type,id){return `${MARKER_PREFIX}${quizId}:${attemptToken}:${type}:${id}`}
  function storageGet(key){try{return localStorage.getItem(key)}catch(e){return null}}
  function storageSet(key,value){try{localStorage.setItem(key,value)}catch(e){}}

  async function createAdapter(config){
    if(!window.MSKSmartReview)throw new Error('Load shared/msk-smart-review.js before shared/msk-quiz-tracking.js.');
    const engine=window.MSKSmartReview;
    const quiz={
      quizId:text(config?.quizId??config?.quiz_id),
      quizName:text(config?.quizName??config?.quiz_name),
      week:text(config?.week),
      lecture:text(config?.lecture),
      topic:text(config?.topic),
      difficulty:text(config?.difficulty),
      mode:text(config?.mode||'practice'),
      section:text(config?.section||'MSK Quiz'),
      sourcePage:text(config?.sourcePage||window.location.pathname)
    };
    if(!quiz.quizId)throw new Error('MSK quiz tracking requires a stable quizId.');
    if(!quiz.quizName)throw new Error('MSK quiz tracking requires quizName.');

    let userId=text(config?.userId);
    let store=config?.store||null;
    let supabaseClient=config?.supabaseClient||null;
    if(!store){
      if(supabaseClient){
        const {data,error}=await supabaseClient.auth.getSession();
        if(error)throw error;
        userId=userId||text(data?.session?.user?.id);
        if(!userId)throw new Error('MSK quiz tracking requires a signed-in MegaHub user.');
        store=createSupabaseStore(supabaseClient);
      }else{
        const ctx=await createSupabaseContext();
        supabaseClient=ctx.client;userId=text(ctx.user.id);store=ctx.store;
      }
    }
    if(!userId)throw new Error('MSK quiz tracking requires userId when a custom store is supplied.');

    const useMarkers=config?.persistMarkers!==false;
    let attemptToken=text(config?.attemptToken);
    if(!attemptToken&&useMarkers)attemptToken=storageGet(tokenStorageKey(quiz.quizId))||'';
    if(!attemptToken){attemptToken=makeToken();if(useMarkers)storageSet(tokenStorageKey(quiz.quizId),attemptToken)}
    let sessionAnswers=new Map();

    function questionOrThrow(input){
      const result=validateQuestion(input,quiz);
      if(!result.valid)throw new Error(`Invalid MSK question contract (${result.missing.join(', ')}).`);
      return result.question;
    }

    function questionAttemptPayload(q,response,correct,answeredAt){
      return {
        user_id:userId,
        module_key:MODULE_KEY,
        quiz_id:quiz.quizId,
        question_id:q.question_id,
        topic:q.topic||null,
        difficulty:q.difficulty||null,
        selected_answer:selectedStorageValue(response.selectedAnswer,q.choices),
        correct_answer:String(q.answer),
        is_correct:Boolean(correct),
        confidence:response.confidence||null,
        answered_at:answeredAt,
        metadata:{
          module:MODULE_NAME,
          section:quiz.section,
          source:'msk-quiz-tracking',
          attempt_token:attemptToken,
          source_page:quiz.sourcePage,
          week:q.week,
          lecture:q.lecture,
          ...clone(q.metadata||{}),
          ...clone(response.metadata||{})
        },
        attempt_token:attemptToken,
        week:q.week||null,
        lecture:q.lecture||null
      };
    }

    async function recordAnswer(question,response){
      const q=questionOrThrow(question);
      const r=response||{};
      if(r.selectedAnswer===undefined||r.selectedAnswer===null||text(r.selectedAnswer)==='')throw new Error('recordAnswer requires selectedAnswer.');
      if(!r.confidence)throw new Error('recordAnswer requires confidence.');
      const marker=markerKey(quiz.quizId,attemptToken,'question',q.question_id);
      if(useMarkers&&storageGet(marker)==='1')return {duplicate:true,question:q,attemptToken};

      const existing=await store.getReviewItem(userId,quiz.quizId,q.question_id);
      const prior=await store.getQuestionStats(userId,quiz.quizId,q.question_id);
      const correct=typeof r.isCorrect==='boolean'?r.isCorrect:isCorrectAnswer(r.selectedAnswer,q.answer,q.choices);
      const answeredAt=r.answeredAt?new Date(r.answeredAt).toISOString():new Date().toISOString();
      const payload=questionAttemptPayload(q,r,correct,answeredAt);

      try{
        await store.recordQuestionAttempt(payload);
      }catch(error){
        if(error?.code==='23505'){
          if(useMarkers)storageSet(marker,'1');
          return {duplicate:true,question:q,attemptToken};
        }
        throw error;
      }

      let seed=existing;
      if(!seed&&(prior.attempts>0||prior.misses>0)){
        seed=engine.createState(q,answeredAt);
        seed.miss_count=Number(prior.misses||0);
        seed.metadata=seed.metadata||{};
        seed.metadata.primary_attempts=Number(prior.attempts||0);
      }
      const next=engine.evaluatePrimaryAttempt(seed,q,{correct,confidence:r.confidence},answeredAt);
      let savedReview=null;
      if(next)savedReview=await store.upsertReviewItem(userId,next);
      sessionAnswers.set(q.question_id,{correct,selectedAnswer:r.selectedAnswer,confidence:r.confidence});
      if(useMarkers)storageSet(marker,'1');
      return {duplicate:false,correct,attempt:payload,reviewItem:savedReview||next,categories:next?engine.categories(next):[],attemptToken};
    }

    async function fileQuestion(question){
      const q=questionOrThrow(question);
      const existing=await store.getReviewItem(userId,quiz.quizId,q.question_id);
      const next=engine.fileItem(existing,q,Date.now());
      const saved=await store.upsertReviewItem(userId,next);
      return {reviewItem:saved,categories:engine.categories(saved)};
    }

    async function unfileQuestion(question){
      const q=questionOrThrow(question);
      const existing=await store.getReviewItem(userId,quiz.quizId,q.question_id);
      if(!existing)return {reviewItem:null,categories:[]};
      const next=engine.unfileItem(existing,Date.now());
      const saved=await store.upsertReviewItem(userId,next);
      return {reviewItem:saved,categories:engine.categories(saved)};
    }

    async function completeQuiz(details){
      const d=details||{};
      const marker=markerKey(quiz.quizId,attemptToken,'quiz','complete');
      if(useMarkers&&storageGet(marker)==='1')return {duplicate:true,attemptToken};
      const recorded=Array.from(sessionAnswers.values());
      const total=Number.isFinite(Number(d.totalQuestions))?Number(d.totalQuestions):recorded.length;
      const score=Number.isFinite(Number(d.score))?Number(d.score):recorded.filter(x=>x.correct).length;
      const percentage=Number.isFinite(Number(d.percentage))?Number(d.percentage):(total?score/total*100:0);
      const payload={
        user_id:userId,
        module_key:MODULE_KEY,
        quiz_id:quiz.quizId,
        quiz_name:quiz.quizName,
        score,
        total_questions:total,
        percentage,
        mode:text(d.mode||quiz.mode)||'practice',
        completed_at:d.completedAt?new Date(d.completedAt).toISOString():new Date().toISOString(),
        metadata:{
          module:MODULE_NAME,
          section:quiz.section,
          source:'msk-quiz-tracking',
          attempt_token:attemptToken,
          source_page:quiz.sourcePage,
          week:quiz.week||null,
          lecture:quiz.lecture||null,
          ...clone(d.metadata||{})
        },
        attempt_token:attemptToken
      };
      try{
        const row=await store.recordQuizAttempt(payload);
        if(useMarkers)storageSet(marker,'1');
        return {duplicate:false,row,payload,attemptToken};
      }catch(error){
        if(error?.code==='23505'){
          if(useMarkers)storageSet(marker,'1');
          return {duplicate:true,attemptToken};
        }
        throw error;
      }
    }

    function newAttempt(token){
      attemptToken=text(token)||makeToken();
      sessionAnswers=new Map();
      if(useMarkers)storageSet(tokenStorageKey(quiz.quizId),attemptToken);
      return attemptToken;
    }

    return {
      MODULE_KEY,
      quiz:clone(quiz),
      userId,
      recordAnswer,
      fileQuestion,
      unfileQuestion,
      completeQuiz,
      newAttempt,
      getAttemptToken:()=>attemptToken,
      getStore:()=>store,
      normalizeQuestion:question=>normalizeQuestion(question,quiz),
      validateQuestion:question=>validateQuestion(question,quiz)
    };
  }

  window.MSKQuizTracking={
    MODULE_KEY,
    MODULE_NAME,
    CONTRACT,
    createAdapter,
    createMemoryStore,
    createSupabaseStore,
    normalizeQuestion,
    validateQuestion,
    isCorrectAnswer
  };
})();
