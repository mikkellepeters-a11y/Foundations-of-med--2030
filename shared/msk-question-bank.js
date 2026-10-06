(function(){
'use strict';

const MODULE_KEY='msk';
const SCHEMA_VERSION=1;
const ALLOWED_DIFFICULTIES=['In-House','Intermediate','Step 1'];
const ALLOWED_STATUSES=['published','draft','retired'];
const LETTERS=['A','B','C','D'];
const packs=[];
const questions=[];
const packIds=new Set();
const questionIds=new Set();
const registrationIssues=[];
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const norm=v=>text(v).toLowerCase().replace(/\s+/g,' ');
const validId=v=>/^[a-z0-9][a-z0-9._:-]*$/i.test(text(v));

function choiceText(choice){
  if(choice==null)return '';
  if(typeof choice==='string'||typeof choice==='number')return String(choice);
  if(typeof choice==='object')return String(choice.text??choice.label??choice.value??choice.answer??'');
  return String(choice);
}

function canonicalQuestion(raw,pack){
  const q=clone(raw||{});
  return {
    module_key:MODULE_KEY,
    schema_version:SCHEMA_VERSION,
    question_id:text(q.question_id??q.questionId??q.id),
    source_quiz_id:text(q.source_quiz_id??q.sourceQuizId??q.quiz_id??q.quizId),
    week:text(q.week),
    lecture:text(q.lecture),
    topic:text(q.topic),
    difficulty:text(q.difficulty),
    stem:text(q.stem??q.questionStem??q.prompt),
    choices:Array.isArray(q.choices??q.options)?clone(q.choices??q.options):[],
    correct_answer:q.correct_answer??q.correctAnswer??q.answer??'',
    explanation:text(q.explanation??q.rationale),
    choice_explanations:clone(q.choice_explanations??q.choiceExplanations??{}),
    hint:text(q.hint),
    tags:Array.isArray(q.tags)?q.tags.map(text).filter(Boolean):[],
    media:Array.isArray(q.media)?clone(q.media):[],
    source_refs:Array.isArray(q.source_refs??q.sourceRefs)?clone(q.source_refs??q.sourceRefs):[],
    status:text(q.status||'published').toLowerCase(),
    metadata:clone(q.metadata||{}),
    pack_id:text(pack?.pack_id),
    pack_label:text(pack?.label)
  };
}

function answerIndex(q){
  const raw=text(q?.correct_answer);
  const upper=raw.toUpperCase();
  if(LETTERS.includes(upper))return LETTERS.indexOf(upper);
  if(/^[1-4]$/.test(raw))return Number(raw)-1;
  for(let i=0;i<q.choices.length;i++)if(norm(choiceText(q.choices[i]))===norm(raw))return i;
  return -1;
}

function explanationFor(q,i){
  const notes=q?.choice_explanations;
  if(Array.isArray(notes))return text(notes[i]);
  if(notes&&typeof notes==='object')return text(notes[LETTERS[i]]??notes[LETTERS[i].toLowerCase()]??notes[i]);
  return '';
}

function validateQuestion(raw,context){
  const q=canonicalQuestion(raw,context?.pack||{});
  const errors=[],warnings=[];
  const error=(code,message)=>errors.push({code,message,question_id:q.question_id||null,pack_id:q.pack_id||null});
  const warn=(code,message)=>warnings.push({code,message,question_id:q.question_id||null,pack_id:q.pack_id||null});

  if(!q.question_id)error('missing_question_id','question_id is required.');
  else if(!validId(q.question_id))error('invalid_question_id','question_id may use letters, numbers, dot, underscore, colon, and hyphen only.');
  if(!q.source_quiz_id)error('missing_source_quiz_id','source_quiz_id is required and must remain stable.');
  else if(!validId(q.source_quiz_id))error('invalid_source_quiz_id','source_quiz_id has an invalid format.');
  if(!q.week)error('missing_week','week is required.');
  if(!q.lecture)error('missing_lecture','lecture is required.');
  if(!q.topic)error('missing_topic','topic is required.');
  if(!q.difficulty)error('missing_difficulty','difficulty is required.');
  else if(!ALLOWED_DIFFICULTIES.includes(q.difficulty))error('invalid_difficulty','difficulty must be In-House, Intermediate, or Step 1.');
  if(!q.stem)error('missing_stem','stem is required.');
  if(!Array.isArray(q.choices)||q.choices.length!==4)error('invalid_choices','Canonical MSK bank questions must have exactly four choices.');
  else{
    const normalized=q.choices.map(choiceText).map(norm);
    if(normalized.some(v=>!v))error('blank_choice','All four choices must contain text.');
    if(new Set(normalized).size!==normalized.length)error('duplicate_choice','Answer choices must be unique.');
  }
  const correct=answerIndex(q);
  if(correct<0)error('invalid_correct_answer','correct_answer must resolve to exactly one answer choice.');
  if(!q.explanation)error('missing_explanation','A detailed explanation is required.');
  if(!ALLOWED_STATUSES.includes(q.status))error('invalid_status','status must be published, draft, or retired.');

  if(!q.hint)warn('missing_hint','No hint is stored.');
  if(!q.tags.length)warn('missing_tags','No searchable tags are stored.');
  if(Array.isArray(q.choices)&&q.choices.length===4){
    const missing=LETTERS.filter((_,i)=>!explanationFor(q,i));
    if(missing.length)warn('missing_choice_explanations','Missing per-choice explanation for '+missing.join(', ')+'.');
  }
  if(!q.source_refs.length)warn('missing_source_refs','No lecture/source reference is attached.');
  if(q.status==='published'&&q.media.some(m=>!text(m?.src??m?.url)))warn('media_missing_src','At least one media item is missing src/url.');

  return {valid:errors.length===0,question:q,errors,warnings};
}

function registerPack(pack){
  const p=pack||{};
  const packId=text(p.pack_id??p.packId);
  const label=text(p.label||packId);
  const list=Array.isArray(p.questions)?p.questions:[];
  if(!packId||!validId(packId)){
    registrationIssues.push({severity:'error',code:'invalid_pack_id',message:'A valid pack_id is required.',pack_id:packId||null});
    return {registered:0,errors:1};
  }
  if(packIds.has(packId)){
    registrationIssues.push({severity:'error',code:'duplicate_pack_id',message:'Duplicate pack_id: '+packId,pack_id:packId});
    return {registered:0,errors:1};
  }
  packIds.add(packId);
  const record={pack_id:packId,label,week:text(p.week),source:text(p.source),question_count:list.length,metadata:clone(p.metadata||{})};
  packs.push(record);
  let registered=0;
  list.forEach((raw,index)=>{
    const q=canonicalQuestion(raw,{pack_id:packId,label});
    if(q.question_id&&questionIds.has(q.question_id)){
      registrationIssues.push({severity:'error',code:'duplicate_question_id',message:'Duplicate global question_id: '+q.question_id,question_id:q.question_id,pack_id:packId,index});
      return;
    }
    if(q.question_id)questionIds.add(q.question_id);
    questions.push(q);
    registered++;
  });
  return {registered,errors:0};
}

function all(options){
  const status=text(options?.status);
  const includeRetired=Boolean(options?.includeRetired);
  return questions.filter(q=>{
    if(status)return q.status===status;
    if(includeRetired)return true;
    return q.status!=='retired';
  }).map(clone);
}

function published(){return questions.filter(q=>q.status==='published').map(clone)}
function getById(id){const q=questions.find(x=>x.question_id===text(id));return q?clone(q):null}
function getPack(id){const p=packs.find(x=>x.pack_id===text(id));return p?clone(p):null}
function listPacks(){return packs.map(clone)}

function validateAll(){
  const errors=[],warnings=[];
  registrationIssues.forEach(x=>(x.severity==='error'?errors:warnings).push(clone(x)));
  questions.forEach(q=>{
    const result=validateQuestion(q,{pack:{pack_id:q.pack_id,label:q.pack_label}});
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });
  return {valid:errors.length===0,errors,warnings,total:questions.length,packs:packs.length};
}

function values(field,options){
  return Array.from(new Set(all(options).map(q=>text(q[field])).filter(Boolean))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
}

function stats(){
  const val=validateAll();
  const publishedCount=questions.filter(q=>q.status==='published').length;
  const drafts=questions.filter(q=>q.status==='draft').length;
  const retired=questions.filter(q=>q.status==='retired').length;
  const countBy=field=>{
    const map={};
    questions.forEach(q=>{const key=text(q[field])||'Uncategorized';map[key]=(map[key]||0)+1});
    return map;
  };
  const answerDistribution={A:0,B:0,C:0,D:0,unresolved:0};
  questions.forEach(q=>{const i=answerIndex(q);if(i>=0)answerDistribution[LETTERS[i]]++;else answerDistribution.unresolved++});
  return {
    module_key:MODULE_KEY,
    schema_version:SCHEMA_VERSION,
    total:questions.length,
    published:publishedCount,
    drafts,
    retired,
    packs:packs.length,
    errors:val.errors.length,
    warnings:val.warnings.length,
    valid:val.valid,
    by_week:countBy('week'),
    by_difficulty:countBy('difficulty'),
    by_topic:countBy('topic'),
    by_source_quiz:countBy('source_quiz_id'),
    answer_distribution:answerDistribution
  };
}

function toTrackingQuestion(input){
  const q=typeof input==='string'?getById(input):canonicalQuestion(input,{pack_id:input?.pack_id,label:input?.pack_label});
  if(!q)return null;
  return {
    question_id:q.question_id,
    week:q.week,
    lecture:q.lecture,
    topic:q.topic,
    difficulty:q.difficulty,
    stem:q.stem,
    choices:clone(q.choices),
    correct_answer:q.correct_answer,
    explanation:q.explanation,
    hint:q.hint,
    choice_explanations:clone(q.choice_explanations),
    metadata:{
      bank_question_id:q.question_id,
      source_quiz_id:q.source_quiz_id,
      bank_pack_id:q.pack_id||null,
      tags:clone(q.tags),
      media:clone(q.media),
      source_refs:clone(q.source_refs),
      ...clone(q.metadata||{})
    }
  };
}

window.MSKQuestionBank={
  MODULE_KEY,SCHEMA_VERSION,ALLOWED_DIFFICULTIES,ALLOWED_STATUSES,
  registerPack,all,published,getById,getPack,listPacks,validateQuestion,validateAll,values,stats,toTrackingQuestion,answerIndex
};
})();