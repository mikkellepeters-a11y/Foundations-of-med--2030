(()=>{
  const CBL_GROUPS=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','AA','BB','CC','DD'];
  const HOUSE_GROUPS=[...'ABCDEFGHIJKLMN'];
  const ANATOMY_TABLES=Array.from({length:30},(_,i)=>String(i+1));
  const PCL_GROUPS=Array.from({length:66},(_,i)=>String(i+1));
  const FOUNDATION_UNLOCK_AT=Date.parse('2026-10-01T18:00:00Z'); // 2:00 PM EDT
  const MSK_UNLOCK_AT=Date.parse('2026-12-11T05:00:00Z'); // midnight ET after the Dec. 10 module exam

  const PROFILE_GROUPS=[
    {key:'cbl_group',inputId:'cblGroup',chipId:'profileCblGroupCard',label:'CBL Group',options:CBL_GROUPS,empty:'No CBL Group selected',display:v=>`CBL Group ${v}`},
    {key:'anatomy_table',inputId:'anatomyTable',chipId:'profileAnatomyTable',label:'Anatomy Table',options:ANATOMY_TABLES,empty:'No Anatomy Table selected',display:v=>`Table ${v}`},
    {key:'pcl_group',inputId:'pclGroup',chipId:'profilePclGroup',label:'PCL',options:PCL_GROUPS,empty:'No PCL group selected',display:v=>`PCL ${v}`},
    {key:'house',inputId:'houseGroup',chipId:'profileHouse',label:'House',options:HOUSE_GROUPS,empty:'No House selected',display:v=>`House ${v}`}
  ];

  let groupMembers={cbl_group:[],anatomy_table:[],pcl_group:[],house:[]};
  let groupMembersLoading=false;
  let groupMembersSignature=null;

  const ACHIEVEMENTS=[
    {id:'first-question',icon:'✦',title:'First Question',description:'Answer your first MegaHub question.',kind:'questions',target:1},
    {id:'warm-up',icon:'🔥',title:'Warmed Up',description:'Answer 50 questions.',kind:'questions',target:50},
    {id:'century',icon:'💯',title:'Century Club',description:'Answer 100 questions.',kind:'questions',target:100},
    {id:'deep-250',icon:'📚',title:'Deep in the Deck',description:'Answer 250 questions.',kind:'questions',target:250},
    {id:'question-machine',icon:'⚙️',title:'Question Machine',description:'Answer 500 questions.',kind:'questions',target:500},
    {id:'four-digits',icon:'🏆',title:'Four Digits',description:'Answer 1,000 questions.',kind:'questions',target:1000},
    {id:'oops-all-questions',icon:'🫠',title:'Oops! All Questions',description:'Answer 1,500 questions. At this point the question bank knows you personally.',kind:'questions',target:1500,funny:true},
    {id:'quiz-debut',icon:'▶',title:'Quiz Debut',description:'Complete your first quiz attempt.',kind:'quizzes',target:1},
    {id:'quiz-grinder',icon:'🧠',title:'Quiz Grinder',description:'Complete 10 quiz attempts.',kind:'quizzes',target:10},
    {id:'quiz-veteran',icon:'🎓',title:'Quiz Veteran',description:'Complete 25 quiz attempts.',kind:'quizzes',target:25},
    {id:'quiz-marathon',icon:'🏁',title:'Marathon Scholar',description:'Complete 50 quiz attempts.',kind:'quizzes',target:50},
    {id:'could-have-been-anki',icon:'🃏',title:"This Could've Been Anki",description:'Complete 75 quiz attempts. You have chosen violence against multiple choice.',kind:'quizzes',target:75,funny:true},
    {id:'confidence-was-answer',icon:'😎',title:'Confidence Was the Answer',description:'Miss 10 questions while marked confident. The confidence was immaculate.',kind:'confidentWrong',target:10,funny:true},
    {id:'professional-guesser',icon:'🎲',title:'Professional Guesser',description:'Rack up 25 unsure or guessing responses. Statistically, something has to work.',kind:'lowConfidence',target:25,funny:true},
    {id:'future-me-problem',icon:'📌',title:"Future Me's Problem",description:'File 25 questions for review. Future you has been notified.',kind:'review',target:25,funny:true},
    {id:'cbl-connected',icon:'🤝',title:'CBL Connected',description:'Add your CBL group to your profile.',kind:'cbl',target:1},
    {id:'profile-complete',icon:'✓',title:'Profile Complete',description:'Set your username, class year, and CBL group.',kind:'profile',target:1},
    {id:'built-the-foundation',icon:'🏛️',title:'Built the Foundation',description:'Finished the Foundations of Medicine module with the Class of 2030.',kind:'foundationTime',target:1,special:true},

    {id:'first-correct',icon:'✅',title:'Nailed It',description:'Get your first MegaHub question correct.',kind:'correctAnswers',target:1},
    {id:'correct-100',icon:'🎯',title:'Evidence-Based',description:'Get 100 MegaHub questions correct.',kind:'correctAnswers',target:100},
    {id:'correct-500',icon:'🩺',title:'Clinical Momentum',description:'Get 500 MegaHub questions correct.',kind:'correctAnswers',target:500},
    {id:'called-it',icon:'🔒',title:'Called It',description:'Get 25 questions correct while marked confident.',kind:'confidentCorrect',target:25},
    {id:'locked-in',icon:'🧠',title:'Locked In',description:'Get 100 questions correct while marked confident.',kind:'confidentCorrect',target:100},
    {id:'hot-streak',icon:'🔥',title:'Hot Streak',description:'Get 5 questions correct in a row.',kind:'correctStreak',target:5},
    {id:'on-a-roll',icon:'🎳',title:'On a Roll',description:'Get 10 questions correct in a row.',kind:'correctStreak',target:10},
    {id:'diagnostic-accuracy',icon:'📈',title:'Diagnostic Accuracy',description:'Maintain at least 80% accuracy after answering 100 questions.',kind:'accuracy80',target:1},
    {id:'quiz-goblin',icon:'👹',title:'Quiz Goblin',description:'Complete 100 quiz attempts. The answer choices fear you.',kind:'quizzes',target:100,funny:true},
    {id:'touch-grass',icon:'🌱',title:'Please Touch Grass',description:'Answer 2,000 questions. The MegaHub is gently suggesting sunlight.',kind:'questions',target:2000,funny:true},
    {id:'review-hoarder',icon:'🗂️',title:'Review Hoarder',description:'File 50 questions for review. You have receipts for everything.',kind:'review',target:50,funny:true},
    {id:'pcl-plugged-in',icon:'🗣️',title:'PCL Plugged In',description:'Add your PCL group to your profile.',kind:'pclGroup',target:1},
    {id:'house-call',icon:'🏠',title:'House Call',description:'Add your House to your profile.',kind:'houseGroup',target:1},
    {id:'fully-assigned',icon:'🧾',title:'Fully Assigned',description:'Add your CBL group, Anatomy Table, PCL group, and House to your profile.',kind:'allGroups',target:1},

    {id:'msk-bone-zone',icon:'🦴',title:'Welcome to the Bone Zone',description:'Answer your first Musculoskeletal-Skin question.',kind:'mskQuestions',target:1,module:'msk'},
    {id:'msk-skin-game',icon:'🧴',title:'Skin in the Game',description:'Answer 50 Musculoskeletal-Skin questions.',kind:'mskQuestions',target:50,module:'msk'},
    {id:'msk-joint-effort',icon:'🦿',title:'Joint Effort',description:'Answer 100 Musculoskeletal-Skin questions.',kind:'mskQuestions',target:100,module:'msk'},
    {id:'msk-muscle-memory',icon:'💪',title:'Muscle Memory',description:'Answer 250 Musculoskeletal-Skin questions.',kind:'mskQuestions',target:250,module:'msk'},
    {id:'msk-no-bones-left',icon:'🩻',title:'No Bones Left Unturned',description:'Answer 500 Musculoskeletal-Skin questions.',kind:'mskQuestions',target:500,module:'msk'},
    {id:'msk-quiz-debut',icon:'🩺',title:'MSK Debut',description:'Complete your first Musculoskeletal-Skin quiz attempt.',kind:'mskQuizzes',target:1,module:'msk'},
    {id:'msk-ortho-mode',icon:'🔨',title:'Ortho Mode Activated',description:'Complete 10 Musculoskeletal-Skin quiz attempts.',kind:'mskQuizzes',target:10,module:'msk'},
    {id:'msk-out-of-hand',icon:'🖐️',title:'This Is Getting Out of Hand',description:'Complete 25 Musculoskeletal-Skin quiz attempts. Upper extremity has entered the chat.',kind:'mskQuizzes',target:25,module:'msk',funny:true},
    {id:'msk-filed-pain',icon:'📌',title:'Filed Under: Pain',description:'File 15 Musculoskeletal-Skin questions for review.',kind:'mskReview',target:15,module:'msk',funny:true},
    {id:'msk-table-manners',icon:'🥼',title:'Table Manners',description:'Add your Gross Anatomy table to your profile.',kind:'anatomyTable',target:1,module:'msk'},
    {id:'msk-built-different',icon:'🦴',title:'Built Different',description:'Finish the Musculoskeletal-Skin module with the Class of 2030.',kind:'mskTime',target:1,module:'msk',special:true}
  ];

  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));

  function injectGroupStyles(){
    if(document.getElementById('academicGroupStyles'))return;
    const style=document.createElement('style');
    style.id='academicGroupStyles';
    style.textContent=`
      .academic-memberships{margin-top:16px;padding-top:15px;border-top:1px solid var(--line)}
      .academic-memberships-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
      .academic-memberships-title{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
      .academic-memberships-hint{font-size:9px;color:var(--muted)}
      .academic-group-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
      .academic-group-chip{position:relative;min-width:0;padding:11px 12px;border:1px solid var(--line);border-radius:13px;background:#fffaf5;outline:0;cursor:default;transition:.15s ease}
      .academic-group-chip:hover,.academic-group-chip:focus,.academic-group-chip.open{border-color:#bda58f;background:#fff;box-shadow:0 8px 22px rgba(65,43,31,.09)}
      .academic-group-label{display:block;font-size:8.5px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}
      .academic-group-value{display:block;margin-top:3px;font-size:13px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .academic-group-peer-count{display:block;margin-top:4px;font-size:9px;color:var(--brown-soft);font-weight:800}
      .academic-group-popover{display:none;position:absolute;z-index:90;left:0;top:calc(100% + 7px);width:min(280px,calc(100vw - 46px));padding:12px 13px;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:0 16px 38px rgba(55,36,27,.18);color:var(--ink)}
      .academic-group-chip:hover .academic-group-popover,.academic-group-chip:focus .academic-group-popover,.academic-group-chip.open .academic-group-popover{display:block}
      .academic-popover-title{font-size:11px;font-weight:900;margin-bottom:6px}
      .academic-popover-note{font-size:10px;line-height:1.45;color:var(--muted)}
      .academic-peer-list{display:grid;gap:5px;margin:0;padding:0;list-style:none}
      .academic-peer-list li{padding:6px 8px;border-radius:8px;background:var(--tan);font-size:10px;font-weight:800}
      @media(max-width:900px){.academic-group-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:520px){.academic-group-grid{grid-template-columns:1fr}.academic-group-popover{position:static;width:100%;margin-top:8px}}
    `;
    document.head.appendChild(style);
  }

  function makeGroupSelect(group){
    const select=document.createElement('select');
    select.id=group.inputId;
    select.innerHTML=`<option value="">${group.empty}</option>`+group.options.map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(group.display(value))}</option>`).join('');
    return select;
  }

  function ensureGroupUI(){
    injectGroupStyles();

    // Remove the legacy standalone CBL pill so CBL lives with the other groups.
    document.getElementById('profileCblGroup')?.remove();

    const profileCard=document.querySelector('#panel-profile .card');
    if(profileCard&&!document.getElementById('academicGroupMemberships')){
      const wrap=document.createElement('div');
      wrap.className='academic-memberships';
      wrap.id='academicGroupMemberships';
      wrap.innerHTML=`
        <div class="academic-memberships-head">
          <span class="academic-memberships-title">Your Groups</span>
          <span class="academic-memberships-hint">Hover or tap to see classmates</span>
        </div>
        <div class="academic-group-grid">
          ${PROFILE_GROUPS.map(group=>`<div class="academic-group-chip" id="${group.chipId}" tabindex="0" role="button" aria-label="${group.label} membership"><span class="academic-group-label">${group.label}</span><strong class="academic-group-value">Not set</strong><span class="academic-group-peer-count">Set in Profile Settings</span><div class="academic-group-popover" role="tooltip"></div></div>`).join('')}
        </div>`;
      profileCard.appendChild(wrap);
      wrap.querySelectorAll('.academic-group-chip').forEach(chip=>{
        chip.addEventListener('click',event=>{
          event.stopPropagation();
          const opening=!chip.classList.contains('open');
          document.querySelectorAll('.academic-group-chip.open').forEach(other=>other.classList.remove('open'));
          chip.classList.toggle('open',opening);
        });
      });
      document.addEventListener('click',()=>document.querySelectorAll('.academic-group-chip.open').forEach(chip=>chip.classList.remove('open')));
    }

    const grid=document.querySelector('#panel-settings .card:first-child .form-grid');
    if(grid){
      PROFILE_GROUPS.forEach(group=>{
        const existing=document.getElementById(group.inputId);
        if(existing){
          if(existing.tagName==='SELECT')return;
          const currentValue=existing.value;
          const select=makeGroupSelect(group);
          select.value=currentValue;
          existing.replaceWith(select);
          return;
        }
        const field=document.createElement('div');
        field.className='field';
        const label=document.createElement('label');
        label.htmlFor=group.inputId;
        label.textContent=group.label;
        field.append(label,makeGroupSelect(group));
        grid.appendChild(field);
      });
    }
  }

  function renderGroups(){
    ensureGroupUI();
    PROFILE_GROUPS.forEach(group=>{
      const value=String((typeof profileRow!=='undefined'&&profileRow?.[group.key])||'').trim();
      const input=document.getElementById(group.inputId);
      const chip=document.getElementById(group.chipId);
      if(input&&document.activeElement!==input)input.value=group.options.includes(value)?value:'';
      if(!chip)return;

      const peers=groupMembers[group.key]||[];
      const valueEl=chip.querySelector('.academic-group-value');
      const countEl=chip.querySelector('.academic-group-peer-count');
      const popover=chip.querySelector('.academic-group-popover');
      const displayValue=value?group.display(value):'Not set';
      valueEl.textContent=displayValue;
      chip.setAttribute('aria-label',value?`${displayValue}. Hover or tap to see classmates.`:`${group.label} not set`);

      if(!value){
        countEl.textContent='Set in Profile Settings';
        popover.innerHTML=`<div class="academic-popover-title">${group.label}</div><div class="academic-popover-note">Choose your ${group.label} in Profile Settings to see who else is in your group.</div>`;
      }else if(groupMembersLoading){
        countEl.textContent='Loading classmates…';
        popover.innerHTML=`<div class="academic-popover-title">${escapeHtml(displayValue)}</div><div class="academic-popover-note">Loading classmates…</div>`;
      }else if(!peers.length){
        countEl.textContent='No classmates listed yet';
        popover.innerHTML=`<div class="academic-popover-title">${escapeHtml(displayValue)}</div><div class="academic-popover-note">No other MegaHub users have this ${group.label} saved yet.</div>`;
      }else{
        countEl.textContent=`${peers.length} classmate${peers.length===1?'':'s'}`;
        popover.innerHTML=`<div class="academic-popover-title">${escapeHtml(displayValue)}</div><ul class="academic-peer-list">${peers.map(name=>`<li>${escapeHtml(name)}</li>`).join('')}</ul>`;
      }
    });
  }

  function membershipSignature(){
    if(typeof profileRow==='undefined'||!profileRow)return null;
    return PROFILE_GROUPS.map(group=>String(profileRow?.[group.key]||'').trim().toLowerCase()).join('|');
  }

  async function loadGroupMembers(force=false){
    if(typeof currentUser==='undefined'||!currentUser?.id||typeof profileRow==='undefined'||!profileRow)return;
    const signature=membershipSignature();
    if(!force&&signature===groupMembersSignature)return;
    groupMembersSignature=signature;
    groupMembersLoading=true;
    renderGroups();

    const {data,error}=await supabaseClient.rpc('get_my_group_members');
    groupMembersLoading=false;
    groupMembers={cbl_group:[],anatomy_table:[],pcl_group:[],house:[]};

    if(error){
      console.warn('MegaHub group member lookup failed:',error.message);
      renderGroups();
      return;
    }

    (data||[]).forEach(row=>{
      if(groupMembers[row.group_type])groupMembers[row.group_type].push(row.display_name);
    });
    Object.keys(groupMembers).forEach(key=>groupMembers[key].sort((a,b)=>String(a).localeCompare(String(b),undefined,{sensitivity:'base'})));
    renderGroups();
  }

  function ensureTeamUI(){
    ensureGroupUI();
  }

  function syncTeamUI(){
    ensureTeamUI();
    renderGroups();
    loadGroupMembers();
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
      .achievement-count b{display:block;font-size:38px;letter-spacing:-.04em;line-height:1}.achievement-count .achievement-label{display:block;margin-top:7px;font-size:9px;text-transform:uppercase;letter-spacing:.08em;font-weight:850;opacity:.8}
      .achievement-progress-track{height:9px;background:var(--tan);border:1px solid var(--line);border-radius:999px;overflow:hidden;margin-top:10px}
      .achievement-progress-fill{height:100%;background:linear-gradient(90deg,var(--brown-dark),var(--brown),var(--brown-soft));border-radius:999px}
      .achievement-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .achievement-card{position:relative;display:grid;grid-template-columns:48px minmax(0,1fr);gap:12px;align-items:center;padding:15px;border:1px solid var(--line);border-radius:17px;background:#fffaf5;overflow:hidden}
      .achievement-card.unlocked{border-color:#bda58f;background:linear-gradient(145deg,#fffaf5,#f0e2d4);box-shadow:0 8px 20px rgba(65,43,31,.07)}
      .achievement-card.locked{opacity:.58;filter:saturate(.55)}
      .achievement-card.funny.unlocked{background:linear-gradient(145deg,#fffaf5,#f4eadf)}
      .achievement-card.special{grid-column:1/-1;border-width:2px}
      .achievement-card.special.unlocked{border-color:#b18a3e;background:linear-gradient(135deg,#fff8df,#f3e1a8,#fff8df);box-shadow:0 10px 26px rgba(123,89,30,.16)}
      .achievement-card.special.unlocked .achievement-icon{background:linear-gradient(135deg,#6f4e37,#b18a3e,#e0bd68)}
      .achievement-card.msk{border-color:#ceddd3;background:#f8fcf9}
      .achievement-card.msk.unlocked{border-color:#9fbaaa;background:linear-gradient(145deg,#fbfdfb,#e3ece6);box-shadow:0 8px 20px rgba(24,59,42,.08)}
      .achievement-card.msk.unlocked .achievement-icon{background:linear-gradient(135deg,#183b2a,#28543d,#527761);color:#fff;border-color:transparent}
      .achievement-card.msk .achievement-status{color:#28543d}
      .achievement-card.msk.locked .achievement-status{color:var(--muted)}
      .achievement-card.msk.special.unlocked{border-color:#527761;background:linear-gradient(135deg,#f8fcf9,#dce9e0,#f8fcf9);box-shadow:0 10px 26px rgba(24,59,42,.16)}
      .achievement-card.msk.special.unlocked .achievement-icon{background:linear-gradient(135deg,#183b2a,#28543d,#527761)}
      .achievement-module-tag{position:absolute;right:10px;bottom:9px;padding:3px 6px;border-radius:999px;background:#e3ece6;border:1px solid #ceddd3;color:#28543d;font-size:7.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .achievement-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font-size:22px;background:var(--tan);border:1px solid var(--line)}
      .achievement-card.unlocked .achievement-icon{background:linear-gradient(135deg,var(--brown-dark),var(--brown-soft));color:#fff;border-color:transparent}
      .achievement-title{font-size:13px;font-weight:900}.achievement-description{font-size:10px;color:var(--muted);line-height:1.45;margin-top:3px}.achievement-status{font-size:9px;font-weight:850;color:var(--brown);margin-top:7px}
      .achievement-card.locked .achievement-status{color:var(--muted)}
      .achievement-lock{position:absolute;right:10px;top:9px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
      @media(max-width:720px){.achievement-summary{grid-template-columns:1fr}.achievement-grid{grid-template-columns:1fr}.achievement-card.special{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function activity(){
    const questions=(typeof questionAttempts!=='undefined'&&Array.isArray(questionAttempts))?questionAttempts:[];
    const quizzes=(typeof quizAttempts!=='undefined'&&Array.isArray(quizAttempts))?quizAttempts:[];
    const reviews=(typeof reviewItems!=='undefined'&&Array.isArray(reviewItems))?reviewItems:[];
    const profile=(typeof profileRow!=='undefined'&&profileRow)?profileRow:{};
    return {questions,quizzes,reviews,profile};
  }

  const achievementIsMSK=item=>String(item?.module_key||'').toLowerCase()==='msk'||/musculoskeletal(?:-skin)?|msk-skin/i.test(String(item?.metadata?.module||''));

  function achievementValue(kind){
    const {questions,quizzes,reviews,profile}=activity();
    if(kind==='questions')return questions.length;
    if(kind==='quizzes')return quizzes.length;
    if(kind==='correctAnswers')return questions.filter(q=>q.is_correct).length;
    if(kind==='confidentCorrect')return questions.filter(q=>String(q.confidence||'').toLowerCase()==='confident'&&q.is_correct).length;
    if(kind==='correctStreak'){
      let best=0,current=0;
      questions.forEach(q=>{if(q.is_correct){current++;best=Math.max(best,current)}else current=0});
      return best;
    }
    if(kind==='accuracy80'){
      if(questions.length<100)return 0;
      const correct=questions.filter(q=>q.is_correct).length;
      return correct/questions.length>=0.8?1:0;
    }
    if(kind==='confidentWrong')return questions.filter(q=>String(q.confidence||'').toLowerCase()==='confident'&&!q.is_correct).length;
    if(kind==='lowConfidence')return questions.filter(q=>['unsure','guessing'].includes(String(q.confidence||'').toLowerCase())).length;
    if(kind==='review')return reviews.length;
    if(kind==='cbl')return profile?.cbl_group?1:0;
    if(kind==='pclGroup')return profile?.pcl_group?1:0;
    if(kind==='houseGroup')return profile?.house?1:0;
    if(kind==='allGroups')return profile?.cbl_group&&profile?.anatomy_table&&profile?.pcl_group&&profile?.house?1:0;
    if(kind==='profile')return profile?.display_name?.trim()&&profile?.class_year&&profile?.cbl_group?1:0;
    if(kind==='foundationTime')return Date.now()>=FOUNDATION_UNLOCK_AT?1:0;
    if(kind==='mskQuestions')return questions.filter(achievementIsMSK).length;
    if(kind==='mskQuizzes')return quizzes.filter(achievementIsMSK).length;
    if(kind==='mskReview')return reviews.filter(item=>achievementIsMSK(item)&&(item?.manually_filed||(Array.isArray(item?.review_reasons)&&item.review_reasons.includes('filed')))).length;
    if(kind==='anatomyTable')return profile?.anatomy_table?1:0;
    if(kind==='mskTime')return Date.now()>=MSK_UNLOCK_AT?1:0;
    return 0;
  }

  function achievementProgressLabel(item,value){
    if(item.kind==='questions')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} questions`;
    if(item.kind==='quizzes')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} quiz attempts`;
    if(item.kind==='correctAnswers')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} correct answers`;
    if(item.kind==='confidentCorrect')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} confident + correct`;
    if(item.kind==='correctStreak')return `${Math.min(value,item.target)} / ${item.target} correct in a row`;
    if(item.kind==='accuracy80')return value?'100+ questions at ≥80% accuracy':'Reach 80% accuracy after 100 questions';
    if(item.kind==='confidentWrong')return `${Math.min(value,item.target)} / ${item.target} confidently incorrect`;
    if(item.kind==='lowConfidence')return `${Math.min(value,item.target)} / ${item.target} unsure or guessing`;
    if(item.kind==='review')return `${Math.min(value,item.target)} / ${item.target} filed for review`;
    if(item.kind==='cbl')return value?'CBL group added':'Add your CBL group';
    if(item.kind==='pclGroup')return value?'PCL group added':'Add your PCL group';
    if(item.kind==='houseGroup')return value?'House added':'Add your House';
    if(item.kind==='allGroups')return value?'All academic groups added':'Add CBL, Anatomy Table, PCL, and House';
    if(item.kind==='profile')return value?'Profile setup complete':'Complete your profile setup';
    if(item.kind==='foundationTime')return value?'Foundations of Medicine complete':'Unlocks October 1 at 2:00 PM ET';
    if(item.kind==='mskQuestions')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} MSK questions`;
    if(item.kind==='mskQuizzes')return `${Math.min(value,item.target).toLocaleString()} / ${item.target.toLocaleString()} MSK quiz attempts`;
    if(item.kind==='mskReview')return `${Math.min(value,item.target)} / ${item.target} MSK questions filed`;
    if(item.kind==='anatomyTable')return value?'Gross Anatomy table added':'Add your Anatomy Table';
    if(item.kind==='mskTime')return value?'Musculoskeletal-Skin complete':'Unlocks after the Dec. 10 module exam';
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

    grid.innerHTML=states.map(item=>{
      const classes=['achievement-card',item.unlocked?'unlocked':'locked',item.funny?'funny':'',item.special?'special':'',item.module==='msk'?'msk':''].filter(Boolean).join(' ');
      const moduleTag=item.module==='msk'?'<span class="achievement-module-tag">MSK</span>':'';
      return `<div class="${classes}"><div class="achievement-icon" aria-hidden="true">${item.icon}</div><div><div class="achievement-title">${item.title}</div><div class="achievement-description">${item.description}</div><div class="achievement-status">${item.unlocked?'Unlocked · ':''}${achievementProgressLabel(item,item.value)}</div></div>${item.unlocked?'':'<span class="achievement-lock">Locked</span>'}${moduleTag}</div>`;
    }).join('');
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
      link.href='bulletin.html';
      link.textContent='Bulletin ↗';
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
            <div class="achievement-count"><div><b><span id="achievementUnlockedCount">0</span>/<span id="achievementTotalCount">${ACHIEVEMENTS.length}</span></b><span class="achievement-label">Achievements Unlocked</span></div></div>
            <div><h3 style="margin:0">Your collection</h3><p style="margin:5px 0 0">Question milestones, quiz milestones, profile achievements, and a few intentionally ridiculous badges are calculated from activity already synced to your account.</p><div class="achievement-progress-track"><div class="achievement-progress-fill" id="achievementOverallFill" style="width:0%"></div></div><div class="small" id="achievementSummaryNote" style="margin-top:7px">Loading achievements…</div></div>
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
      const row={id:currentUser.id,display_name:name,class_year:year};
      PROFILE_GROUPS.forEach(group=>{row[group.key]=document.getElementById(group.inputId)?.value||null});

      const {data,error}=await supabaseClient.from('profiles').upsert(row,{onConflict:'id'}).select().single();
      if(error){
        msg.className='notice error';
        msg.textContent=error.message;
        return;
      }

      profileRow=data;
      groupMembersSignature=null;
      if(typeof renderProfile==='function')renderProfile();
      syncTeamUI();
      await loadGroupMembers(true);
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
  const startupTimer=setInterval(()=>{
    syncTeamUI();
    ensureAchievementUI();
    installSaveHandler();
    renderAchievements();
    tries++;
    const activityReady=typeof questionAttempts!=='undefined'&&typeof quizAttempts!=='undefined';
    if((activityReady&&typeof profileRow!=='undefined'&&profileRow)||tries>=50)clearInterval(startupTimer);
  },200);

  setInterval(renderAchievements,60000);
})();
