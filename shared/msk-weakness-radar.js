(function(){
  'use strict';

  const MODULE_KEY='msk';
  const norm=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,'_');
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const pct=value=>Math.round(clamp(Number(value||0),0,1)*100);
  const isHigh=value=>['confident','high','very_confident','certain'].includes(norm(value));
  const isLow=value=>['guessing','guess','unsure','low','not_sure'].includes(norm(value));
  const activeStatus=value=>['active','improving'].includes(String(value||'').toLowerCase());
  const dueNow=item=>Boolean(item?.next_due_at)&&new Date(item.next_due_at)<=new Date();

  function keyFor(row,groupBy){
    if(groupBy==='lecture')return String(row?.lecture||row?.topic||'Uncategorized').trim()||'Uncategorized';
    return String(row?.topic||row?.lecture||'Uncategorized').trim()||'Uncategorized';
  }

  function trendFor(attempts){
    const rows=(attempts||[]).slice().sort((a,b)=>new Date(b.answered_at||0)-new Date(a.answered_at||0));
    if(rows.length<4)return {direction:'insufficient',delta:0,label:'Building baseline'};
    const take=Math.min(3,Math.floor(rows.length/2));
    const recent=rows.slice(0,take);
    const prior=rows.slice(take,take*2);
    const accuracy=list=>list.length?list.filter(x=>x.is_correct).length/list.length:0;
    const delta=accuracy(recent)-accuracy(prior);
    if(delta>=.15)return {direction:'improving',delta,label:'Improving'};
    if(delta<=-.15)return {direction:'declining',delta,label:'Declining'};
    return {direction:'steady',delta,label:'Steady'};
  }

  function level(score){
    if(score>=70)return {key:'priority',label:'Priority'};
    if(score>=50)return {key:'needs_work',label:'Needs Work'};
    if(score>=30)return {key:'watch',label:'Watch'};
    return {key:'stable',label:'Stable'};
  }

  function recommendation(row){
    const r=row.reasonCounts;
    if(r.confidently_wrong>0)return 'Recalibrate: revisit the rule, then answer a few close distractors before relying on confidence.';
    if(r.repeatedly_missed>0)return 'Rebuild the concept from the mechanism or anatomy, then retest it with spaced retrieval.';
    if(r.low_confidence>0)return 'Strengthen retrieval: practice recalling the answer before looking at choices.';
    if(r.due>0)return 'Complete the due review items now to preserve the spacing schedule.';
    if(row.attempts>=3&&row.errorRate>=.4)return 'Target this area with a short focused question set, then reassess the trend.';
    if(row.attempts<4)return 'Keep answering questions here so the radar can establish a stronger baseline.';
    return 'Maintain with normal mixed practice.';
  }

  function build(questionAttempts,reviewItems,options){
    const groupBy=options?.groupBy==='lecture'?'lecture':'topic';
    const attempts=(questionAttempts||[]).filter(x=>x&&x.module_key===MODULE_KEY);
    const reviews=(reviewItems||[]).filter(x=>x&&x.module_key===MODULE_KEY);
    const map=new Map();

    function bucket(key){
      if(!map.has(key))map.set(key,{key,attemptRows:[],reviewRows:[],weeks:new Set(),lectures:new Set(),topics:new Set()});
      return map.get(key);
    }

    attempts.forEach(row=>{
      const key=keyFor(row,groupBy),b=bucket(key);
      b.attemptRows.push(row);
      if(row.week)b.weeks.add(row.week);
      if(row.lecture)b.lectures.add(row.lecture);
      if(row.topic)b.topics.add(row.topic);
    });
    reviews.forEach(row=>{
      const key=keyFor(row,groupBy),b=bucket(key);
      b.reviewRows.push(row);
      if(row.week)b.weeks.add(row.week);
      if(row.lecture)b.lectures.add(row.lecture);
      if(row.topic)b.topics.add(row.topic);
    });

    const rows=[];
    map.forEach(b=>{
      const n=b.attemptRows.length;
      const correct=b.attemptRows.filter(x=>x.is_correct).length;
      const misses=n-correct;
      const confidentWrong=b.attemptRows.filter(x=>!x.is_correct&&isHigh(x.confidence)).length;
      const lowConfidence=b.attemptRows.filter(x=>isLow(x.confidence)).length;
      const activeReviews=b.reviewRows.filter(x=>activeStatus(x.status)).length;
      const due=b.reviewRows.filter(x=>activeStatus(x.status)&&dueNow(x)).length;
      const mastered=b.reviewRows.filter(x=>String(x.status||'').toLowerCase()==='mastered').length;
      const filed=b.reviewRows.filter(x=>x.manually_filed||(x.review_reasons||[]).includes('filed')).length;
      const repeated=b.reviewRows.filter(x=>(x.review_reasons||[]).includes('repeatedly_missed')||Number(x.miss_count||0)>=2).length;
      const confidentWrongItems=b.reviewRows.filter(x=>(x.review_reasons||[]).includes('confidently_wrong')).length;
      const lowConfidenceItems=b.reviewRows.filter(x=>(x.review_reasons||[]).includes('low_confidence')).length;
      const accuracy=n?correct/n:0;
      const errorRate=n?misses/n:0;
      const cwRate=n?confidentWrong/n:0;
      const lowRate=n?lowConfidence/n:0;

      let raw;
      let reliability;
      if(n){
        raw=(errorRate*44)+(cwRate*22)+(lowRate*14)+(Math.min(activeReviews/3,1)*10)+(Math.min(due/2,1)*10);
        reliability=Math.min(1,.45+n*.11);
      }else{
        raw=Math.min(85,(activeReviews*16)+(due*12)+(repeated*14)+(confidentWrongItems*16)+(lowConfidenceItems*8));
        reliability=Math.min(.82,.45+activeReviews*.09);
      }
      if(repeated>0)raw+=Math.min(8,repeated*3);
      const score=Math.round(clamp(raw*reliability,0,100));
      const trend=trendFor(b.attemptRows);
      const reasonCounts={
        filed,
        repeatedly_missed:repeated,
        confidently_wrong:Math.max(confidentWrong,confidentWrongItems),
        low_confidence:Math.max(lowConfidence,lowConfidenceItems),
        due
      };
      const row={
        key:b.key,
        groupBy,
        score,
        level:level(score),
        attempts:n,
        correct,
        misses,
        accuracy,
        errorRate,
        confidentWrong,
        lowConfidence,
        activeReviews,
        due,
        mastered,
        reasonCounts,
        trend,
        weeks:Array.from(b.weeks),
        lectures:Array.from(b.lectures),
        topics:Array.from(b.topics)
      };
      row.recommendation=recommendation(row);
      rows.push(row);
    });

    return rows.sort((a,b)=>b.score-a.score||b.activeReviews-a.activeReviews||b.attempts-a.attempts||a.key.localeCompare(b.key));
  }

  function summarize(rows){
    const list=rows||[];
    const withAttempts=list.filter(x=>x.attempts>0);
    const totalAttempts=withAttempts.reduce((sum,x)=>sum+x.attempts,0);
    const totalCorrect=withAttempts.reduce((sum,x)=>sum+x.correct,0);
    const priority=list.filter(x=>x.level.key==='priority'||x.level.key==='needs_work').length;
    const due=list.reduce((sum,x)=>sum+x.due,0);
    return {
      areas:list.length,
      totalAttempts,
      accuracy:totalAttempts?totalCorrect/totalAttempts:0,
      priority,
      due,
      top:list[0]||null
    };
  }

  window.MSKWeaknessRadar={
    MODULE_KEY,
    build,
    summarize,
    recommendation,
    trendFor,
    level,
    pct
  };
})();