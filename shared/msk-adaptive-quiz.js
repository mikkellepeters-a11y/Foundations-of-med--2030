(function(){
'use strict';

const MODULE_KEY='msk';
const text=v=>String(v??'').trim();
const norm=v=>text(v).toLowerCase().replace(/\s+/g,'_');
const isActive=item=>['active','improving'].includes(norm(item?.status));
const isDue=item=>isActive(item)&&item?.next_due_at&&new Date(item.next_due_at)<=new Date();
const reasons=item=>Array.isArray(item?.review_reasons)?item.review_reasons:[];
const isBankQuestion=item=>Boolean(item&&item.module_key===MODULE_KEY&&item.question_id&&item.source_quiz_id&&item.stem&&Array.isArray(item.choices));
const itemKey=item=>isBankQuestion(item)?'bank::'+text(item?.question_id):text(item?.quiz_id)+'::'+text(item?.question_id);

function categories(item){
  const out=[];
  const r=reasons(item);
  if(item?.manually_filed||r.includes('filed'))out.push('filed');
  if(r.includes('repeatedly_missed')||Number(item?.miss_count||0)>=2)out.push('repeatedly_missed');
  if(r.includes('confidently_wrong'))out.push('confidently_wrong');
  if(r.includes('low_confidence'))out.push('low_confidence');
  if(isDue(item))out.push('due');
  if(norm(item?.status)==='mastered')out.push('mastered');
  if(isActive(item))out.push('active');
  return Array.from(new Set(out));
}

function usable(item){
  if(isBankQuestion(item))return Boolean(text(item.stem)&&Array.isArray(item.choices)&&item.choices.length>=2&&text(item.correct_answer));
  const s=item?.question_snapshot||{};
  return Boolean(text(s.stem)&&Array.isArray(s.choices)&&s.choices.length>=2&&text(s.answer));
}

function sourceMatch(item,source){
  const c=categories(item);
  if(source==='adaptive')return isActive(item);
  if(source==='all_active')return isActive(item);
  if(source==='due')return c.includes('due');
  if(source==='filed')return c.includes('filed')&&isActive(item);
  if(source==='repeatedly_missed')return c.includes('repeatedly_missed')&&isActive(item);
  if(source==='confidently_wrong')return c.includes('confidently_wrong')&&isActive(item);
  if(source==='low_confidence')return c.includes('low_confidence')&&isActive(item);
  return false;
}

function filterMatch(item,config){
  if(config?.week&&text(item?.week)!==text(config.week))return false;
  if(config?.lecture&&text(item?.lecture)!==text(config.lecture))return false;
  if(config?.topic&&text(item?.topic)!==text(config.topic))return false;
  if(config?.difficulty&&text(item?.difficulty)!==text(config.difficulty))return false;
  return true;
}

function shuffle(list){
  const a=list.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

function scoreReviewItem(item,radarMap){
  const c=categories(item),topic=text(item?.topic||item?.lecture||'Uncategorized');
  let score=Number(radarMap.get(topic)||0);
  if(c.includes('due'))score+=30;
  if(c.includes('repeatedly_missed'))score+=22;
  if(c.includes('confidently_wrong'))score+=20;
  if(c.includes('low_confidence'))score+=12;
  if(c.includes('filed'))score+=7;
  score+=Math.min(18,Number(item?.miss_count||0)*4);
  score+=Math.min(8,Number(item?.review_attempts||0));
  return Math.round(score);
}

function scoreBankQuestion(item,radarMap,attemptedIds){
  let score=Number(radarMap.get(text(item?.topic||item?.lecture||'Uncategorized'))||0);
  if(!attemptedIds.has(text(item.question_id)))score+=8;
  if(item.difficulty==='Step 1')score+=2;
  return Math.round(score);
}

function build(reviewItems,questionAttempts,config,bankQuestions){
  const source=config?.source||'adaptive';
  const reviews=(reviewItems||[]).filter(x=>x&&x.module_key===MODULE_KEY);
  const attempts=(questionAttempts||[]).filter(x=>x&&x.module_key===MODULE_KEY);
  const bank=(bankQuestions||[]).filter(x=>isBankQuestion(x)&&norm(x.status||'published')==='published');
  const radar=window.MSKWeaknessRadar;
  const radarRows=radar?radar.build(attempts,reviews,{groupBy:'topic'}):[];
  const radarMap=new Map(radarRows.map(r=>[text(r.key),Number(r.score||0)]));
  const attemptedIds=new Set(attempts.map(x=>text(x.question_id)).filter(Boolean));

  let sourcePool,ready,unavailable,ranked;
  if(source==='full_bank'){
    sourcePool=bank.filter(item=>filterMatch(item,config));
    ready=sourcePool.filter(usable);
    unavailable=sourcePool.length-ready.length;
    ranked=ready.map(item=>({item,priority:scoreBankQuestion(item,radarMap,attemptedIds),source_type:'bank'}))
      .sort((a,b)=>b.priority-a.priority||itemKey(a.item).localeCompare(itemKey(b.item)));
  }else{
    sourcePool=reviews.filter(item=>sourceMatch(item,source)&&filterMatch(item,config));
    ready=sourcePool.filter(usable);
    unavailable=sourcePool.length-ready.length;
    ranked=ready.map(item=>({item,priority:scoreReviewItem(item,radarMap),source_type:'review'}))
      .sort((a,b)=>b.priority-a.priority||Number(b.item?.miss_count||0)-Number(a.item?.miss_count||0)||itemKey(a.item).localeCompare(itemKey(b.item)));
  }

  const requested=Number(config?.count||0);
  let selected;
  if(source==='adaptive'){
    selected=requested>0?ranked.slice(0,requested):ranked.slice();
    if(config?.randomize)selected=shuffle(selected);
  }else{
    if(config?.randomize)ranked=shuffle(ranked);
    selected=requested>0?ranked.slice(0,requested):ranked.slice();
  }

  return {
    module_key:MODULE_KEY,
    source,
    source_type:source==='full_bank'?'bank':'review',
    total_source:sourcePool.length,
    usable:ready.length,
    unavailable,
    selected:selected.map(x=>x.item),
    selected_keys:selected.map(x=>itemKey(x.item)),
    ranked:selected.map(x=>({key:itemKey(x.item),priority:x.priority,source_type:x.source_type,question_id:x.item.question_id||null,topic:x.item.topic||null,week:x.item.week||null,lecture:x.item.lecture||null,difficulty:x.item.difficulty||null})),
    radar:radarRows
  };
}

function options(items,field){
  return Array.from(new Set((items||[]).filter(x=>x?.module_key===MODULE_KEY).map(x=>text(x?.[field])).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
}

function summary(plan){
  const items=plan?.selected||[];
  const countBy=field=>{
    const m={};
    items.forEach(x=>{const k=text(x?.[field])||'Uncategorized';m[k]=(m[k]||0)+1});
    return Object.entries(m).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  };
  return {count:items.length,topics:countBy('topic'),weeks:countBy('week'),difficulties:countBy('difficulty')};
}

window.MSKAdaptiveQuiz={MODULE_KEY,categories,usable,isBankQuestion,itemKey,build,options,summary};
})();