(function(){
'use strict';

if(!window.MSKQuestionBank)throw new Error('Load shared/msk-question-bank.js before the MSK question-bank data file.');

/*
  CANONICAL MSK QUESTION BANK

  Add source-supported MSK questions here when course content becomes available.
  Do not invent placeholder questions. Every question_id is permanent and globally
  unique inside the MSK bank.

  Recommended future organization: keep one registerPack(...) block per week or
  content set so the bank can be split into separate files later without changing
  the registry API.
*/
window.MSKQuestionBank.registerPack({
  pack_id:'msk-canonical',
  label:'Canonical MSK Question Bank',
  source:'question-bank/msk-question-bank-data.js',
  questions:[]
});
})();