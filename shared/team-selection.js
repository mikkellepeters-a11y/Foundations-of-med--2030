(()=>{
  const GROUPS=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','AA','BB','CC','DD'];

  const ACHIEVEMENTS=[
    {id:'first-question',icon:'✦',title:'First Question',description:'Answer your first MegaHub question.',kind:'questions',target:1},
    {id:'warm-up',icon:'🔥',title:'Warmed Up',description:'Answer 50 questions.',kind:'questions',target:50},
    {id:'century',icon:'💯',title:'Century Club',description:'Answer 100 questions.',kind:'questions',target:100},
    {id:'deep-250',icon:'📚',title:'Deep in the Deck',description:'Answer 250 questions.',kind:'questions',target:250},
    {id:'question-machine',icon:'⚙️',title:'Question Machine',description:'Answer 500 questions.',kind:'questions',target:500},
    {id:'four-digits',icon:'🏆',title:'Four Digits',description:'Answer 1,000 questions.',kind:'questions',target:1000},
    {id:'quiz-debut',icon:'▶',title:'Quiz Debut',description:'Complete your first quiz attempt.',kind:'quizzes',target:1},
    {id:'quiz-grinder',icon:'🧠',title:'Quiz Grinder',description:'Complete 10 quiz attempts.',kind:'quizzes',target:10},
    {id:'quiz-veteran',icon:'🎓',title:'Quiz Veteran',description:'Complete 25 quiz attempts.',kind:'quizzes',target:25},
    {id:'quiz-marathon',icon:'🏁',title:'Marathon Scholar',description:'Complete 50 quiz attempts.',kind:'quizzes',target:50},
    {id:'cbl-connected',icon:'🤝',title:'CBL Connected',description:'Add your CBL group to your profile.',kind:'cbl',target:1},
    {id:'profile-complete',icon:'✓',title:'Profile Complete',description:'Set your username, class year, and CBL group.',kind:'profile',target:1}
  ];

  function ensureTeamUI(){
    const meta=document.querySelector('#panel-profile .profile-meta');
    if(meta&&!document.getElementById('profileCblGroup')){
      const pill=document.createElement('div');
      pill.className='profile-pill';
      pill.id='profileCblGroup';
      pill.textContent='CBL Group not set';
      meta.appendChild(pill);
    }

    const grid=document.querySelector('#panel-settings .card:first-child .form-grid');
    if(grid&&!document.getElementById('cblGroup')){
      const field=document.createElement('div');
      field.className='field';
      const label=document.createElement('label');
      label.htmlFor='cblGroup';
      label.textContent='CBL Group';
      const select=document.createElement('select');
      select.id='cblGroup';
      select.innerHTML='<option value="">No CBL Group selected</option>'+GROUPS.map(g=>`<option value="${g}">CBL Group ${g}</option>`).join('');
      field.append(label,select);
      grid.appendChild(field);
    }
  }

  function syncTeamUI(){
    ensureTeamUI();
    const selected=(typeof profileRow!=='undefined'&&profileRow?.cbl_group)||'';
    const select=document.getElementById('cblGroup');
    const pill=document.getElementById('profileCblGroup');
    if(select)select.value=selected;
    if(pill)pill.textContent=selected?`CBL Group ${selected}`:'CBL Group not set';
  }

  function injectAchievementStyles(){
    if(document.getElementById('achievementStyles'))return;
    const style=document.createElement('style');
    style.id='achievementStyles';
    style.textContent=`
      .profile-nav-link{display:block;width:100%;text-decoration:none;color:var(--muted);text-align:left;border-radius:12px;padding:11px 12px;font-weight:850;margin:2px 0}
      .profile-nav-link:hover{background:var(--tan);color:var(--ink)}
      .achievement-summary{display:grid;grid-template-columns:140px minmax(0,1fr);gap:18px;align-items:center}
      .achievement-count{display:grid;place-items:center;min-height:120px;border-radius:20px;background:linear-gradient(135deg,var(--brown-dark),var(--brown),var(--brown-soft));color:#fff;text-align:center;padding:16px}
      .achievement-count b{display:block;font-size:38px;letter-spacing:-.04em;line-height:1}.achievement-count span{display:block;margin-top:7px;font-size:9px;text-transform:uppercase;letter-spacing:.08em;font-weight:850;opacity:.8}
      .achievement-progress-track{height:9px;background:var(--tan);border:1px solid var(--line);border-radius:999px;overflow:hidden;margin-top:10px}
      .achievement-progress-fill{height:100%;background:linear-gradient(90deg,var(--brown-dark),var(--brown),var(--brown-soft));border-radius:999px}
      .achievement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .achievement-card{position:relative;display:grid;grid-template-columns:48px minmax(0,1fr);gap:12px;align-items:center;padding:15px;border:1px solid var(--line);border-radius:17px;background:#fffaf5;overflow:hidden}
      .achievement-card.unlocked{border-color:#bda58f;background:linear-gradient(145deg,#fffaf5,#f0e2d4);box-shadow:0 8px 20px rgba(65,43,31,.07)}
      .achievement-card.locked{opacity:.58;filter:saturate(.55)}
      .achievement-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font-size:22px;background:var(--tan);border:1px solid var(--line)}
      .achievement-card.unlocked .achievement-icon{background:linear-gradient(135deg,var(--brown-dark),var(--brown-soft));color:#fff;border-color:transparent}
      .achievement-title{font-size:13px;font-weight:900}.achievement-description{font-size:10px;color:var(--muted);line-height:1.45;margin-top:3px}.achievement-status{font-size:9px;font-weight:850;color:var(--brown);margin-top:7px}
      .achievement-card.locked .achievement-status{color:var(--muted)}
      .achievement-lock{position:absolute;right:10px;top:9px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
      @media(max-width:720px){.achievement-summary{grid-template-columns:1fr}.achievement-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function achievementValue(kind){
    const questions=(typeof questionAttempts!=='undefined'&&Array.isArray(questionAttempts))?questionAttempts.length:0;
    const quizzes=(typeof quizAttempts!=='undefined'&&Array.isArray(quizAttempts))?quizAttempts.length:0;
    const profile=(typeof profileRow!=='undefined'&&profileRow)?profileRow:{};
    if(kind==='questions')return questions;
    if(kind==='quizzes')return quizzes;
    if(kind==='cbl')return profile?.cbl_group?1:0;
    if(kind==='profile')return profile?.display_name?.trim()&&profile?.class_year&&profile?.cbl_group?1:0;
    return 0;
  }

  function achievementProgressLabel(item,value){
    if(item.kind==='questions')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} questions`;
    if(item.kind==='quizzes')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} quiz attempts`;
    if(item.kind==='cbl')return value?'CBL group added':'Add your CBL group';
    if(item.kind==='profile')return value?'Profile setup complete':'Complete your profile setup';
    return '';
  }

  function renderAchievements(){
    const grid=document.getElementById('achievementGrid');
    const count=document.getElementById('achievementUnlockedCount');
    const total=document.getElementById('achievementTotalCount');
    const fill=document.getElementById('achievementOverallFill');
    const note=document.getElementById('achievementSummaryNote');
    if(!grid||!count||!total||!fill||!note)return;

    const states=ACHIEVEMENTS.map(item=>{
      const value=achievementValue(item.kind);
      return {...item,value,unlocked:value>=item.target};
    });
    const unlocked=states.filter(item=>item.unlocked).length;
    count.textContent=unlocked;
    total.textContent=ACHIEVEMENTS.length;
    fill.style.width=`${Math.round((unlocked/ACHIEVEMENTS.length)*100)}%`;
    note.textContent=unlocked===ACHIEVEMENTS.length?'Every current achievement is unlocked.':`${ACHIEVEMENTS.length-unlocked} achievement${ACHIEVEMENTS.length-unlocked===1?'':'s'} still locked.`;

    grid.innerHTML=states.map(item=>`<div class="achievement-card ${item.unlocked?'unlocked':'locked'}"><div class="achievement-icon" aria-hidden="true">${item.icon}</div><div><div class="achievement-title">${item.title}</div><div class="achievement-description">${item.description}</div><div class="achievement-status">${item.unlocked?'Unlocked · ':''}${achievementProgressLabel(item,item.value)}</div></div>${item.unlocked?'':'<span class="achievement-lock">Locked</span>'}</div>`).join('');
  }

  function ensureAchievementUI(){
    injectAchievementStyles();
    const sidebar=document.querySelector('.sidebar');
    const section=document.querySelector('#profileShell > section');
    if(!sidebar||!section)return;

    let button=document.getElementById('achievementsTab');
    if(!button){
      button=document.createElement('button');
      button.className='tab';
      button.id='achievementsTab';
      button.type='button';
      button.dataset.tab='achievements';
      button.textContent='Achievements';
      const settings=sidebar.querySelector('[data-tab="settings"]');
      sidebar.insertBefore(button,settings||null);
    }

    if(!document.getElementById('developerUpdatesLink')){
      const link=document.createElement('a');
      link.className='profile-nav-link';
      link.id='developerUpdatesLink';
      link.href='developer-updates.html';
      link.textContent='Developer Updates ↗';
      sidebar.appendChild(link);
    }

    let panel=document.getElementById('panel-achievements');
    if(!panel){
      panel=document.createElement('div');
      panel.className='panel';
      panel.id='panel-achievements';
      panel.innerHTML=`
        <div class="card">
          <div class="section-title"><div><h2>Achievements</h2><div class="small">Badges unlock automatically from your MegaHub activity.</div></div><span class="badge">Auto-tracked</span></div>
          <div class="achievement-summary">
            <div class="achievement-count"><div><b><span id="achievementUnlockedCount">0</span>/<span id="achievementTotalCount">${ACHIEVEMENTS.length}</span></b><span>Achievements Unlocked</span></div></div>
            <div><h3 style="margin:0">Your collection</h3><p style="margin:5px 0 0">Question milestones, quiz milestones, and profile setup achievements are calculated from the activity already synced to your account.</p><div class="achievement-progress-track"><div class="achievement-progress-fill" id="achievementOverallFill" style="width:0%"></div></div><div class="small" id="achievementSummaryNote" style="margin-top:7px">Loading achievements…</div></div>
          </div>
        </div>
        <div class="achievement-grid" id="achievementGrid"></div>
      `;
      const settingsPanel=document.getElementById('panel-settings');
      section.insertBefore(panel,settingsPanel||null);
    }

    if(button.dataset.achievementInstalled!=='1'){
      button.dataset.achievementInstalled='1';
      button.addEventListener('click',()=>{
        document.querySelectorAll('.tab').forEach(tab=>tab.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(item=>item.classList.remove('active'));
        button.classList.add('active');
        panel.classList.add('active');
        renderAchievements();
      });
      sidebar.querySelectorAll('.tab').forEach(tab=>{
        if(tab===button||tab.dataset.achievementPeerListener==='1')return;
        tab.dataset.achievementPeerListener='1';
        tab.addEventListener('click',()=>{
          button.classList.remove('active');
          panel.classList.remove('active');
        });
      });
    }
    renderAchievements();
  }

  function installSaveHandler(){
    const button=document.getElementById('saveProfileBtn');
    if(!button||button.dataset.teamSaveInstalled==='true')return;
    button.dataset.teamSaveInstalled='true';
    button.addEventListener('click',async e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      const msg=document.getElementById('profileSaveMessage');
      msg.style.display='block';
      msg.className='notice';
      msg.textContent='Saving…';

      const name=document.getElementById('displayName').value.trim()||null;
      const rawYear=document.getElementById('classYear').value;
      const year=rawYear?Number(rawYear):null;
      const cblGroup=document.getElementById('cblGroup').value||null;

      const {data,error}=await supabaseClient.from('profiles').upsert({
        id:currentUser.id,
        display_name:name,
        class_year:year,
        cbl_group:cblGroup
      },{onConflict:'id'}).select().single();

      if(error){
        msg.className='notice error';
        msg.textContent=error.message;
        return;
      }

      profileRow=data;
      if(typeof renderProfile==='function')renderProfile();
      syncTeamUI();
      renderAchievements();
      msg.className='notice ok';
      msg.textContent='Profile saved.';
    },true);
  }

  ensureTeamUI();
  ensureAchievementUI();
  installSaveHandler();
  syncTeamUI();
  renderAchievements();

  let tries=0;
  const timer=setInterval(()=>{
    syncTeamUI();
    ensureAchievementUI();
    installSaveHandler();
    renderAchievements();
    tries++;
    const activityReady=typeof questionAttempts!=='undefined'&&typeof quizAttempts!=='undefined';
    if((activityReady&&typeof profileRow!=='undefined'&&profileRow)||tries>=50)clearInterval(timer);
  },200);
})();
