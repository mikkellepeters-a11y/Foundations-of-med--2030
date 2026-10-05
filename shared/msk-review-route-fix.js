(()=>{
  'use strict';
  if(window.__MSK_REVIEW_ROUTE_FIX__)return;
  window.__MSK_REVIEW_ROUTE_FIX__=true;

  const DESTINATION=new URL('review/msk-review-center.html',window.location.href).href;
  const EXACT_NAMES=new Set([
    'MSK-Skin Review the Mod',
    'MSK-Skin Review the Module',
    'Review the Mod',
    'Review the Module'
  ]);
  const REVIEW_TEXT=/^review\s+the\s+mod(?:ule)?$/i;

  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();

  function cardFrom(el){
    return el?.closest?.('a,button,[role="button"],[data-name],.week-card,.active-card,.locked-card,.placeholder')||el||null;
  }

  function isReviewCard(el){
    if(!el)return false;
    if(el.getAttribute?.('data-msk-review-module')==='1')return true;
    const name=clean(el.getAttribute?.('data-name'));
    if(EXACT_NAMES.has(name))return true;
    const heading=el.matches?.('h1,h2,h3,h4')?el:el.querySelector?.('h1,h2,h3,h4');
    if(heading&&REVIEW_TEXT.test(clean(heading.textContent)))return true;
    return REVIEW_TEXT.test(clean(el.textContent));
  }

  function findCards(){
    const found=new Set();
    document.querySelectorAll('[data-name]').forEach(el=>{
      if(EXACT_NAMES.has(clean(el.getAttribute('data-name'))))found.add(el);
    });
    document.querySelectorAll('a,button,[role="button"],h1,h2,h3,h4').forEach(el=>{
      if(REVIEW_TEXT.test(clean(el.textContent)))found.add(cardFrom(el));
    });
    return [...found].filter(Boolean);
  }

  function wire(card){
    if(!card)return;
    card.setAttribute?.('data-msk-review-module','1');
    card.setAttribute?.('aria-disabled','false');
    card.style?.setProperty('pointer-events','auto','important');
    card.removeAttribute?.('onclick');
    try{card.onclick=null}catch(e){}
    if(card.tagName==='A'||card.hasAttribute?.('href'))card.setAttribute('href',DESTINATION);
  }

  function wireAll(){findCards().forEach(wire)}

  document.addEventListener('click',event=>{
    const direct=event.target?.closest?.('[data-msk-review-module="1"]');
    const candidate=direct||cardFrom(event.target);
    if(!isReviewCard(candidate))return;
    wire(candidate);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    window.location.assign(DESTINATION);
  },true);

  function boot(){
    wireAll();
    [100,350,800,1600,3000].forEach(ms=>setTimeout(wireAll,ms));
    const observer=new MutationObserver(wireAll);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),12000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
