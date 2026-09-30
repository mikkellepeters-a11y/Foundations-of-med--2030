(()=>{
  function routeFoundationsWeekBackLink(){
    try{
      if(!document.referrer) return false;
      const ref=new URL(document.referrer);
      if(ref.origin!==window.location.origin) return false;
      if(/\/weeks\/week(?:2|3|4|6|7|8|9|10)\/(?:index\.html)?$/.test(ref.pathname)){
        window.location.replace('foundations.html');
        return true;
      }
    }catch{}
    return false;
  }

  if(routeFoundationsWeekBackLink()) return;

  const PROMPT_DATE_KEY='megahub-account-setup-nudge-date';
  const PENDING_PROFILE_KEY='megahub-pending-profile-setup';
  const LEGACY_PENDING_USERNAME_KEY='megahub-pending-username';
  const SETUP_COMPLETE_KEY='megahub-account-setup-complete';
  const CBL_GROUPS=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','AA','BB','CC','DD'];

  function localDayKey(){
    const d=new Date();
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function markPromptShownToday(){
    localStorage.setItem(PROMPT_DATE_KEY,localDayKey());
  }

  function promptAlreadyShownToday(){
    return localStorage.getItem(PROMPT_DATE_KEY)===localDayKey();
  }

  function markSetupComplete(){
    localStorage.setItem(SETUP_COMPLETE_KEY,'1');
  }

  function markSetupIncomplete(){
    localStorage.removeItem(SETUP_COMPLETE_KEY);
  }

  function setupKnownComplete(){
    return localStorage.getItem(SETUP_COMPLETE_KEY)==='1';
  }

  function profileComplete(profile){
    return Boolean(profile?.display_name?.trim() && profile?.class_year && profile?.cbl_group);
  }

  function cblOptions(selected=''){
    return '<option value="">Select CBL group</option>'+CBL_GROUPS.map(group=>`<option value="${group}"${group===selected?' selected':''}>CBL Group ${group}</option>`).join('');
  }

  function injectStyles(){
    if(document.getElementById('accountNudgeStyles')) return;
    const style=document.createElement('style');
    style.id='accountNudgeStyles';
    style.textContent=`
      .setup-nudge{position:fixed;right:22px;bottom:22px;width:min(390px,calc(100vw - 28px));z-index:900;background:#fffaf4;border:1px solid #dccfc3;border-radius:18px;box-shadow:0 18px 48px rgba(55,36,27,.22);padding:18px;color:#3e3028;display:none}
      .setup-nudge.show{display:block;animation:setupNudgeIn .18s ease-out}
      @keyframes setupNudgeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      .setup-nudge-close{position:absolute;right:12px;top:10px;width:30px;height:30px;border-radius:50%;border:1px solid #dccfc3;background:#fff;color:#78695f;cursor:pointer;font-size:17px;line-height:1}
      .setup-nudge-kicker{font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#8a654f;margin-bottom:5px}
      .setup-nudge h3{margin:0 34px 6px 0;font-size:20px;letter-spacing:-.02em}
      .setup-nudge p{margin:0;color:#78695f;font-size:12px;line-height:1.5}
      .setup-nudge-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      .setup-nudge button{font:inherit}
      .setup-nudge-primary,.setup-nudge-secondary,.setup-nudge-tertiary{border-radius:10px;padding:9px 11px;font-size:11px;font-weight:850;cursor:pointer}
      .setup-nudge-primary{border:1px solid #694a39;background:#694a39;color:#fff}
      .setup-nudge-secondary{border:1px solid #dccfc3;background:#eee5dc;color:#3e3028}
      .setup-nudge-tertiary{border:0;background:transparent;color:#78695f;padding-left:4px;padding-right:4px}
      .setup-nudge-field{display:grid;gap:6px;margin-top:13px}
      .setup-nudge-field label{font-size:11px;font-weight:850}
      .setup-nudge-field input,.setup-nudge-field select{width:100%;border:1px solid #dccfc3;background:#fff;border-radius:10px;padding:10px 11px;font:inherit;color:#3e3028}
      .setup-nudge-message{min-height:16px;margin-top:8px;font-size:10px;color:#78695f}
      .setup-nudge-message.error{color:#8b2433}
      .setup-nudge-message.success{color:#28543d}
      .signup-profile-note{font-size:10px;color:#78695f;margin-top:-3px}
      @media(max-width:520px){.setup-nudge{right:14px;bottom:14px;max-height:calc(100vh - 28px);overflow:auto}}
    `;
    document.head.appendChild(style);
  }

  function injectNudge(){
    if(document.getElementById('setupNudge')) return;
    document.body.insertAdjacentHTML('beforeend',`
      <aside class="setup-nudge" id="setupNudge" aria-live="polite" aria-label="MegaHub account setup">
        <button class="setup-nudge-close" id="setupNudgeClose" type="button" aria-label="Dismiss for today">×</button>
        <div class="setup-nudge-kicker">MegaHub Account</div>
        <h3 id="setupNudgeTitle">Make MegaHub yours</h3>
        <p id="setupNudgeText"></p>
        <div id="setupGuestActions" class="setup-nudge-actions" style="display:none">
          <button class="setup-nudge-primary" id="setupCreateAccount" type="button">Create account</button>
          <button class="setup-nudge-secondary" id="setupLogIn" type="button">Log in</button>
          <button class="setup-nudge-tertiary" id="setupNotToday" type="button">Not today</button>
        </div>
        <div id="setupProfilePanel" style="display:none">
          <div class="setup-nudge-field">
            <label for="setupUsernameInput">Username</label>
            <input id="setupUsernameInput" type="text" maxlength="30" autocomplete="nickname" placeholder="Choose a username" />
          </div>
          <div class="setup-nudge-field">
            <label for="setupClassYearInput">Class year</label>
            <input id="setupClassYearInput" type="number" min="2020" max="2100" inputmode="numeric" placeholder="2030" />
          </div>
          <div class="setup-nudge-field">
            <label for="setupCblGroupInput">CBL group</label>
            <select id="setupCblGroupInput">${cblOptions()}</select>
          </div>
          <div class="setup-nudge-actions">
            <button class="setup-nudge-primary" id="setupSaveProfile" type="button">Save profile</button>
            <button class="setup-nudge-tertiary" id="setupProfileNotToday" type="button">Not today</button>
          </div>
          <div class="setup-nudge-message" id="setupNudgeMessage"></div>
        </div>
      </aside>
    `);
  }

  function injectSignupProfileFields(){
    if(document.getElementById('signupUsernameField')) return;
    const form=typeof authForm!=='undefined'?authForm:document.getElementById('authForm');
    const submit=document.getElementById('authSubmit');
    if(!form||!submit) return;

    const usernameField=document.createElement('div');
    usernameField.className='auth-field';
    usernameField.id='signupUsernameField';
    usernameField.style.display='none';
    usernameField.innerHTML=`<label for="signupUsername">Username</label><input id="signupUsername" type="text" maxlength="30" autocomplete="nickname" placeholder="Choose a username" /><div class="signup-profile-note">This is the name shown on your MegaHub profile.</div>`;

    const classYearField=document.createElement('div');
    classYearField.className='auth-field';
    classYearField.id='signupClassYearField';
    classYearField.style.display='none';
    classYearField.innerHTML=`<label for="signupClassYear">Class year</label><input id="signupClassYear" type="number" min="2020" max="2100" inputmode="numeric" placeholder="2030" /><div class="signup-profile-note">Used to identify your class on MegaHub.</div>`;

    const cblField=document.createElement('div');
    cblField.className='auth-field';
    cblField.id='signupCblGroupField';
    cblField.style.display='none';
    cblField.innerHTML=`<label for="signupCblGroup">CBL group</label><select id="signupCblGroup">${cblOptions()}</select><div class="signup-profile-note">Used for your CBL team and team leaderboard.</div>`;

    form.insertBefore(usernameField,submit);
    form.insertBefore(classYearField,submit);
    form.insertBefore(cblField,submit);
  }

  function syncSignupProfileFields(){
    const isSignup=typeof authMode!=='undefined'&&authMode==='signup';
    [
      ['signupUsernameField','signupUsername'],
      ['signupClassYearField','signupClassYear'],
      ['signupCblGroupField','signupCblGroup']
    ].forEach(([fieldId,inputId])=>{
      const field=document.getElementById(fieldId);
      const input=document.getElementById(inputId);
      if(!field||!input) return;
      field.style.display=isSignup?'grid':'none';
      input.required=isSignup;
    });
  }

  function validateProfileValues(username,rawYear,cblGroup){
    if(username.length<2) return {ok:false,message:'Choose a username with at least 2 characters.',field:'username'};
    const classYear=Number(rawYear);
    if(!Number.isInteger(classYear)||classYear<2020||classYear>2100) return {ok:false,message:'Enter a valid class year.',field:'classYear'};
    if(!CBL_GROUPS.includes(cblGroup)) return {ok:false,message:'Select your CBL group.',field:'cblGroup'};
    return {ok:true,classYear};
  }

  function setupSignupCapture(){
    const form=document.getElementById('authForm');
    if(!form||form.dataset.profileCapture==='1') return;
    form.dataset.profileCapture='1';
    form.addEventListener('submit',e=>{
      if(typeof authMode==='undefined'||authMode!=='signup') return;
      const username=(document.getElementById('signupUsername')?.value||'').trim();
      const rawYear=(document.getElementById('signupClassYear')?.value||'').trim();
      const cblGroup=(document.getElementById('signupCblGroup')?.value||'').trim();
      const check=validateProfileValues(username,rawYear,cblGroup);
      if(!check.ok){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(typeof authMessage!=='undefined'){
          authMessage.textContent=check.message;
          authMessage.className='auth-message error';
        }
        const targetId=check.field==='username'?'signupUsername':check.field==='classYear'?'signupClassYear':'signupCblGroup';
        document.getElementById(targetId)?.focus();
        return;
      }
      const email=(document.getElementById('authEmail')?.value||'').trim().toLowerCase();
      localStorage.setItem(PENDING_PROFILE_KEY,JSON.stringify({email,username,classYear:check.classYear,cblGroup,savedAt:Date.now()}));
      localStorage.removeItem(LEGACY_PENDING_USERNAME_KEY);
    },true);
  }

  async function fetchProfile(user){
    if(!user) return null;
    const {data,error}=await supabaseClient.from('profiles').select('id,display_name,class_year,cbl_group').eq('id',user.id).maybeSingle();
    if(error){console.warn('MegaHub profile check failed:',error.message);return null;}
    return data;
  }

  function readPendingProfile(){
    try{
      const current=JSON.parse(localStorage.getItem(PENDING_PROFILE_KEY)||'null');
      if(current) return current;
      const legacy=JSON.parse(localStorage.getItem(LEGACY_PENDING_USERNAME_KEY)||'null');
      return legacy?.username?legacy:null;
    }catch{return null;}
  }

  function clearPendingProfile(){
    localStorage.removeItem(PENDING_PROFILE_KEY);
    localStorage.removeItem(LEGACY_PENDING_USERNAME_KEY);
  }

  async function applyPendingProfile(user,profile){
    const pending=readPendingProfile();
    if(!user||!pending) return profile;
    const email=(user.email||'').toLowerCase();
    if(pending.email&&pending.email!==email) return profile;

    const row={id:user.id};
    if(!profile?.display_name?.trim()&&pending.username?.trim()) row.display_name=pending.username.trim();
    if(!profile?.class_year&&pending.classYear) row.class_year=Number(pending.classYear);
    if(!profile?.cbl_group&&CBL_GROUPS.includes(pending.cblGroup)) row.cbl_group=pending.cblGroup;

    if(Object.keys(row).length===1){
      if(profileComplete(profile)){
        clearPendingProfile();
        markSetupComplete();
      }
      return profile;
    }

    const {data,error}=await supabaseClient.from('profiles').upsert(row,{onConflict:'id'}).select('id,display_name,class_year,cbl_group').single();
    if(error){console.warn('MegaHub pending profile save failed:',error.message);return profile;}
    if(profileComplete(data)){
      clearPendingProfile();
      markSetupComplete();
    }
    return data;
  }

  function hideNudge(){document.getElementById('setupNudge')?.classList.remove('show');}

  function showGuestNudge(){
    const root=document.getElementById('setupNudge');
    document.getElementById('setupNudgeTitle').textContent='Make MegaHub yours';
    document.getElementById('setupNudgeText').textContent='Create an account and set your username, class year, and CBL group to sync progress and join your CBL team.';
    document.getElementById('setupGuestActions').style.display='flex';
    document.getElementById('setupProfilePanel').style.display='none';
    markPromptShownToday();
    root.classList.add('show');
  }

  function showProfileNudge(profile){
    const root=document.getElementById('setupNudge');
    document.getElementById('setupNudgeTitle').textContent='Finish your profile';
    document.getElementById('setupNudgeText').textContent='Add your username, class year, and CBL group so your account and CBL leaderboard are fully set up.';
    document.getElementById('setupGuestActions').style.display='none';
    document.getElementById('setupProfilePanel').style.display='block';
    document.getElementById('setupUsernameInput').value=profile?.display_name||'';
    document.getElementById('setupClassYearInput').value=profile?.class_year||'';
    document.getElementById('setupCblGroupInput').value=profile?.cbl_group||'';
    document.getElementById('setupNudgeMessage').textContent='';
    document.getElementById('setupNudgeMessage').className='setup-nudge-message';
    markPromptShownToday();
    root.classList.add('show');
  }

  async function evaluateSetupNudge(user){
    if(promptAlreadyShownToday()) return;
    if(!user){
      if(setupKnownComplete()) return;
      showGuestNudge();
      return;
    }
    let profile=await fetchProfile(user);
    profile=await applyPendingProfile(user,profile);
    if(profileComplete(profile)){
      markSetupComplete();
      return;
    }
    markSetupIncomplete();
    showProfileNudge(profile);
  }

  async function saveProfileForCurrentUser(){
    const msg=document.getElementById('setupNudgeMessage');
    const username=(document.getElementById('setupUsernameInput')?.value||'').trim();
    const rawYear=(document.getElementById('setupClassYearInput')?.value||'').trim();
    const cblGroup=(document.getElementById('setupCblGroupInput')?.value||'').trim();
    const check=validateProfileValues(username,rawYear,cblGroup);
    if(!check.ok){
      msg.textContent=check.message;
      msg.className='setup-nudge-message error';
      const targetId=check.field==='username'?'setupUsernameInput':check.field==='classYear'?'setupClassYearInput':'setupCblGroupInput';
      document.getElementById(targetId)?.focus();
      return;
    }

    msg.textContent='Saving…';
    msg.className='setup-nudge-message';
    const {data:{session}}=await supabaseClient.auth.getSession();
    const user=session?.user;
    if(!user){
      msg.textContent='Your session ended. Log in again to save your profile.';
      msg.className='setup-nudge-message error';
      return;
    }

    const {error}=await supabaseClient.from('profiles').upsert({
      id:user.id,
      display_name:username,
      class_year:check.classYear,
      cbl_group:cblGroup
    },{onConflict:'id'});
    if(error){
      msg.textContent=error.message;
      msg.className='setup-nudge-message error';
      return;
    }

    clearPendingProfile();
    markSetupComplete();
    msg.textContent='Profile saved.';
    msg.className='setup-nudge-message success';
    setTimeout(hideNudge,650);
  }

  function wireControls(){
    document.getElementById('setupNudgeClose')?.addEventListener('click',hideNudge);
    document.getElementById('setupNotToday')?.addEventListener('click',hideNudge);
    document.getElementById('setupProfileNotToday')?.addEventListener('click',hideNudge);
    document.getElementById('setupSaveProfile')?.addEventListener('click',saveProfileForCurrentUser);
    document.getElementById('setupUsernameInput')?.addEventListener('keydown',e=>{if(e.key==='Enter') saveProfileForCurrentUser();});
    document.getElementById('setupClassYearInput')?.addEventListener('keydown',e=>{if(e.key==='Enter') saveProfileForCurrentUser();});

    document.getElementById('setupCreateAccount')?.addEventListener('click',()=>{
      hideNudge();
      if(typeof setAuthMode==='function') setAuthMode('signup');
      syncSignupProfileFields();
      if(typeof openAuth==='function') openAuth();
      setTimeout(()=>document.getElementById('signupUsername')?.focus(),50);
    });
    document.getElementById('setupLogIn')?.addEventListener('click',()=>{
      hideNudge();
      if(typeof setAuthMode==='function') setAuthMode('login');
      syncSignupProfileFields();
      if(typeof openAuth==='function') openAuth();
    });

    document.getElementById('loginTab')?.addEventListener('click',()=>setTimeout(syncSignupProfileFields,0));
    document.getElementById('signupTab')?.addEventListener('click',()=>setTimeout(syncSignupProfileFields,0));
  }

  async function init(){
    if(typeof supabaseClient==='undefined') return;
    injectStyles();
    injectNudge();
    injectSignupProfileFields();
    syncSignupProfileFields();
    setupSignupCapture();
    wireControls();

    const {data:{session}}=await supabaseClient.auth.getSession();
    await evaluateSetupNudge(session?.user??null);

    supabaseClient.auth.onAuthStateChange((_event,nextSession)=>{
      const user=nextSession?.user??null;
      if(!user) return;
      setTimeout(async()=>{
        let profile=await fetchProfile(user);
        profile=await applyPendingProfile(user,profile);
        if(profileComplete(profile)){
          markSetupComplete();
          hideNudge();
        }else{
          markSetupIncomplete();
        }
      },0);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
