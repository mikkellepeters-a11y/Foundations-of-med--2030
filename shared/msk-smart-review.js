(function(){
  'use strict';

  const MODULE_KEY='msk';
  const AUTO_FLAG_MISSES=2;
  const MASTERY_TARGET=3;
  const REVIEW_INTERVAL_DAYS=[1,3,7,14,30];
  const REASONS={
    FILED:'filed',
    REPEATEDLY_MISSED:'repeatedly_missed',
    CONFIDENTLY_WRONG:'confidently_wrong',
    LOW_CONFIDENCE:'low_confidence'
  };

  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const uniq=list=>Array.from(new Set((list||[]).filter(Boolean)));
  const nowIso=now=>new Date(now||Date.now()).toISOString();
  const addDays=(iso,days)=>{
    const d=new Date(iso||Date.now());
    d.setUTCDate(d.getUTCDate()+Number(days||0));
    return d.toISOString();
  };
  const confidenceKey=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,'_');
  const isHighConfidence=value=>['confident','high','very_confident','certain'].includes(confidenceKey(value));
  const isLowConfidence=value=>['unsure','guessing','guess','low','not_sure'].includes(confidenceKey(value));

  function snapshot(question){
    return {
      stem:question?.stem||question?.questionStem||'',
      choices:clone(question?.choices||question?.options||[]),
      answer:question?.answer||question?.correctAnswer||'',
      explanation:question?.explanation||''
    };
  }

  function createState(question,now){
    const t=nowIso(now);
    return {
      module_key:MODULE_KEY,
      quiz_id:String(question?.quiz_id||question?.quizId||question?.sourceQuiz||''),
      question_id:String(question?.question_id||question?.questionId||question?.id||''),
      review_reasons:[],
      status:'active',
      manually_filed:false,
      miss_count:0,
      correct_streak:0,
      review_attempts:0,
      review_stage:0,
      last_confidence:null,
      last_result_correct:null,
      first_flagged_at:null,
      last_reviewed_at:null,
      next_due_at:null,
      mastered_at:null,
      week:question?.week||null,
      lecture:question?.lecture||null,
      topic:question?.topic||null,
      difficulty:question?.difficulty||null,
      question_snapshot:snapshot(question),
      metadata:{primary_attempts:0},
      created_at:t,
      updated_at:t
    };
  }

  function refreshQuestionFields(state,question){
    const s=clone(state)||createState(question);
    if(!question)return s;
    s.quiz_id=String(question.quiz_id||question.quizId||question.sourceQuiz||s.quiz_id||'');
    s.question_id=String(question.question_id||question.questionId||question.id||s.question_id||'');
    s.week=question.week??s.week;
    s.lecture=question.lecture??s.lecture;
    s.topic=question.topic??s.topic;
    s.difficulty=question.difficulty??s.difficulty;
    const snap=snapshot(question);
    if(snap.stem||snap.choices.length||snap.answer||snap.explanation)s.question_snapshot=snap;
    return s;
  }

  function evaluatePrimaryAttempt(existing,question,attempt,now){
    const t=nowIso(now);
    let s=refreshQuestionFields(existing,question);
    const correct=Boolean(attempt?.correct);
    const confidence=attempt?.confidence??null;
    const priorMisses=Number(s.miss_count||0);
    const reportedMisses=Number(attempt?.missCount??attempt?.miss_count);
    s.metadata=s.metadata||{};
    s.metadata.primary_attempts=Number(s.metadata.primary_attempts||0)+1;
    s.last_confidence=confidence;
    s.last_result_correct=correct;

    if(!correct){
      s.miss_count=Number.isFinite(reportedMisses)&&reportedMisses>0?reportedMisses:priorMisses+1;
      s.correct_streak=0;
      if(isHighConfidence(confidence))s.review_reasons=uniq([...s.review_reasons,REASONS.CONFIDENTLY_WRONG]);
      if(s.miss_count>=AUTO_FLAG_MISSES)s.review_reasons=uniq([...s.review_reasons,REASONS.REPEATEDLY_MISSED]);
      if(s.status==='mastered'){
        s.status='active';
        s.mastered_at=null;
        s.review_stage=0;
        s.next_due_at=t;
      }
    }
    if(isLowConfidence(confidence))s.review_reasons=uniq([...s.review_reasons,REASONS.LOW_CONFIDENCE]);

    const shouldExist=s.manually_filed||s.review_reasons.length>0;
    if(!shouldExist)return null;
    if(!s.first_flagged_at)s.first_flagged_at=t;
    if(!s.next_due_at)s.next_due_at=t;
    if(s.status==='mastered'&&!correct)s.status='active';
    s.updated_at=t;
    return s;
  }

  function fileItem(existing,question,now){
    const t=nowIso(now);
    const s=refreshQuestionFields(existing||createState(question,t),question);
    s.manually_filed=true;
    s.review_reasons=uniq([...s.review_reasons,REASONS.FILED]);
    if(s.status==='mastered')s.status='active';
    s.mastered_at=null;
    if(!s.first_flagged_at)s.first_flagged_at=t;
    if(!s.next_due_at)s.next_due_at=t;
    s.updated_at=t;
    return s;
  }

  function unfileItem(existing,now){
    if(!existing)return null;
    const t=nowIso(now);
    const s=clone(existing);
    s.manually_filed=false;
    s.review_reasons=(s.review_reasons||[]).filter(r=>r!==REASONS.FILED);
    if(!s.review_reasons.length&&s.status!=='mastered')s.status='archived';
    s.updated_at=t;
    return s;
  }

  function nextInterval(stage){
    const idx=Math.max(0,Math.min(Number(stage||0),REVIEW_INTERVAL_DAYS.length-1));
    return REVIEW_INTERVAL_DAYS[idx];
  }

  function applyReviewAttempt(existing,result,now,options){
    if(!existing)throw new Error('Review attempt requires an existing review item.');
    const t=nowIso(now);
    const s=clone(existing);
    const correct=Boolean(result?.correct);
    const confidence=result?.confidence??null;
    const allowManualMastery=Boolean(options?.allowManualMastery);
    s.review_attempts=Number(s.review_attempts||0)+1;
    s.last_reviewed_at=t;
    s.last_confidence=confidence;
    s.last_result_correct=correct;

    if(correct){
      s.correct_streak=Number(s.correct_streak||0)+1;
      s.review_stage=Math.min(Number(s.review_stage||0)+1,REVIEW_INTERVAL_DAYS.length-1);
      const masteryEligible=s.correct_streak>=MASTERY_TARGET&&(!s.manually_filed||allowManualMastery);
      if(masteryEligible){
        s.status='mastered';
        s.mastered_at=t;
        s.next_due_at=null;
      }else{
        s.status='improving';
        s.mastered_at=null;
        s.next_due_at=addDays(t,nextInterval(s.review_stage));
      }
    }else{
      s.miss_count=Number(s.miss_count||0)+1;
      s.correct_streak=0;
      s.review_stage=0;
      s.status='active';
      s.mastered_at=null;
      s.review_reasons=uniq([...s.review_reasons,REASONS.REPEATEDLY_MISSED]);
      if(isHighConfidence(confidence))s.review_reasons=uniq([...s.review_reasons,REASONS.CONFIDENTLY_WRONG]);
      if(isLowConfidence(confidence))s.review_reasons=uniq([...s.review_reasons,REASONS.LOW_CONFIDENCE]);
      s.next_due_at=addDays(t,REVIEW_INTERVAL_DAYS[0]);
    }
    s.updated_at=t;
    return s;
  }

  function makeDueNow(existing,now){
    if(!existing)return null;
    const s=clone(existing);
    const t=nowIso(now);
    if(s.status==='mastered')s.status='improving';
    s.next_due_at=t;
    s.updated_at=t;
    return s;
  }

  function categories(item,now){
    if(!item)return [];
    const out=[];
    const reasons=item.review_reasons||[];
    if(item.manually_filed||reasons.includes(REASONS.FILED))out.push('filed');
    if(reasons.includes(REASONS.REPEATEDLY_MISSED)||Number(item.miss_count||0)>=AUTO_FLAG_MISSES)out.push('repeatedly_missed');
    if(reasons.includes(REASONS.CONFIDENTLY_WRONG))out.push('confidently_wrong');
    if(reasons.includes(REASONS.LOW_CONFIDENCE))out.push('low_confidence');
    if(item.status==='mastered')out.push('mastered');
    if(item.next_due_at&&item.status!=='mastered'&&new Date(item.next_due_at)<=new Date(now||Date.now()))out.push('due');
    return uniq(out);
  }

  function summary(items,now){
    const rows=(items||[]).filter(Boolean);
    const result={filed:0,repeatedly_missed:0,confidently_wrong:0,low_confidence:0,due:0,mastered:0,total_active:0};
    rows.forEach(item=>{
      categories(item,now).forEach(k=>{if(k in result)result[k]++;});
      if(['active','improving'].includes(item.status))result.total_active++;
    });
    return result;
  }

  window.MSKSmartReview={
    MODULE_KEY,AUTO_FLAG_MISSES,MASTERY_TARGET,REVIEW_INTERVAL_DAYS,REASONS,
    createState,evaluatePrimaryAttempt,fileItem,unfileItem,applyReviewAttempt,makeDueNow,categories,summary,
    isHighConfidence,isLowConfidence,nextInterval
  };
})();