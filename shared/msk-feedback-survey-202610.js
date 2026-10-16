(()=>{
'use strict';
const STORAGE='megahub-msk-survey-20261016-v1',END=Date.parse('2026-10-21T00:00:00-04:00');
if(Date.now()>=END)return;
try{if(localStorage.getItem(STORAGE))return}catch(e){}
const choices=[
['lecture_companions','Lecture Companions'],
['factoids','Factoid Sheets'],
['anki','Anki decks'],
['practice_quizzes','Practice quizzes'],
['gross_anatomy','Gross Anatomy Hub'],
['drug_hub','Drug Hub'],
['pathology_hub','Pathology Hub'],
['smart_review','Smart Review / Filed for Review'],
['notebook','MSK Notebook'],
['cbl_resources','CBL resources'],
['leaderboard','Leaderboard'],
['none','I have not used any of these']
];
const css=document.createElement('style');
css.textContent=`
#mskSurveyBackdrop{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:15px;background:rgba(16,40,28,.7)}
#mskSurveyBox{background:#fbfdfb;border:1px solid #c9d9ce;border-radius:22px;width:min(570px,100%);max-height:min(92vh,780px);overflow:auto;box-shadow:0 28px 75px #10281c60;padding:24px;color:#21362b;font:14px/1.5 system-ui,sans-serif}
#mskSurveyBox h2{margin:5px 0 7px;font-size:25px}#mskSurveyBox p{font-size:12px;line-height:1.5;color:#627569;margin:0 0 16px}
#mskSurveyBox fieldset{border:0;padding:0;margin:0 0 19px}#mskSurveyBox legend{font-weight:850;font-size:13px;margin-bottom:8px}
#mskSurveyOptions{display:grid;grid-template-columns:1fr 1fr;gap:8px}#mskSurveyOptions label{display:flex;align-items:center;gap:8px;padding:9px;border-radius:9px;border:1px solid #d4e2d8;background:#fff;font-size:11px;cursor:pointer}
#mskSurveyOptions input{accent-color:#28543d}
.mskSurveyScale{display:flex;gap:6px}.mskSurveyScale label{flex:1;text-align:center;cursor:pointer;min-width:0}.mskSurveyScale input{position:absolute;opacity:0}.mskSurveyScale span{display:block;background:#fff;border:1px solid #cdded3;border-radius:11px;padding:10px;color:#28543d;font-weight:900}
.mskSurveyScale input:checked+span{background:#28543d;color:#fff}.mskSurveyScale input:focus-visible+span{outline:3px solid #b49a52}
.mskSurveyEnds{display:flex;justify-content:space-between;font-size:10px;color:#627569;margin-top:5px}
#mskSurveyActions{display:flex;gap:9px;align-items:center;justify-content:flex-end}
#mskSurveyActions button{font:800 12px system-ui;padding:11px 14px;border-radius:11px;cursor:pointer;border:1px solid #b8d0c0}
#mskSurveySkip{background:#fff;color:#28543d}#mskSurveySend{background:#28543d;color:white}
#mskSurveyError{color:#a33232;font-size:11px;min-height:16px}
@media(max-width:500px){#mskSurveyBox{padding:17px}#mskSurveyOptions{grid-template-columns:1fr 1fr}#mskSurveyOptions label{font-size:10px}}
`;document.head.appendChild(css);
const backdrop=document.createElement('div');backdrop.id='mskSurveyBackdrop';
const checkboxHtml=choices.map(([value,label])=>'<label><input type="checkbox" name="msk_features" value="'+value+'"><span>'+label+'</span></label>').join('');
function scale(name,lowest,highest){return '<div class="mskSurveyScale">'+[1,2,3,4,5].map(i=>'<label><input type="radio" name="'+name+'" value="'+i+'" required><span>'+i+'</span></label>').join('')+'</div><div class="mskSurveyEnds"><span>'+lowest+'</span><span>'+highest+'</span></div>'}
backdrop.innerHTML='<div id="mskSurveyBox" role="dialog" aria-modal="true" aria-labelledby="mskSurveyHeading"><div style="font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:900;color:#527761">Quick student feedback · ~30 seconds</div><h2 id="mskSurveyHeading">How did MegaHub help you prepare?</h2><p>Help us improve MSK-Skin! This short anonymous survey is optional and closes Tuesday, October 20. No names or quiz scores are collected.</p><form id="mskSurveyForm"><fieldset><legend>1. Which MegaHub features have you used? (Select all that apply)</legend><div id="mskSurveyOptions">'+checkboxHtml+'</div></fieldset><fieldset><legend>2. How prepared did you feel for your most recent quiz?</legend>'+scale('preparedness','Not prepared','Very prepared')+'</fieldset><fieldset><legend>3. How much do you think MegaHub helped your quiz performance?</legend>'+scale('score_impact','Not at all','A great deal')+'</fieldset><div id="mskSurveyError" role="status"></div><div id="mskSurveyActions"><button type="button" id="mskSurveySkip">No thanks</button><button id="mskSurveySend" type="submit">Submit feedback</button></div></form></div>';
const remember=()=>{try{localStorage.setItem(STORAGE,'done')}catch(e){}};
const close=()=>{remember();backdrop.remove()};
document.body.appendChild(backdrop);
backdrop.querySelector('#mskSurveySkip').addEventListener('click',close);
const fields=Array.from(backdrop.querySelectorAll('[name="msk_features"]'));
fields.forEach(el=>el.addEventListener('change',()=>{if(el.value==='none'&&el.checked)fields.filter(x=>x!==el).forEach(x=>x.checked=false);else if(el.checked)fields.find(x=>x.value==='none').checked=false}));
const form=backdrop.querySelector('#mskSurveyForm'),send=backdrop.querySelector('#mskSurveySend');
form.addEventListener('submit',async e=>{
 e.preventDefault();
 const features=fields.filter(x=>x.checked).map(x=>x.value);
 const prep=Number(form.querySelector('[name="preparedness"]:checked')?.value);
 const impact=Number(form.querySelector('[name="score_impact"]:checked')?.value);
 const status=backdrop.querySelector('#mskSurveyError');
 if(!features.length||!prep||!impact){status.textContent='Please answer all three questions, or choose No thanks.';return}
 send.disabled=true;send.textContent='Submitting…';status.textContent='';
 try{
  if(Date.now()>=END)throw Error('This survey has closed.');
  const client=window.supabase?.createClient('https://ofqfdnxpftifnvxnvppe.supabase.co','sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G');
  if(!client)throw Error('Survey connection unavailable. Please try again.');
  let token;try{token=sessionStorage.getItem(STORAGE+'-token')}catch(e){}
  if(!token){token=crypto.randomUUID();try{sessionStorage.setItem(STORAGE+'-token',token)}catch(e){}}
  const {data,error}=await client.rpc('submit_msk_feedback_survey',{p_token:token,p_features:features,p_preparedness:prep,p_score_impact:impact});
  if(error||data!==true)throw Error(error?.message||'Survey submissions have closed.');
  close();
 }catch(error){status.textContent=error.message||'Could not submit. Please try again.';send.disabled=false;send.textContent='Submit feedback'}
});
})();