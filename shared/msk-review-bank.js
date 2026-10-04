(function(){
  'use strict';

  const MODULE_KEY='msk';
  const KEY='msk:review-bank:v1';
  const AUTO_FLAG_MISSES=2;
  const MASTERY_TARGET=3;

  function load(){
    try{
      const parsed=JSON.parse(localStorage.getItem(KEY)||'{"items":{}}');
      if(!parsed.items) parsed.items={};
      return parsed;
    }catch(e){ return {items:{}}; }
  }

  function save(bank){ localStorage.setItem(KEY,JSON.stringify(bank)); }

  function idFor(item){
    return [MODULE_KEY,item.quizId||item.sourceQuiz||'',item.questionId||item.id||'',item.lecture||'',item.topic||'',item.concept||'']
      .join('||').toLowerCase();
  }

  function base(item){
    return {
      id:idFor(item),
      moduleKey:MODULE_KEY,
      quizId:item.quizId||item.sourceQuiz||'',
      questionId:String(item.questionId||item.id||''),
      week:item.week||'',
      lecture:item.lecture||'',
      topic:item.topic||'',
      concept:item.concept||'',
      difficulty:item.difficulty||'',
      questionStem:item.stem||item.questionStem||'',
      choices:item.options||item.choices||[],
      answer:item.answer||'',
      explanation:item.explanation||'',
      transferCheck:item.reviewCheck||item.transferCheck||null,
      sourceQuiz:item.sourceQuiz||item.source||item.quizId||'',
      misses:0,
      attempts:0,
      manual:false,
      active:false,
      mastered:false,
      masteryStreak:0,
      lastConfidence:null,
      updatedAt:new Date().toISOString()
    };
  }

  function getEntry(bank,item){
    const id=idFor(item);
    if(!bank.items[id]) bank.items[id]=base(item);
    const e=bank.items[id];
    Object.assign(e,{
      moduleKey:MODULE_KEY,
      quizId:item.quizId||item.sourceQuiz||e.quizId,
      questionId:String(item.questionId||item.id||e.questionId||''),
      week:item.week||e.week,
      lecture:item.lecture||e.lecture,
      topic:item.topic||e.topic,
      concept:item.concept||e.concept,
      difficulty:item.difficulty||e.difficulty,
      questionStem:item.stem||item.questionStem||e.questionStem,
      choices:item.options||item.choices||e.choices,
      answer:item.answer||e.answer,
      explanation:item.explanation||e.explanation,
      transferCheck:item.reviewCheck||item.transferCheck||e.transferCheck,
      sourceQuiz:item.sourceQuiz||item.source||item.quizId||e.sourceQuiz
    });
    return e;
  }

  function recordPrimaryOutcome(item,correct,confidence){
    const bank=load(),e=getEntry(bank,item);
    e.attempts=(e.attempts||0)+1;
    e.lastConfidence=confidence||null;
    if(!correct){
      e.misses=(e.misses||0)+1;
      e.masteryStreak=0;
      if(e.mastered||e.misses>=AUTO_FLAG_MISSES)e.active=true;
      if(e.mastered)e.mastered=false;
    }
    e.updatedAt=new Date().toISOString();
    save(bank);return e;
  }

  function fileItem(item){
    const bank=load(),e=getEntry(bank,item);
    e.manual=true;
    e.active=true;
    e.mastered=false;
    e.masteryStreak=0;
    e.updatedAt=new Date().toISOString();
    save(bank);return e;
  }

  function unfileItem(item){
    const bank=load(),e=getEntry(bank,item);
    e.manual=false;
    if((e.misses||0)<AUTO_FLAG_MISSES)e.active=false;
    e.updatedAt=new Date().toISOString();
    save(bank);return e;
  }

  function recordMastery(item,success){
    const bank=load(),e=getEntry(bank,item);
    if(success){
      e.masteryStreak=(e.masteryStreak||0)+1;
      if(e.masteryStreak>=MASTERY_TARGET&&!e.manual){
        e.active=false;
        e.mastered=true;
      }
    }else{
      e.masteryStreak=0;
      e.active=true;
      e.mastered=false;
    }
    e.updatedAt=new Date().toISOString();
    save(bank);return e;
  }

  function getActive(){return Object.values(load().items).filter(x=>x.moduleKey===MODULE_KEY&&x.active);}
  function getAll(){return Object.values(load().items).filter(x=>x.moduleKey===MODULE_KEY);}
  function stats(){
    const all=getAll();
    return {
      active:all.filter(x=>x.active).length,
      manual:all.filter(x=>x.active&&x.manual).length,
      automatic:all.filter(x=>x.active&&!x.manual&&x.misses>=AUTO_FLAG_MISSES).length,
      mastered:all.filter(x=>x.mastered).length
    };
  }
  function clear(){localStorage.removeItem(KEY);}

  window.MSKReviewBank={
    MODULE_KEY,KEY,AUTO_FLAG_MISSES,MASTERY_TARGET,
    recordPrimaryOutcome,fileItem,unfileItem,recordMastery,getActive,getAll,stats,clear
  };
})();
