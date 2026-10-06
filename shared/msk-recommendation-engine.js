(function(){
'use strict';

const MODULE_KEY='msk';
const text=v=>String(v??'').trim();
const norm=v=>text(v).toLowerCase().replace(/\s+/g,'_');
const active=item=>['active','improving'].includes(norm(item?.status));
const due=item=>active(item)&&item?.next_due_at&&new Date(item.next_due_at)<=new Date();
const reasons=item=>Array.isArray(item?.review_reasons)?item.review_reasons:[];
const high=value=>['confident','high','very_confident','certain'].includes(norm(value));
const low=value=>['guessing','guess','unsure','low','not_sure'].includes(norm(value));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const enc=v=>encodeURIComponent(String(v??''));

function countReview(reviews,key){
  return reviews.filter(item=>{
    const r=reasons(item);
    if(key==='due')return due(item);
    if(key==='repeatedly_missed')return active(item)&&(r.includes('repeatedly_missed')||Number(item?.miss_count||0)>=2);
    if(key==='confidently_wrong')return active(item)&&r.includes('confidently_wrong');
    if(key==='low_confidence')return active(item)&&r.includes('low_confidence');
    if(key==='filed')return active(item)&&(item?.manually_filed||r.includes('filed'));
    return false;
  }).length;
}

function recommendationScore(base,count){
  return Math.round(clamp(base+Math.min(12,Math.max(0,count-1)*2),0,100));
}

function build(questionAttempts,reviewItems,options){
  const attempts=(questionAttempts||[]).filter(x=>x&&x.module_key===MODULE_KEY);
  const reviews=(reviewItems||[]).filter(x=>x&&x.module_key===MODULE_KEY);
  const radarEngine=window.MSKWeaknessRadar;
  const radarRows=Array.isArray(options?.radarRows)
    ?options.radarRows
    :(radarEngine?radarEngine.build(attempts,reviews,{groupBy:'topic'}):[]);
  const max=Math.max(1,Number(options?.max||4));
  const recs=[];

  const dueCount=countReview(reviews,'due');
  if(dueCount){
    recs.push({
      id:'due',
      score:recommendationScore(96,dueCount),
      urgency:'Do now',
      tone:'urgent',
      title:'Clear your due reviews',
      detail:`${dueCount} MSK review item${dueCount===1?' is':'s are'} due. Completing them now protects the spacing schedule before adding more new practice.`,
      reason:`${dueCount} due review item${dueCount===1?'':'s'}`,
      action:{kind:'review',label:'Review Due Now',params:{category:'due'}}
    });
  }

  const confidentReview=countReview(reviews,'confidently_wrong');
  const confidentAttempts=attempts.filter(x=>!x.is_correct&&high(x.confidence)).length;
  const confidentCount=Math.max(confidentReview,confidentAttempts);
  if(confidentCount){
    recs.push({
      id:'confidently_wrong',
      score:recommendationScore(91,confidentCount),
      urgency:'High priority',
      tone:'danger',
      title:'Recalibrate confident errors',
      detail:`${confidentCount} confidently wrong signal${confidentCount===1?'':'s'} suggest a misconception rather than simple uncertainty. Revisit the rule, then test it against close distractors.`,
      reason:`${confidentCount} confident error signal${confidentCount===1?'':'s'}`,
      action:{kind:'builder',label:'Build Calibration Set',params:{source:'confidently_wrong',count:5}}
    });
  }

  const repeated=countReview(reviews,'repeatedly_missed');
  if(repeated){
    recs.push({
      id:'repeatedly_missed',
      score:recommendationScore(88,repeated),
      urgency:'High priority',
      tone:'danger',
      title:'Rebuild repeatedly missed concepts',
      detail:`${repeated} active question${repeated===1?' has':'s have'} been missed repeatedly. Relearn the mechanism, anatomy, or distinguishing rule before another retrieval attempt.`,
      reason:`${repeated} repeatedly missed item${repeated===1?'':'s'}`,
      action:{kind:'builder',label:'Practice Repeated Misses',params:{source:'repeatedly_missed',count:5}}
    });
  }

  const declining=radarRows.find(r=>r?.trend?.direction==='declining'&&Number(r?.attempts||0)>=4);
  if(declining){
    recs.push({
      id:'declining:'+declining.key,
      score:Math.round(clamp(78+Number(declining.score||0)*.14,0,96)),
      urgency:'Needs attention',
      tone:'warn',
      title:`Reverse the decline in ${declining.key}`,
      detail:`Recent performance in ${declining.key} is trending down. Use a focused set now, then compare the next trend window rather than waiting for the weakness score to climb further.`,
      reason:`${declining.trend.label} · priority ${declining.score}/100`,
      topic:declining.key,
      action:{kind:'builder',label:'Target This Topic',params:{source:'adaptive',topic:declining.key,count:10}}
    });
  }

  const topWeak=radarRows.find(r=>Number(r?.score||0)>=30&&(Number(r?.misses||0)>0||Number(r?.activeReviews||0)>0));
  if(topWeak){
    const exists=recs.some(r=>r.topic===topWeak.key);
    if(!exists){
      recs.push({
        id:'weak:'+topWeak.key,
        score:Math.round(clamp(60+Number(topWeak.score||0)*.32,0,94)),
        urgency:topWeak.score>=70?'Priority topic':topWeak.score>=50?'Needs work':'Watch',
        tone:topWeak.score>=70?'danger':'warn',
        title:`Focus next on ${topWeak.key}`,
        detail:`This is your highest current topic-level weakness signal: ${topWeak.attempts} attempt${topWeak.attempts===1?'':'s'}, ${topWeak.misses} miss${topWeak.misses===1?'':'es'}, and ${topWeak.activeReviews} active review item${topWeak.activeReviews===1?'':'s'}.`,
        reason:`Weakness score ${topWeak.score}/100 · ${topWeak.trend.label}`,
        topic:topWeak.key,
        action:topWeak.activeReviews>0
          ?{kind:'builder',label:'Build Focused Set',params:{source:'adaptive',topic:topWeak.key,count:10}}
          :null
      });
    }
  }

  const lowReview=countReview(reviews,'low_confidence');
  const lowAttempts=attempts.filter(x=>low(x.confidence)).length;
  const lowCount=Math.max(lowReview,lowAttempts);
  if(lowCount){
    recs.push({
      id:'low_confidence',
      score:recommendationScore(64,lowCount),
      urgency:'Retrieval priority',
      tone:'watch',
      title:'Strengthen low-confidence recall',
      detail:`${lowCount} low-confidence signal${lowCount===1?'':'s'} show that recall is not yet automatic. Practice retrieving the answer before looking at choices.`,
      reason:`${lowCount} low-confidence signal${lowCount===1?'':'s'}`,
      action:{kind:'builder',label:'Practice Low Confidence',params:{source:'low_confidence',count:5}}
    });
  }

  if(!recs.length&&attempts.length){
    recs.push({
      id:'maintain',
      score:35,
      urgency:'Maintain',
      tone:'stable',
      title:'Maintain with mixed retrieval',
      detail:'No major MSK review warning is active right now. Keep a mixed question cadence so the radar has enough recent data to detect new weak areas early.',
      reason:`${attempts.length} MSK question attempt${attempts.length===1?'':'s'} analyzed`,
      action:{kind:'builder',label:'Build Mixed Review',params:{source:'adaptive',count:10}}
    });
  }

  if(!recs.length){
    recs.push({
      id:'baseline',
      score:20,
      urgency:'Build baseline',
      tone:'stable',
      title:'Start building your MSK performance baseline',
      detail:'There is not enough real MSK performance data yet to make a personalized recommendation. Once quiz attempts arrive, this section will automatically shift from generic guidance to targeted next actions.',
      reason:'No MSK attempts yet',
      action:null
    });
  }

  const deduped=[];
  const seen=new Set();
  recs.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).forEach(rec=>{
    const key=rec.id.split(':')[0]+':'+(rec.topic||'');
    if(seen.has(key))return;
    seen.add(key);deduped.push(rec);
  });
  return deduped.slice(0,max);
}

function buildUrl(action,routes){
  if(!action)return '';
  const base=action.kind==='builder'?routes?.builder:routes?.review;
  if(!base)return '';
  const params=new URLSearchParams();
  Object.entries(action.params||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&String(v)!=='')params.set(k,String(v))});
  return base+(params.toString()?'?'+params.toString():'');
}

function summarize(recommendations){
  const list=recommendations||[];
  return {
    count:list.length,
    top:list[0]||null,
    urgent:list.filter(x=>x.tone==='urgent'||x.tone==='danger').length
  };
}

window.MSKRecommendationEngine={MODULE_KEY,build,buildUrl,summarize};
})();