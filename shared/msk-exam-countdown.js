(()=>{
  if(window.__MSK_EXAM_COUNTDOWN__)return;
  window.__MSK_EXAM_COUNTDOWN__=true;

  const STORAGE_KEY='msk-exam-countdown-hidden-v1';
  const EXAM={year:2026,month:11,day:10}; // December 10, 2026

  const BOOSTS=[
    'You do not need to know everything today. You just need to know more than you did yesterday.',
    'Small review sessions compound. Ten focused minutes still counts.',
    'The hard concepts are allowed to feel hard before they feel familiar.',
    'Every missed question is one less surprise waiting for you on exam day.',
    'You have time to build this. Keep stacking good days.',
    'Progress is not always dramatic. Sometimes it looks like recognizing one answer faster than last week.',
    'Future-you is going to be very grateful for what you review today.',
    'One lecture. One concept. One question at a time.'
  ];

  const TEN_MINUTE_PROMPTS=[
    'Do 5 questions and spend the rest of the 10 minutes reviewing every miss.',
    'Pick one weak concept and teach it out loud without looking at your notes.',
    'Draw one anatomy relationship or pathway from memory, then correct it in a different pen.',
    'Open your Filed for Review list and clear one question you actually understand now.',
    'Choose one lecture and write the 5 facts you would be most annoyed to forget on the exam.',
    'Review one drug class: mechanism, major use, and the adverse effect most likely to be tested.',
    'Pick one pathology and explain how the presentation connects to the underlying mechanism.',
    'Do a rapid recall pass: 10 facts, no notes, then check yourself.'
  ];

  const stageMessage=days=>{
    if(days>45)return 'Plenty of runway. Build the foundation now so December feels like review, not rescue.';
    if(days>28)return 'This is the sweet spot for steady progress. Keep the daily reps boring and consistent.';
    if(days>14)return 'The exam is getting real, but there is still time to close gaps deliberately.';
    if(days>7)return 'Final two weeks. Prioritize weak areas, active recall, and questions over passive rereading.';
    if(days>2)return 'Final stretch. Tighten the high-yield details and trust the work you have already put in.';
    if(days>0)return 'Almost there. Protect your sleep, review intelligently, and do not confuse panic with productivity.';
    return 'Exam day is here. Trust your preparation, read carefully, and take it one question at a time.';
  };

  const injectStyles=()=>{
    if(document.getElementById('mskExamCountdownStyles'))return;
    const style=document.createElement('style');
    style.id='mskExamCountdownStyles';
    style.textContent=`
      #mskExamCountdownWrap{margin-top:28px;margin-bottom:8px}
      .msk-exam-card{position:relative;overflow:hidden;border:1px solid #c8d9ce;border-radius:24px;background:linear-gradient(145deg,#183b2a 0%,#28543d 54%,#527761 100%);color:#fff;padding:24px;box-shadow:0 18px 42px rgba(24,59,42,.18)}
      .msk-exam-card:before{content:"";position:absolute;width:240px;height:240px;border-radius:50%;right:-90px;top:-130px;background:rgba(255,255,255,.08)}
      .msk-exam-card:after{content:"";position:absolute;width:160px;height:160px;border-radius:50%;left:-95px;bottom:-105px;background:rgba(255,255,255,.06)}
      .msk-exam-inner{position:relative;z-index:1}
      .msk-exam-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
      .msk-exam-kicker{font-size:9.5px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;opacity:.72}
      .msk-exam-title{margin:4px 0 4px;font-size:clamp(23px,4vw,34px);line-height:1.05;letter-spacing:-.035em}
      .msk-exam-date{font-size:11px;opacity:.78;font-weight:750}
      .msk-exam-off{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;border-radius:9px;padding:7px 9px;font:inherit;font-size:9.5px;font-weight:850;cursor:pointer}
      .msk-exam-off:hover{background:rgba(255,255,255,.16)}
      .msk-count-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:20px}
      .msk-count-unit{background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:14px 10px;text-align:center;backdrop-filter:blur(2px);transition:transform .16s ease,background .16s ease}
      .msk-count-unit:hover{transform:translateY(-2px);background:rgba(255,255,255,.15)}
      .msk-count-unit b{display:block;font-size:clamp(26px,5vw,42px);line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-.04em}
      .msk-count-unit span{display:block;margin-top:6px;font-size:8.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:850;opacity:.72}
      .msk-exam-message{margin-top:16px;padding:13px 14px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);font-size:12px;line-height:1.5;font-weight:700}
      .msk-exam-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}
      .msk-exam-action{position:relative;border:1px solid rgba(255,255,255,.23);background:#fff;color:#183b2a;border-radius:10px;padding:9px 11px;font:inherit;font-size:10px;font-weight:900;cursor:pointer;box-shadow:0 6px 14px rgba(0,0,0,.08)}
      .msk-exam-action.secondary{background:rgba(255,255,255,.1);color:#fff;box-shadow:none}
      .msk-exam-action:hover{transform:translateY(-1px)}
      .msk-exam-response{min-height:18px;margin-top:11px;font-size:10.5px;line-height:1.45;color:rgba(255,255,255,.86);font-weight:700}
      .msk-spark{position:absolute;pointer-events:none;font-size:13px;color:#fff;animation:mskSpark .7s ease-out forwards}
      @keyframes mskSpark{0%{opacity:1;transform:translate(0,0) scale(.6)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.35)}}
      .msk-exam-complete .msk-count-grid{grid-template-columns:1fr}
      .msk-exam-complete .msk-count-unit{padding:20px}.msk-exam-complete .msk-count-unit b{font-size:28px}
      .msk-exam-hidden{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px dashed #b9ccbf;border-radius:13px;background:#f7faf8;padding:9px 11px;color:#63736a;font-size:9.5px}
      .msk-exam-hidden button{border:0;background:transparent;color:#28543d;font:inherit;font-weight:900;cursor:pointer;padding:3px 4px}
      @media(max-width:620px){.msk-count-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.msk-exam-card{padding:19px}.msk-exam-top{gap:10px}}
    `;
    document.head.appendChild(style);
  };

  const isHidden=()=>localStorage.getItem(STORAGE_KEY)==='1';
  const examStart=()=>new Date(EXAM.year,EXAM.month,EXAM.day,0,0,0,0);
  const examEnd=()=>new Date(EXAM.year,EXAM.month,EXAM.day+1,0,0,0,0);

  const partsUntilExam=()=>{
    const now=new Date();
    if(now>=examEnd())return {state:'complete',days:0,hours:0,minutes:0,seconds:0};
    if(now>=examStart())return {state:'exam-day',days:0,hours:0,minutes:0,seconds:0};
    let ms=examStart()-now;
    const days=Math.floor(ms/86400000);ms-=days*86400000;
    const hours=Math.floor(ms/3600000);ms-=hours*3600000;
    const minutes=Math.floor(ms/60000);ms-=minutes*60000;
    const seconds=Math.floor(ms/1000);
    return {state:'counting',days,hours,minutes,seconds};
  };

  const spark=button=>{
    if(!button)return;
    for(let i=0;i<9;i++){
      const s=document.createElement('span');
      s.className='msk-spark';
      s.textContent=i%2?'✦':'•';
      s.style.left=`${35+Math.random()*30}%`;
      s.style.top=`${25+Math.random()*45}%`;
      s.style.setProperty('--x',`${Math.round((Math.random()-.5)*110)}px`);
      s.style.setProperty('--y',`${Math.round(-25-Math.random()*65)}px`);
      button.appendChild(s);
      setTimeout(()=>s.remove(),800);
    }
  };

  const fullMarkup=()=>`<div class="msk-exam-card" id="mskExamCard">
    <div class="msk-exam-inner">
      <div class="msk-exam-top">
        <div><div class="msk-exam-kicker">Module II · Finish Line</div><h2 class="msk-exam-title">MSK Module Exam Countdown</h2><div class="msk-exam-date">Exam day · December 10, 2026</div></div>
        <button class="msk-exam-off" id="mskCountdownOff" type="button">Turn off countdown</button>
      </div>
      <div class="msk-count-grid" id="mskCountGrid" aria-label="Time until MSK exam day">
        <div class="msk-count-unit"><b id="mskDays">--</b><span>Days</span></div>
        <div class="msk-count-unit"><b id="mskHours">--</b><span>Hours</span></div>
        <div class="msk-count-unit"><b id="mskMinutes">--</b><span>Minutes</span></div>
        <div class="msk-count-unit"><b id="mskSeconds">--</b><span>Seconds</span></div>
      </div>
      <div class="msk-exam-message" id="mskExamMessage"></div>
      <div class="msk-exam-actions">
        <button class="msk-exam-action" id="mskBoostBtn" type="button">Boost me ✦</button>
        <button class="msk-exam-action secondary" id="mskTenMinuteBtn" type="button">Pick my next 10 minutes</button>
      </div>
      <div class="msk-exam-response" id="mskExamResponse" aria-live="polite"></div>
    </div>
  </div>`;

  const hiddenMarkup=()=>`<div class="msk-exam-hidden"><span>MSK exam countdown is hidden.</span><button type="button" id="mskCountdownOn">Turn back on</button></div>`;

  let timer=null;

  const updateClock=()=>{
    const state=partsUntilExam();
    const card=document.getElementById('mskExamCard');
    if(!card)return;
    const message=document.getElementById('mskExamMessage');
    const grid=document.getElementById('mskCountGrid');

    if(state.state==='complete'){
      card.classList.add('msk-exam-complete');
      grid.innerHTML='<div class="msk-count-unit"><b>Module complete ✓</b><span>You made it through MSK</span></div>';
      message.textContent='You did it. Take the win, keep what you learned, and move forward.';
      if(timer){clearInterval(timer);timer=null;}
      return;
    }

    if(state.state==='exam-day'){
      card.classList.add('msk-exam-complete');
      grid.innerHTML='<div class="msk-count-unit"><b>Exam day.</b><span>December 10, 2026</span></div>';
      message.textContent=stageMessage(0);
      if(timer){clearInterval(timer);timer=null;}
      return;
    }

    document.getElementById('mskDays').textContent=state.days;
    document.getElementById('mskHours').textContent=String(state.hours).padStart(2,'0');
    document.getElementById('mskMinutes').textContent=String(state.minutes).padStart(2,'0');
    document.getElementById('mskSeconds').textContent=String(state.seconds).padStart(2,'0');
    message.textContent=stageMessage(state.days);
  };

  const bindFull=()=>{
    document.getElementById('mskCountdownOff')?.addEventListener('click',()=>{
      localStorage.setItem(STORAGE_KEY,'1');
      render();
    });
    document.getElementById('mskBoostBtn')?.addEventListener('click',e=>{
      const response=document.getElementById('mskExamResponse');
      response.textContent=BOOSTS[Math.floor(Math.random()*BOOSTS.length)];
      spark(e.currentTarget);
    });
    document.getElementById('mskTenMinuteBtn')?.addEventListener('click',()=>{
      const response=document.getElementById('mskExamResponse');
      response.textContent='10-minute mission: '+TEN_MINUTE_PROMPTS[Math.floor(Math.random()*TEN_MINUTE_PROMPTS.length)];
    });
  };

  const render=()=>{
    const root=document.getElementById('mskExamCountdownWrap');
    if(!root)return;
    if(timer){clearInterval(timer);timer=null;}

    if(isHidden()){
      root.innerHTML=hiddenMarkup();
      document.getElementById('mskCountdownOn')?.addEventListener('click',()=>{
        localStorage.removeItem(STORAGE_KEY);
        render();
      });
      return;
    }

    root.innerHTML=fullMarkup();
    bindFull();
    updateClock();
    if(partsUntilExam().state==='counting')timer=setInterval(updateClock,1000);
  };

  const mount=()=>{
    injectStyles();
    const main=document.querySelector('main');
    if(!main)return false;
    let root=document.getElementById('mskExamCountdownWrap');
    if(!root){
      root=document.createElement('section');
      root.id='mskExamCountdownWrap';
      root.setAttribute('aria-label','MSK module exam countdown');
      main.appendChild(root);
    }else if(main.lastElementChild!==root){
      main.appendChild(root);
    }
    render();
    return true;
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  [100,400,900,1800].forEach(ms=>setTimeout(mount,ms));
})();
