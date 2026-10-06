(function(){
'use strict';

const MODULE_KEY='msk';
const SCHEMA_VERSION=1;
const ALLOWED_STATUSES=['published','draft','retired'];
const ALLOWED_MODES=['practice','advanced_review'];
const definitions=[];
const definitionIds=new Set();
const registrationIssues=[];
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const validId=v=>/^[a-z0-9][a-z0-9._:-]*$/i.test(text(v));

function canonicalDefinition(raw){
  const d=clone(raw||{});
  const allowed=Array.isArray(d.allowed_modes??d.allowedModes)?(d.allowed_modes??d.allowedModes).map(text).filter(Boolean):['practice','advanced_review'];
  return {
    module_key:MODULE_KEY,
    schema_version:SCHEMA_VERSION,
    quiz_id:text(d.quiz_id??d.quizId??d.id),
    quiz_name:text(d.quiz_name??d.quizName??d.name),
    section:text(d.section||'MSK Quiz'),
    week:text(d.week),
    description:text(d.description),
    question_ids:Array.isArray(d.question_ids??d.questionIds)?(d.question_ids??d.questionIds).map(text).filter(Boolean):[],
    status:text(d.status||'draft').toLowerCase(),
    default_mode:text((d.default_mode??d.defaultMode)||'practice'),
    allowed_modes:Array.from(new Set(allowed)),
    tags:Array.isArray(d.tags)?d.tags.map(text).filter(Boolean):[],
    metadata:clone(d.metadata||{})
  };
}

function validateDefinition(raw,bank){
  const d=canonicalDefinition(raw),errors=[],warnings=[];
  const error=(code,message,extra={})=>errors.push({code,message,quiz_id:d.quiz_id||null,...extra});
  const warn=(code,message,extra={})=>warnings.push({code,message,quiz_id:d.quiz_id||null,...extra});

  if(!d.quiz_id)error('missing_quiz_id','quiz_id is required.');
  else if(!validId(d.quiz_id))error('invalid_quiz_id','quiz_id may use letters, numbers, dot, underscore, colon, and hyphen only.');
  if(!d.quiz_name)error('missing_quiz_name','quiz_name is required.');
  if(!d.section)error('missing_section','section is required.');
  if(!ALLOWED_STATUSES.includes(d.status))error('invalid_status','status must be published, draft, or retired.');
  if(!ALLOWED_MODES.includes(d.default_mode))error('invalid_default_mode','default_mode must be practice or advanced_review.');
  if(!d.allowed_modes.length)error('missing_allowed_modes','At least one allowed mode is required.');
  d.allowed_modes.forEach(mode=>{if(!ALLOWED_MODES.includes(mode))error('invalid_allowed_mode','Unsupported allowed mode: '+mode)});
  if(!d.allowed_modes.includes(d.default_mode))error('default_mode_not_allowed','default_mode must also appear in allowed_modes.');

  if(d.status==='published'&&!d.question_ids.length)error('published_quiz_empty','Published quiz definitions must contain at least one question_id.');
  if(!d.question_ids.length&&d.status!=='published')warn('empty_question_list','This definition does not contain question IDs yet.');
  const unique=new Set();
  d.question_ids.forEach((id,index)=>{
    if(!validId(id))error('invalid_question_id','Invalid question_id reference: '+id,{question_id:id,index});
    if(unique.has(id))error('duplicate_question_reference','Question appears more than once in this quiz: '+id,{question_id:id,index});
    unique.add(id);
  });

  if(!bank){
    if(d.question_ids.length)warn('bank_unavailable','Question Bank was not loaded, so references could not be verified.');
  }else{
    d.question_ids.forEach((id,index)=>{
      const q=bank.getById(id);
      if(!q){error('unknown_question_id','Definition references a question not found in the central bank: '+id,{question_id:id,index});return}
      if(d.status==='published'&&q.status!=='published')error('unpublished_question_reference','Published quiz references a non-published bank question: '+id,{question_id:id,index});
      if(d.week&&q.week&&d.week!==q.week)warn('week_mismatch','Quiz week '+d.week+' differs from question week '+q.week+'.',{question_id:id,index});
      if(q.source_quiz_id&&q.source_quiz_id!==d.quiz_id)warn('source_quiz_mismatch','Question canonical source '+q.source_quiz_id+' differs from definition '+d.quiz_id+'.',{question_id:id,index});
    });
  }

  if(!d.week)warn('missing_week','No quiz-level week is set. This is fine for cumulative or cross-week quizzes.');
  if(!d.description)warn('missing_description','No quiz description is set.');
  if(!d.tags.length)warn('missing_tags','No quiz-level tags are set.');
  return {valid:errors.length===0,definition:d,errors,warnings};
}

function registerDefinition(raw){
  const d=canonicalDefinition(raw);
  if(!d.quiz_id||!validId(d.quiz_id)){
    registrationIssues.push({severity:'error',code:'invalid_quiz_id',message:'A valid quiz_id is required.',quiz_id:d.quiz_id||null});
    return {registered:false};
  }
  if(definitionIds.has(d.quiz_id)){
    registrationIssues.push({severity:'error',code:'duplicate_quiz_id',message:'Duplicate quiz_id: '+d.quiz_id,quiz_id:d.quiz_id});
    return {registered:false};
  }
  definitionIds.add(d.quiz_id);
  definitions.push(d);
  return {registered:true,quiz_id:d.quiz_id};
}

function registerMany(list){
  return (Array.isArray(list)?list:[]).map(registerDefinition);
}

function all(options){
  const status=text(options?.status);
  const includeRetired=Boolean(options?.includeRetired);
  return definitions.filter(d=>{
    if(status)return d.status===status;
    if(includeRetired)return true;
    return d.status!=='retired';
  }).map(clone);
}

function published(){return definitions.filter(d=>d.status==='published').map(clone)}
function getById(id){const d=definitions.find(x=>x.quiz_id===text(id));return d?clone(d):null}

function validateAll(bank){
  const errors=[],warnings=[];
  registrationIssues.forEach(x=>(x.severity==='error'?errors:warnings).push(clone(x)));
  definitions.forEach(d=>{
    const result=validateDefinition(d,bank);
    errors.push(...result.errors);warnings.push(...result.warnings);
  });
  return {valid:errors.length===0,errors,warnings,total:definitions.length};
}

function hydrate(id,bank){
  const d=getById(id);
  if(!d)return {valid:false,definition:null,questions:[],trackingQuestions:[],errors:[{code:'definition_not_found',message:'Quiz definition not found: '+text(id),quiz_id:text(id)||null}],warnings:[]};
  const validation=validateDefinition(d,bank);
  if(!validation.valid)return {...validation,questions:[],trackingQuestions:[]};
  const questions=d.question_ids.map(qid=>bank?.getById(qid)).filter(Boolean);
  const trackingQuestions=questions.map(q=>bank.toTrackingQuestion(q)).filter(Boolean);
  return {
    ...validation,
    questions,
    trackingQuestions,
    config:{
      quizId:d.quiz_id,
      quizName:d.quiz_name,
      week:d.week,
      lecture:'',
      topic:'',
      section:d.section,
      mode:d.default_mode
    }
  };
}

function stats(bank){
  const validation=validateAll(bank);
  const countBy=field=>{
    const map={};
    definitions.forEach(d=>{const key=text(d[field])||'Uncategorized';map[key]=(map[key]||0)+1});
    return map;
  };
  return {
    module_key:MODULE_KEY,
    schema_version:SCHEMA_VERSION,
    total:definitions.length,
    published:definitions.filter(d=>d.status==='published').length,
    drafts:definitions.filter(d=>d.status==='draft').length,
    retired:definitions.filter(d=>d.status==='retired').length,
    questions_referenced:definitions.reduce((sum,d)=>sum+d.question_ids.length,0),
    errors:validation.errors.length,
    warnings:validation.warnings.length,
    valid:validation.valid,
    by_section:countBy('section'),
    by_week:countBy('week')
  };
}

function launchUrl(id,base){
  const target=text(base)||'msk-quiz-template.html';
  return target+'?quiz='+encodeURIComponent(text(id));
}

window.MSKQuizDefinitions={
  MODULE_KEY,SCHEMA_VERSION,ALLOWED_STATUSES,ALLOWED_MODES,
  registerDefinition,registerMany,all,published,getById,validateDefinition,validateAll,hydrate,stats,launchUrl
};
})();