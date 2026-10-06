(function(){
'use strict';

const MODULE_KEY='msk';
const DIFFICULTIES=['In-House','Intermediate','Step 1'];
const text=v=>String(v??'').trim();
const norm=v=>text(v).toLowerCase().replace(/\s+/g,'_');
const isActive=item=>['active','improving'].includes(norm(item?.status));
const isDue=item=>isActive(item)&&item?.next_due_at&&new Date(item.next_due_at)<=new Date();
const reasons=item=>Array.isArray(item?.review_reasons)?item.review_reasons:[];
const isBankQuestion=item=>Boolean(item&&item.module_key===MODULE_KEY&&item.question_id&&item.source_quiz_id&&item.stem&&Array.isArray(item.choices));
const itemKey=item=>isBankQuestion(item)?'bank::'+text(item?.question_id):text(item?.quiz_id)+'::'+text(item?.question_id);
const qid=item=>text(item?.question_id);
const attemptTime=row=>{
  const raw=row?.answered_at??row?.created_at??row?.updated_at??row?.timestamp;
  const n=raw?new Date(raw).getTime():0;
  return Number.isFinite(n)?n:0;
};

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
  if(source==='adaptive'||source==='all_active')return isActive(item);
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

function attemptIndex(attempts){
  const latest=new Map(),anyIncorrect=new Set(),attempted=new Set();
  (attempts||[]).forEach(row=>{
    const id=qid(row);if(!id)return;
    attempted.add(id);
    if(!row.is_correct)anyIncorrect.add(id);
    const prior=latest.get(id);
    if(!prior||attemptTime(row)>=attemptTime(prior))latest.set(id,row);
  });
  return {latest,attempted,anyIncorrect};
}

function historyMatch(item,config,index){
  const mode=config?.historyMode||'any';
  if(mode==='any')return true;
  const id=qid(item);if(!id)return false;
  if(mode==='unseen')return !index.attempted.has(id);
  if(mode==='latest_incorrect'){
    const row=index.latest.get(id);
    return Boolean(row&&!row.is_correct);
  }
  if(mode==='ever_incorrect')return index.anyIncorrect.has(id);
  return true;
}

function recentMatch(item,config,index,nowMs){
  const days=Number(config?.excludeRecentDays||0);
  if(!days)return true;
  const latest=index.latest.get(qid(item));
  if(!latest)return true;
  const cutoff=nowMs-days*86400000;
  return attemptTime(latest)<cutoff;
}

function weakestTopicSet(radarRows,count){
  const n=Math.max(0,Number(count||0));
  if(!n||!radarRows?.length)return null;
  return new Set(radarRows.slice(0,n).map(r=>text(r.key)).filter(Boolean));
}

function weaknessMatch(item,set){
  if(!set)return true;
  return set.has(text(item?.topic||item?.lecture||'Uncategorized'));
}

function scoreReviewItem(item,radarMap,index){
  const c=categories(item),topic=text(item?.topic||item?.lecture||'Uncategorized');
  let score=Number(radarMap.get(topic)||0);
  if(c.includes('due'))score+=30;
  if(c.includes('repeatedly_missed'))score+=22;
  if(c.includes('confidently_wrong'))score+=20;
  if(c.includes('low_confidence'))score+=12;
  if(c.includes('filed'))score+=7;
  score+=Math.min(18,Number(item?.miss_count||0)*4);
  score+=Math.min(8,Number(item?.review_attempts||0));
  const latest=index.latest.get(qid(item));
  if(latest&&!latest.is_correct)score+=6;
  return Math.round(score);
}

function scoreBankQuestion(item,radarMap,index){
  let score=Number(radarMap.get(text(item?.topic||item?.lecture||'Uncategorized'))||0);
  if(!index.attempted.has(qid(item)))score+=8;
  const latest=index.latest.get(qid(item));
  if(latest&&!latest.is_correct)score+=12;
  if(item.difficulty==='Step 1')score+=2;
  return Math.round(score);
}

function mixWeights(config){
  const mode=config?.difficultyMix||'any';
  if(mode==='balanced')return {'In-House':33,'Intermediate':34,'Step 1':33};
  if(mode==='step1_heavy')return {'In-House':20,'Intermediate':30,'Step 1':50};
  if(mode==='inhouse_heavy')return {'In-House':50,'Intermediate':30,'Step 1':20};
  if(mode==='custom'){
    const raw=config?.customDifficultyMix||{};
    const out={};
    DIFFICULTIES.forEach(k=>out[k]=Math.max(0,Number(raw[k]||0)));
    const sum=Object.values(out).reduce((a,b)=>a+b,0);
    if(sum<=0)return null;
    DIFFICULTIES.forEach(k=>out[k]=out[k]/sum*100);
    return out;
  }
  return null;
}

function quotasFor(count,weights){
  if(!weights||count<=0)return null;
  const rows=DIFFICULTIES.map(k=>{
    const exact=count*(Number(weights[k]||0)/100);
    return {key:k,base:Math.floor(exact),fraction:exact-Math.floor(exact)};
  });
  let used=rows.reduce((s,r)=>s+r.base,0);
  rows.sort((a,b)=>b.fraction-a.fraction||DIFFICULTIES.indexOf(a.key)-DIFFICULTIES.indexOf(b.key));
  for(let i=0;used<count&&i<rows.length;i++,used++)rows[i].base++;
  const out={};rows.forEach(r=>out[r.key]=r.base);return out;
}

function selectRanked(ranked,count,config){
  if(count<=0)return ranked.slice();
  const weights=mixWeights(config);
  if(!weights)return ranked.slice(0,count);
  const quotas=quotasFor(count,weights);
  const selected=[],selectedKeys=new Set();
  DIFFICULTIES.forEach(diff=>{
    let taken=0;
    for(const row of ranked){
      if(taken>=quotas[diff])break;
      if(text(row.item?.difficulty)!==diff)continue;
      const key=itemKey(row.item);if(selectedKeys.has(key))continue;
      selected.push(row);selectedKeys.add(key);taken++;
    }
  });
  if(selected.length<count){
    for(const row of ranked){
      if(selected.length>=count)break;
      const key=itemKey(row.item);if(selectedKeys.has(key))continue;
      selected.push(row);selectedKeys.add(key);
    }
  }
  return selected;
}

function build(reviewItems,questionAttempts,config,bankQuestions){
  const source=config?.source||'adaptive';
  const reviews=(reviewItems||[]).filter(x=>x&&x.module_key===MODULE_KEY);
  const attempts=(questionAttempts||[]).filter(x=>x&&x.module_key===MODULE_KEY);
  const bank=(bankQuestions||[]).filter(x=>isBankQuestion(x)&&norm(x.status||'published')==='published');
  const radar=window.MSKWeaknessRadar;
  const radarRows=radar?radar.build(attempts,reviews,{groupBy:'topic'}):[];
  const radarMap=new Map(radarRows.map(r=>[text(r.key),Number(r.score||0)]));
  const history=attemptIndex(attempts);
  const weakCount=Math.max(0,Number(config?.weakestTopics||0));
  const weakSet=weakestTopicSet(radarRows,weakCount);
  const weaknessFallback=weakCount>0&&!weakSet;
  const nowMs=Date.now();

  const rawPool=source==='full_bank'?bank:reviews.filter(item=>sourceMatch(item,source));
  const metadataPool=rawPool.filter(item=>filterMatch(item,config));
  const historyPool=metadataPool.filter(item=>historyMatch(item,config,history));
  const recentPool=historyPool.filter(item=>recentMatch(item,config,history,nowMs));
  const sourcePool=recentPool.filter(item=>weaknessMatch(item,weakSet));
  const ready=sourcePool.filter(usable);
  const unavailable=sourcePool.length-ready.length;

  let ranked;
  if(source==='full_bank'){
    ranked=ready.map(item=>({item,priority:scoreBankQuestion(item,radarMap,history),source_type:'bank'}))
      .sort((a,b)=>b.priority-a.priority||itemKey(a.item).localeCompare(itemKey(b.item)));
  }else{
    ranked=ready.map(item=>({item,priority:scoreReviewItem(item,radarMap,history),source_type:'review'}))
      .sort((a,b)=>b.priority-a.priority||Number(b.item?.miss_count||0)-Number(a.item?.miss_count||0)||itemKey(a.item).localeCompare(itemKey(b.item)));
  }

  const requested=Number(config?.count||0);
  let selected=selectRanked(ranked,requested,config);
  if(config?.randomize)selected=shuffle(selected);

  const weights=mixWeights(config);
  const targetQuotas=weights&&requested>0?quotasFor(requested,weights):null;
  const actualDifficulty={};
  selected.forEach(x=>{const d=text(x.item?.difficulty)||'Uncategorized';actualDifficulty[d]=(actualDifficulty[d]||0)+1});

  return {
    module_key:MODULE_KEY,
    source,
    source_type:source==='full_bank'?'bank':'review',
    base_source:rawPool.length,
    after_metadata:metadataPool.length,
    after_history:historyPool.length,
    after_recent:recentPool.length,
    total_source:sourcePool.length,
    usable:ready.length,
    unavailable,
    filtered_out:rawPool.length-sourcePool.length,
    weakness_fallback:weaknessFallback,
    weakest_topics_applied:weakSet?Array.from(weakSet):[],
    difficulty_targets:targetQuotas,
    difficulty_selected:actualDifficulty,
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

window.MSKAdaptiveQuiz={
  MODULE_KEY,DIFFICULTIES,categories,usable,isBankQuestion,itemKey,build,options,summary,
  mixWeights,quotasFor
};
})();