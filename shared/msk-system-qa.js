(function(){
'use strict';

const MODULE_KEY='msk';
const LETTERS=['A','B','C','D'];
const DIFFICULTIES=['In-House','Intermediate','Step 1'];
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const pct=(n,d)=>d?Math.round(n/d*100):0;

function issue(severity,code,message,extra){
  return {severity,code,message,...(extra||{})};
}

function countBy(items,field){
  const out={};
  (items||[]).forEach(item=>{
    const key=text(item?.[field])||'Uncategorized';
    out[key]=(out[key]||0)+1;
  });
  return out;
}

function answerDistribution(bank,questions){
  const out={A:0,B:0,C:0,D:0,unresolved:0};
  (questions||[]).forEach(q=>{
    const i=bank.answerIndex(q);
    if(i>=0&&i<4)out[LETTERS[i]]++;
    else out.unresolved++;
  });
  return out;
}

function answerBalanceWarnings(bank,questions,quizId){
  const n=(questions||[]).length;
  if(n<20)return [];
  const dist=answerDistribution(bank,questions);
  const warnings=[];
  LETTERS.forEach(letter=>{
    const share=dist[letter]/n;
    if(share>.40)warnings.push(issue('warning','answer_position_overrepresented',letter+' is correct on '+pct(dist[letter],n)+'% of this quiz.',{quiz_id:quizId,answer:letter,count:dist[letter],total:n}));
    if(share<.10)warnings.push(issue('warning','answer_position_underrepresented',letter+' is correct on only '+pct(dist[letter],n)+'% of this quiz.',{quiz_id:quizId,answer:letter,count:dist[letter],total:n}));
  });
  return warnings;
}

function trackingIssues(bank,tracking){
  const errors=[],warnings=[];
  const published=bank.published();
  if(!tracking||typeof tracking.validateQuestion!=='function'){
    errors.push(issue('error','tracking_validator_unavailable','MSKQuizTracking.validateQuestion is unavailable.'));
    return {errors,warnings,checked:0};
  }
  published.forEach(q=>{
    let converted=null;
    try{converted=bank.toTrackingQuestion(q)}catch(e){
      errors.push(issue('error','tracking_conversion_failed','Could not convert bank question to tracking format: '+(e?.message||e),{question_id:q.question_id}));
      return;
    }
    if(!converted){
      errors.push(issue('error','tracking_conversion_empty','Bank question did not convert to tracking format.',{question_id:q.question_id}));
      return;
    }
    const defaults={quizId:q.source_quiz_id||'msk-system-qa',quizName:'MSK System QA',week:q.week,lecture:q.lecture,topic:q.topic,section:'System QA',mode:'practice'};
    try{
      const result=tracking.validateQuestion(converted,defaults);
      if(result&&!result.valid){
        errors.push(issue('error','tracking_contract_failed','Tracking contract missing: '+(result.missing||[]).join(', '),{question_id:q.question_id}));
      }
    }catch(e){
      errors.push(issue('error','tracking_validation_exception','Tracking validation threw an error: '+(e?.message||e),{question_id:q.question_id}));
    }
  });
  return {errors,warnings,checked:published.length};
}

function unusedQuestions(bank,definitions){
  const published=bank.published();
  const usedAll=new Set();
  const usedPublished=new Set();
  definitions.all({includeRetired:false}).forEach(d=>(d.question_ids||[]).forEach(id=>usedAll.add(id)));
  definitions.published().forEach(d=>(d.question_ids||[]).forEach(id=>usedPublished.add(id)));
  return {
    not_in_any_active_definition:published.filter(q=>!usedAll.has(q.question_id)),
    not_in_published_definition:published.filter(q=>!usedPublished.has(q.question_id))
  };
}

function sourceDefinitionObservations(bank,definitions){
  const known=new Set(definitions.all({includeRetired:true}).map(d=>d.quiz_id));
  return bank.published()
    .filter(q=>q.source_quiz_id&&!known.has(q.source_quiz_id))
    .map(q=>issue('info','source_quiz_definition_missing','The question source_quiz_id has no matching quiz definition yet.',{question_id:q.question_id,quiz_id:q.source_quiz_id}));
}

function definitionOverlap(definitions){
  const defs=definitions.published();
  const warnings=[];
  for(let i=0;i<defs.length;i++){
    for(let j=i+1;j<defs.length;j++){
      const a=defs[i],b=defs[j];
      if(Math.min(a.question_ids.length,b.question_ids.length)<10)continue;
      const bs=new Set(b.question_ids);
      const shared=a.question_ids.filter(id=>bs.has(id)).length;
      const ratio=shared/Math.min(a.question_ids.length,b.question_ids.length);
      if(ratio>.70){
        warnings.push(issue('warning','high_quiz_overlap',a.quiz_name+' and '+b.quiz_name+' share '+shared+' questions ('+Math.round(ratio*100)+'% of the smaller quiz).',{quiz_id:a.quiz_id,other_quiz_id:b.quiz_id,shared}));
      }
    }
  }
  return warnings;
}

function expectedCountIssues(def){
  const expected=Number(def?.metadata?.expected_count);
  if(!Number.isFinite(expected)||expected<=0)return [];
  if(expected!==def.question_ids.length){
    return [issue('error','expected_count_mismatch','Expected '+expected+' questions but definition contains '+def.question_ids.length+'.',{quiz_id:def.quiz_id,expected,actual:def.question_ids.length})];
  }
  return [];
}

function expectedDifficultyIssues(def,questions){
  const target=def?.metadata?.difficulty_targets;
  if(!target||typeof target!=='object')return [];
  const actual=countBy(questions,'difficulty');
  const warnings=[];
  DIFFICULTIES.forEach(diff=>{
    if(target[diff]===undefined)return;
    const expected=Number(target[diff]);
    if(Number.isFinite(expected)&&Number(actual[diff]||0)!==expected){
      warnings.push(issue('warning','difficulty_target_mismatch',diff+' target is '+expected+' but quiz contains '+Number(actual[diff]||0)+'.',{quiz_id:def.quiz_id,difficulty:diff,expected,actual:Number(actual[diff]||0)}));
    }
  });
  return warnings;
}

function quizReport(def,bank,definitions){
  const validation=definitions.validateDefinition(def,bank);
  const questions=(def.question_ids||[]).map(id=>bank.getById(id)).filter(Boolean);
  const extraErrors=[...expectedCountIssues(def)];
  const extraWarnings=[...answerBalanceWarnings(bank,questions,def.quiz_id),...expectedDifficultyIssues(def,questions)];
  const errors=[...validation.errors,...extraErrors];
  const warnings=[...validation.warnings,...extraWarnings];
  let status='ready';
  if(def.status==='draft')status='draft';
  else if(def.status==='retired')status='retired';
  else if(errors.length)status='blocked';
  else if(warnings.length)status='needs_attention';
  return {
    quiz_id:def.quiz_id,
    quiz_name:def.quiz_name,
    section:def.section,
    week:def.week,
    status,
    definition_status:def.status,
    question_count:def.question_ids.length,
    questions,
    errors,
    warnings,
    answer_distribution:answerDistribution(bank,questions),
    difficulty_distribution:countBy(questions,'difficulty'),
    topic_distribution:countBy(questions,'topic'),
    lecture_distribution:countBy(questions,'lecture')
  };
}

function qualityWarningCounts(bankValidation){
  const out={};
  (bankValidation?.warnings||[]).forEach(w=>out[w.code]=(out[w.code]||0)+1);
  return out;
}

function build(bank,definitions,tracking){
  if(!bank||!definitions){
    return {status:'blocked',label:'BLOCKED',errors:[issue('error','registry_missing','Question Bank or Quiz Definition registry did not load.')],warnings:[],info:[],metrics:{}};
  }

  const bankValidation=bank.validateAll();
  const definitionValidation=definitions.validateAll(bank);
  const trackingValidation=trackingIssues(bank,tracking);
  const quizReports=definitions.all({includeRetired:true}).map(d=>quizReport(d,bank,definitions));
  const overlapWarnings=definitionOverlap(definitions);
  const unused=unusedQuestions(bank,definitions);
  const info=sourceDefinitionObservations(bank,definitions);

  const errors=[
    ...(bankValidation.errors||[]).map(x=>({...x,severity:'error',area:'Question Bank'})),
    ...(definitionValidation.errors||[]).map(x=>({...x,severity:'error',area:'Quiz Definitions'})),
    ...trackingValidation.errors.map(x=>({...x,area:'Tracking'})),
    ...quizReports.flatMap(q=>q.errors.filter(e=>!definitionValidation.errors.some(d=>d.code===e.code&&d.quiz_id===e.quiz_id&&d.question_id===e.question_id)).map(e=>({...e,severity:'error',area:'Quiz QA'})))
  ];
  const warnings=[
    ...(bankValidation.warnings||[]).map(x=>({...x,severity:'warning',area:'Question Bank'})),
    ...(definitionValidation.warnings||[]).map(x=>({...x,severity:'warning',area:'Quiz Definitions'})),
    ...trackingValidation.warnings.map(x=>({...x,area:'Tracking'})),
    ...quizReports.flatMap(q=>q.warnings.filter(e=>!definitionValidation.warnings.some(d=>d.code===e.code&&d.quiz_id===e.quiz_id&&d.question_id===e.question_id)).map(e=>({...e,severity:'warning',area:'Quiz QA'}))),
    ...overlapWarnings.map(x=>({...x,area:'Quiz QA'}))
  ];

  const bankStats=bank.stats();
  const defStats=definitions.stats(bank);
  const publishedQuestions=bank.published();
  const publishedDefs=definitions.published();

  let status,label;
  if(errors.length){status='blocked';label='BLOCKED'}
  else if(bankStats.total===0&&defStats.total===0){status='ready_for_content';label='READY FOR CONTENT'}
  else if(warnings.length){status='needs_attention';label='NEEDS ATTENTION'}
  else{status='ready';label='READY'}

  const coverage={
    weeks:countBy(publishedQuestions,'week'),
    lectures:countBy(publishedQuestions,'lecture'),
    topics:countBy(publishedQuestions,'topic'),
    difficulties:countBy(publishedQuestions,'difficulty'),
    answers:answerDistribution(bank,publishedQuestions)
  };

  return {
    module_key:MODULE_KEY,
    generated_at:new Date().toISOString(),
    status,label,
    errors,warnings,info,
    quiz_reports:quizReports,
    unused,
    coverage,
    quality_warning_counts:qualityWarningCounts(bankValidation),
    metrics:{
      total_questions:bankStats.total,
      published_questions:bankStats.published,
      draft_questions:bankStats.drafts,
      question_packs:bankStats.packs,
      total_definitions:defStats.total,
      published_definitions:defStats.published,
      draft_definitions:defStats.drafts,
      questions_referenced:defStats.questions_referenced,
      tracking_questions_checked:trackingValidation.checked,
      unused_published_questions:unused.not_in_any_active_definition.length,
      errors:errors.length,
      warnings:warnings.length,
      published_quizzes_ready:quizReports.filter(q=>q.definition_status==='published'&&q.status==='ready').length,
      published_quizzes_blocked:quizReports.filter(q=>q.definition_status==='published'&&q.status==='blocked').length,
      published_quizzes_attention:quizReports.filter(q=>q.definition_status==='published'&&q.status==='needs_attention').length,
      published_quizzes:publishedDefs.length
    }
  };
}

window.MSKSystemQA={MODULE_KEY,build,quizReport,answerDistribution};
})();