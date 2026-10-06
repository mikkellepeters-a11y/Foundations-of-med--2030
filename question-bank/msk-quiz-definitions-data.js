(function(){
'use strict';

if(!window.MSKQuizDefinitions)throw new Error('Load shared/msk-quiz-definitions.js before the MSK quiz-definition data file.');

/*
  PRODUCTION MSK QUIZ DEFINITIONS

  Add quiz definitions here after their question IDs exist in the central question
  bank and pass Question Bank QA. Do not copy stems, choices, or explanations here.

  Example structure only — do not uncomment until those real question IDs exist:

  window.MSKQuizDefinitions.registerDefinition({
    quiz_id:'msk-week13-monday-50',
    quiz_name:'Week 13 Monday Daily Quiz',
    section:'Daily Quiz',
    week:'Week 13',
    description:'Lectures 1–3',
    question_ids:[
      'msk-w13-l01-q001',
      'msk-w13-l01-q002'
    ],
    status:'published',
    default_mode:'practice',
    allowed_modes:['practice','advanced_review'],
    tags:['daily','week-13']
  });
*/

window.MSKQuizDefinitions.registerMany([]);
})();