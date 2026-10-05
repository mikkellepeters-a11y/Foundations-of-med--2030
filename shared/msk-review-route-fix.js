(()=>{
  'use strict';
  if(window.__MSK_REVIEW_ROUTE_FIX__)return;
  window.__MSK_REVIEW_ROUTE_FIX__=true;

  const DESTINATION='review/msk-review-center.html';
  const reviewText=/^review\s+the\s+module$/i;
  const reviewName=/review.*module|module.*review/i;

  function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}

  function cardForHeading(heading){
    return heading?.closest?.('a,button,[role="button"],[data-name],.week-card,.active-card,.locked-card,.placeholder')||heading||null;
  }

  function isReviewElement(el){
    if(!el)return false;
    if(el.getAttribute?.('data-msk-review-module')==='1')return true;
    const name=clean(el.getAttribute?.('data-name'));
    if(name&&reviewName.test(name))return true;
    const heading=el.matches?.('h1,h2,h3,h4')?el:el.querySelector?.('h1,h2,h3,h4');
    if(heading&&reviewText.test(clean(heading.textContent)))return true;
    if((el.matches?.('a,button,[role="button"]'))&&reviewText.test(clean(el.textContent)))return true;
    return false;
  }

  function findReviewTargets(){
    const out=new Set();
    document.querySelectorAll('[data-name]').forEach(el=>{
      const name=clean(el.getAttribute('data-name'));
      if(reviewName.test(name))out.add(el);
    });
    document.querySelectorAll('h1,h2,h3,h4').forEach(h=>{
      if(reviewText.test(clean(h.textContent)))out.add(cardForHeading(h));
    });
    document.querySelectorAll('a,button,[role="button"]').forEach(el=>{
      if(reviewText.test(clean(el.textContent)))out.add(el);
    });
    return [...out].filter(Boolean);
  }

  function wire(el){
    if(!el)return;
    el.setAttribute?.('data-msk-review-module','1');
    el.classList?.remove('placeholder','locked-card');
    if(el.classList?.contains('week-card'))el.classList.add('active-card');
    if(el.tagName==='A'||el.hasAttribute?.('href'))el.setAttribute('href',DESTINATION);
    el.removeAttribute?.('onclick');
    try{el.onclick=null}catch(e){}
    const badge=el.querySelector?.('.locked-badge');
    if(badge)badge.remove();
    el.style?.removeProperty('pointer-events');
    el.removeAttribute?.('aria-disabled');
  }

  function wireAll(){findReviewTargets().forEach(wire)}

  function clickedReviewTarget(start){
    const direct=start?.closest?.('[data-msk-review-module="1"]');
    if(direct)return direct;
    const heading=start?.closest?.('h1,h2,h3,h4');
    if(heading&&reviewText.test(clean(heading.textContent))){
      const card=cardForHeading(heading);if(card)return card;
    }
    const candidate=start?.closest?.('a,button,[role="button"],[data-name],.week-card,.active-card,.locked-card,.placeholder');
    return isReviewElement(candidate)?candidate:null;
  }

  document.addEventListener('click',event=>{
    const target=clickedReviewTarget(event.target);
    if(!target)return;
    wire(target);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    location.assign(new URL(DESTINATION,document.baseURI).href);
  },true);

  function boot(){
    wireAll();
    [50,200,600,1200,2500].forEach(ms=>setTimeout(wireAll,ms));
    const observer=new MutationObserver(()=>wireAll());
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),10000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
