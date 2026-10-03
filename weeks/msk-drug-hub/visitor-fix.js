(()=>{
  const VISITOR_CHANCE=.07;
  const TOTAL_RANDOM_POPUP_CHANCE=.40;
  const COOLDOWN_MS=45000;
  let blockedUntil=0;
  const visitorPhotos={Maisy:null,Ozzy:null};
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  async function extractPhoto(url){
    try{
      const r=await fetch(url,{cache:'no-store'});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const txt=await r.text();
      const doc=new DOMParser().parseFromString(txt,'text/html');
      const img=doc.querySelector('.hero-mascot-wrap .icon img, .icon img');
      const src=img?.getAttribute('src')||'';
      return src.startsWith('data:image/')?src:null;
    }catch(e){
      console.warn('MSK visitor mascot photo load failed:',url,e);
      return null;
    }
  }

  async function canonicalPhoto(name){
    const rawRoot='https://raw.githubusercontent.com/mikkellepeters-a11y/Foundations-of-med--2030/main/weeks/';
    const isMaisy=name==='Maisy';
    const raw=rawRoot+(isMaisy?'drug-hub/index.html':'pathology-hub/index.html');
    const local=isMaisy?'../drug-hub/index.html':'../pathology-hub/index.html';
    return (await extractPhoto(raw))||(await extractPhoto(local));
  }

  const ready=Promise.all([canonicalPhoto('Maisy'),canonicalPhoto('Ozzy')]).then(([m,o])=>{
    visitorPhotos.Maisy=m;
    visitorPhotos.Ozzy=o;
    return visitorPhotos;
  });

  function visibleDrugCards(){
    return [...document.querySelectorAll('#drugGrid .card[data-drug]')].filter(c=>c.offsetParent!==null);
  }

  const lines={
    Maisy:['Maisy dropped by from Foundations.','Rare Maisy visit: she brought a drug check.','Maisy is visiting the MSK Drug Hub.'],
    Ozzy:['Ozzy made a rare visit.','Ozzy wandered over from the Pathology Hub.','Rare Ozzy appearance in pharmacology territory.']
  };

  function showVisitor(name){
    const src=visitorPhotos[name];
    if(!src) return false;
    const card=document.getElementById('mascotCard');
    const img=document.getElementById('mascotImg');
    const label=document.getElementById('mascotLabel');
    const title=document.getElementById('mascotTitle');
    const drug=document.getElementById('mascotDrug');
    const sub=document.getElementById('mascotSub');
    const chip=document.getElementById('mascotChip');
    if(!card||!img||!label||!title||!drug||!sub||!chip) return false;

    img.src=src;
    img.alt=name+', MegaHub mascot';
    label.textContent=name;
    title.innerHTML='<b>'+name+'</b> '+pick(lines[name]).replace(name,'').trim();

    const cards=visibleDrugCards();
    if(cards.length){
      const c=pick(cards);
      drug.textContent=c.dataset.drug||c.querySelector('h3')?.textContent?.trim()||'Study pick';
      sub.textContent=c.dataset.pearl||c.querySelector('.mechanism')?.textContent?.trim()||'Open the card for a rapid review.';
      chip.textContent=[c.dataset.class,c.dataset.week].filter(Boolean).join(' · ')||'MSK Drug Hub';
    }else{
      drug.textContent='Library ready';
      sub.textContent=name+' is visiting while Trici waits for the first MSK-Skin drug entries.';
      chip.textContent='Rare visitor · 7%';
    }
    card.classList.add('show');
    return true;
  }

  async function fixedMaybeMascot(){
    if(Date.now()<blockedUntil) return;
    const card=document.getElementById('mascotCard');
    if(card?.classList.contains('show')) return;
    await ready;

    // One roll keeps the overall random-popup rate at 40%, while making
    // Maisy and Ozzy true 7% chances per eligible interaction.
    const roll=Math.random();
    if(roll<VISITOR_CHANCE){
      if(showVisitor('Maisy')) return;
    }else if(roll<VISITOR_CHANCE*2){
      if(showVisitor('Ozzy')) return;
    }else if(roll>=TOTAL_RANDOM_POPUP_CHANCE){
      return;
    }

    if(typeof window.show==='function') window.show('Trici',false);
  }

  // The original script declared maybe() globally; replacing the global
  // binding means its existing search/filter/chip listeners now use this fix.
  window.maybe=fixedMaybeMascot;

  document.getElementById('mascotClose')?.addEventListener('click',()=>{
    blockedUntil=Date.now()+COOLDOWN_MS;
  });

  // Give each page visit one normal eligible roll after visitor photos load.
  ready.then(()=>setTimeout(fixedMaybeMascot,2200));

  // Non-UI diagnostic hook for future maintenance.
  window.__mskMascotVisitors={ready,photos:visitorPhotos,force:name=>showVisitor(name)};
})();