(()=>{
  if(window.__MSK_NOTEBOOK_CARD__)return;
  window.__MSK_NOTEBOOK_CARD__=true;
  const addCard=()=>{
    const grid=document.querySelector('.week-grid');
    if(!grid)return;
    let card=document.getElementById('mskNotebookCard');
    if(!card){
      card=document.createElement('a');
      card.id='mskNotebookCard';
      card.className='week-card active-card';
      card.href='msk-notebook.html';
      card.setAttribute('data-name','MSK Notebook');
      card.innerHTML='<div class="card-top"><div class="icon-wrap" aria-hidden="true"><svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M5.5 4.5h11A2.5 2.5 0 0 1 19 7v12.5H8A2.5 2.5 0 0 1 5.5 17V4.5Z"></path><path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5"></path><path d="M5.5 17A2.5 2.5 0 0 1 8 14.5"></path></svg></div><span class="week-label">Personal</span></div><h3>MSK Notebook</h3><p class="active-desc">A private place for your MSK notes, weak points, reminders, mnemonics, and quick study thoughts.</p><div class="active-footer"><div class="active-tags"><span class="active-tag">Notes</span><span class="active-tag">Autosave</span><span class="active-tag">Private</span></div><div class="active-arrow">→</div></div>';
    }
    card.classList.remove('placeholder','locked-card');
    card.classList.add('week-card','active-card');
    card.href='msk-notebook.html';
    if(grid.lastElementChild!==card)grid.appendChild(card);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addCard,{once:true});
  else addCard();
  [100,300,700,1500,3000].forEach(ms=>setTimeout(addCard,ms));
})();
