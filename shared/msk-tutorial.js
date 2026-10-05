(()=>{
  'use strict';
  if(window.__MSK_TUTORIAL_LOADED__) return;
  window.__MSK_TUTORIAL_LOADED__=true;

  const STYLE_ID='mskTutorialStyles';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #mskTutorialButton{display:inline-flex;align-items:center;gap:7px;margin:10px 0 0 8px;padding:9px 13px;border:1px solid #b9cfc0;border-radius:11px;background:#fbfdfb;color:#28543d;font:850 11px/1 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 6px 14px rgba(24,59,42,.08);cursor:pointer;vertical-align:top;transition:.15s ease}
      #mskTutorialButton:hover{background:#e7f0ea;border-color:#9fbaa8;transform:translateY(-1px)}
      #mskTutorialButton .tutorial-dot{width:9px;height:9px;border-radius:50%;background:#28543d;display:inline-block;flex:0 0 auto}
      .msk-tour-shade{position:fixed;background:rgba(8,20,13,.72);z-index:2147483000;pointer-events:auto;transition:all .18s ease}
      #mskTourRing{position:fixed;z-index:2147483001;border:3px solid #fff;border-radius:18px;box-shadow:0 0 0 3px rgba(40,84,61,.72),0 14px 36px rgba(0,0,0,.25);pointer-events:none;transition:all .18s ease}
      #mskTourBlocker{position:fixed;z-index:2147483002;background:transparent;pointer-events:auto;transition:all .18s ease}
      #mskTourCard{position:fixed;z-index:2147483003;width:min(350px,calc(100vw - 24px));background:#fbfdfb;color:#21362b;border:1px solid #ceddd3;border-radius:18px;box-shadow:0 20px 54px rgba(0,0,0,.26);padding:17px 18px 15px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      #mskTourCard .tour-kicker{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.11em;color:#527761;margin-bottom:5px}
      #mskTourCard h3{margin:0 0 7px;font-size:19px;line-height:1.15;letter-spacing:-.02em;color:#21362b}
      #mskTourCard p{margin:0;color:#63736a;font-size:11.5px;line-height:1.58}
      #mskTourCard .tour-progress{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;padding-top:12px;border-top:1px solid #dbe6de}
      #mskTourCard .tour-count{font-size:9px;font-weight:850;color:#718078;letter-spacing:.05em;text-transform:uppercase}
      #mskTourCard .tour-actions{display:flex;align-items:center;gap:7px}
      #mskTourCard button{border:0;border-radius:9px;padding:8px 10px;font:850 10px/1 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}
      #mskTourCard .tour-skip{background:transparent;color:#718078;padding-left:3px;padding-right:3px}
      #mskTourCard .tour-back{background:#e3ece6;color:#28543d}
      #mskTourCard .tour-next{background:#28543d;color:#fff}
      #mskTourCard button:disabled{opacity:.35;cursor:default}
      @media(max-width:650px){#mskTutorialButton{margin-left:5px;padding:8px 10px}#mskTourCard{padding:15px}#mskTourCard h3{font-size:18px}}
    `;
    document.head.appendChild(style);
  }

  const byText=(selector,re)=>[...document.querySelectorAll(selector)].find(el=>re.test((el.textContent||'').trim()))||null;
  const steps=[
    {
      target:()=>document.querySelector('.brand-row')||document.querySelector('header'),
      title:'Welcome to MSK-Skin',
      body:'This module hub is the home base for Musculoskeletal-Skin. The tutorial will point out the main places to study, review, and track participation.'
    },
    {
      target:()=>document.querySelector('[data-name="MSK-Skin Week 13"]')||document.querySelector('.week-grid'),
      title:'Weekly Study Hubs',
      body:'Open the current week here. Each active week is its own workspace for lecture content, daily quizzes, comprehensive review, and other week-specific resources.'
    },
    {
      target:()=>document.getElementById('mskLeaderboardButton'),
      title:'MSK Leaderboard',
      body:'The MSK leaderboard is separate from Foundations. It rewards questions answered, with more points for higher difficulty. Correctness does not change leaderboard points.'
    },
    {
      target:()=>document.querySelector('[data-name="Gross Anatomy Lab"]'),
      title:'Gross Anatomy',
      body:'Gross anatomy lives in its own hub so practical material stays organized by region and dissection instead of getting buried inside the weekly lecture pages.'
    },
    {
      target:()=>document.querySelector('[data-name="MSK-Skin Drug Hub"]'),
      title:'MSK Drug Hub',
      body:'Use the Drug Hub for module-specific pharmacology. It is designed as a focused medication library and review space for MSK-Skin.'
    },
    {
      target:()=>document.querySelector('[data-name="MSK-Skin Pathology Hub"]'),
      title:'MSK Pathology Hub',
      body:'The Pathology Hub collects MSK-Skin diseases and morphology-focused review in one place, separate from the drug content and weekly schedule.'
    },
    {
      target:()=>document.querySelector('[data-name="MSK-Skin CBL"]'),
      title:'Case-Based Learning',
      body:'CBL has its own module section for case quizzes and quick guides. Only the MSK weeks with an actual CBL case appear there.'
    },
    {
      target:()=>document.querySelector('[data-msk-review-module="1"]')||byText('a,button,.week-card',/review\s+the\s+module/i),
      title:'Review the Module',
      body:'This opens the MSK review center for module-wide review tools and cumulative practice when you want to study across multiple weeks instead of one week at a time.'
    },
    {
      target:()=>document.getElementById('mskFeedbackPanel'),
      title:'Send Feedback',
      body:'If you find a broken link, bad question, confusing explanation, or have a feature idea, this is the fastest place to send it.'
    },
    {
      target:()=>document.getElementById('mskModuleHubBack'),
      title:'Return to the Module Hub',
      body:'Use this small back button whenever you want to return to the main five-module MegaHub. You can replay this tutorial at any time from the Tutorial button.'
    }
  ];

  let active=false,index=0,root=null,currentTarget=null;
  let onViewportChange=null;

  function ensureLauncher(){
    if(document.getElementById('mskTutorialButton')) return;
    const leaderboard=document.getElementById('mskLeaderboardButton');
    const heading=byText('h1,h2,h3',/choose a week/i);
    if(!leaderboard&&!heading) return;
    const btn=document.createElement('button');
    btn.id='mskTutorialButton';
    btn.type='button';
    btn.setAttribute('aria-label','Start MSK tutorial');
    btn.innerHTML='<span class="tutorial-dot" aria-hidden="true"></span><span>Tutorial</span>';
    btn.addEventListener('click',start);
    if(leaderboard) leaderboard.insertAdjacentElement('afterend',btn);
    else heading.insertAdjacentElement('afterend',btn);
  }

  function buildRoot(){
    root=document.createElement('div');
    root.id='mskTutorialRoot';
    root.innerHTML=`
      <div class="msk-tour-shade" data-side="top"></div>
      <div class="msk-tour-shade" data-side="left"></div>
      <div class="msk-tour-shade" data-side="right"></div>
      <div class="msk-tour-shade" data-side="bottom"></div>
      <div id="mskTourRing" aria-hidden="true"></div>
      <div id="mskTourBlocker" aria-hidden="true"></div>
      <section id="mskTourCard" role="dialog" aria-modal="true" aria-live="polite" aria-label="MSK tutorial">
        <div class="tour-kicker">MSK Tutorial</div>
        <h3></h3>
        <p></p>
        <div class="tour-progress">
          <button class="tour-skip" type="button">Skip</button>
          <span class="tour-count"></span>
          <div class="tour-actions">
            <button class="tour-back" type="button">Back</button>
            <button class="tour-next" type="button">Next</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(root);
    root.querySelector('.tour-skip').addEventListener('click',finish);
    root.querySelector('.tour-back').addEventListener('click',()=>show(index-1));
    root.querySelector('.tour-next').addEventListener('click',()=>index===steps.length-1?finish():show(index+1));
  }

  function targetRect(el){
    const r=el.getBoundingClientRect(),pad=7;
    return {
      left:Math.max(6,r.left-pad),
      top:Math.max(6,r.top-pad),
      right:Math.min(innerWidth-6,r.right+pad),
      bottom:Math.min(innerHeight-6,r.bottom+pad)
    };
  }

  function layout(){
    if(!active||!root||!currentTarget||!document.documentElement.contains(currentTarget)) return;
    const r=targetRect(currentTarget),w=Math.max(0,r.right-r.left),h=Math.max(0,r.bottom-r.top);
    const shades={
      top:[0,0,innerWidth,r.top],
      left:[0,r.top,r.left,h],
      right:[r.right,r.top,Math.max(0,innerWidth-r.right),h],
      bottom:[0,r.bottom,innerWidth,Math.max(0,innerHeight-r.bottom)]
    };
    Object.entries(shades).forEach(([side,v])=>{
      const el=root.querySelector('[data-side="'+side+'"]');
      el.style.left=v[0]+'px';el.style.top=v[1]+'px';el.style.width=v[2]+'px';el.style.height=v[3]+'px';
    });
    const ring=root.querySelector('#mskTourRing'),blocker=root.querySelector('#mskTourBlocker');
    [ring,blocker].forEach(el=>{el.style.left=r.left+'px';el.style.top=r.top+'px';el.style.width=w+'px';el.style.height=h+'px'});

    const card=root.querySelector('#mskTourCard');
    card.style.visibility='hidden';
    card.style.left='12px';card.style.top='12px';
    requestAnimationFrame(()=>{
      const cw=card.offsetWidth,ch=card.offsetHeight,gap=14;
      let left=Math.min(Math.max(12,r.left),Math.max(12,innerWidth-cw-12));
      let top=r.bottom+gap;
      if(top+ch>innerHeight-12) top=r.top-gap-ch;
      if(top<12) top=Math.max(12,innerHeight-ch-12);
      card.style.left=left+'px';card.style.top=top+'px';card.style.visibility='visible';
    });
  }

  function resolveTarget(i,direction=1){
    let pos=i;
    while(pos>=0&&pos<steps.length){
      const el=steps[pos].target();
      if(el) return {pos,el};
      pos+=direction;
    }
    return null;
  }

  function show(nextIndex){
    if(!active) return;
    const direction=nextIndex<index?-1:1;
    const resolved=resolveTarget(nextIndex,direction);
    if(!resolved){finish();return}
    index=resolved.pos;currentTarget=resolved.el;
    const step=steps[index],card=root.querySelector('#mskTourCard');
    card.querySelector('h3').textContent=step.title;
    card.querySelector('p').textContent=step.body;
    card.querySelector('.tour-count').textContent=(index+1)+' of '+steps.length;
    card.querySelector('.tour-back').disabled=index===0;
    card.querySelector('.tour-next').textContent=index===steps.length-1?'Finish':'Next';
    currentTarget.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
    setTimeout(layout,260);
  }

  function start(){
    if(active) return;
    active=true;index=0;
    buildRoot();
    document.documentElement.classList.add('msk-tutorial-active');
    onViewportChange=()=>layout();
    window.addEventListener('resize',onViewportChange);
    window.addEventListener('scroll',onViewportChange,{passive:true});
    document.addEventListener('keydown',onKey);
    show(0);
  }

  function onKey(e){
    if(!active) return;
    if(e.key==='Escape') finish();
    else if(e.key==='ArrowRight'&&index<steps.length-1) show(index+1);
    else if(e.key==='ArrowLeft'&&index>0) show(index-1);
  }

  function finish(){
    if(!active) return;
    active=false;currentTarget=null;
    document.documentElement.classList.remove('msk-tutorial-active');
    if(root){root.remove();root=null}
    if(onViewportChange){window.removeEventListener('resize',onViewportChange);window.removeEventListener('scroll',onViewportChange);onViewportChange=null}
    document.removeEventListener('keydown',onKey);
    document.getElementById('mskTutorialButton')?.focus();
  }

  const boot=()=>{ensureLauncher();setTimeout(ensureLauncher,150);setTimeout(ensureLauncher,650)};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
