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
  const PENDING_USERNAME_KEY='megahub-pending-username';
  const SETUP_COMPLETE_KEY='megahub-account-setup-complete';

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

  function setupKnownComplete(){
    return localStorage.getItem(SETUP_COMPLETE_KEY)==='1';
  }

  function injectStyles(){
    if(document.getElementById('accountNudgeStyles')) return;
    const style=document.createElement('style');
    style.id='accountNudgeStyles';
    style.textContent=`
      .setup-nudge{position:fixed;right:22px;bottom:22px;width:min(370px,calc(100vw - 28px));z-index:900;background:#fffaf4;border:1px solid #dccfc3;border-radius:18px;box-shadow:0 18px 48px rgba(55,36,27,.22);padding:18px;color:#3e3028;display:none}
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
      .setup-nudge-field input{width:100%;border:1px solid #dccfc3;background:#fff;border-radius:10px;padding:10px 11px;font:inherit;color:#3e3028}
      .setup-nudge-message{min-height:16px;margin-top:8px;font-size:10px;color:#78695f}
      .setup-nudge-message.error{color:#8b2433}
      .setup-nudge-message.success{color:#28543d}
      .signup-username-note{font-size:10px;color:#78695f;margin-top:-3px}
      @media(max-width:520px){.setup-nudge{right:14px;bottom:14px}}
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
        <div id="setupUsernamePanel" style="display:none">
          <div class="setup-nudge-field">
            <label for="setupUsernameInput">Username</label>
            <input id="setupUsernameInput" type="text" maxlength="30" autocomplete="nickname" placeholder="Choose a username" />
          </div>
          <div class="setup-nudge-actions">
            <button class="setup-nudge-primary" id="setupSaveUsername" type="button">Save username</button>
            <button class="setup-nudge-tertiary" id="setupUsernameNotToday" type="button">Not today</button>
          </div>
          <div class="setup-nudge-message" id="setupNudgeMessage"></div>
        </div>
      </aside>
    `);
  }

  function injectSignupUsernameField(){
    if(document.getElementById('signupUsernameField') || !window.authForm && typeof authForm==='undefined') return;
    const form=typeof authForm!=='undefined'?authForm:document.getElementById('authForm');
    const submit=document.getElementById('authSubmit');
    if(!form||!submit) return;
    const field=document.createElement('div');
    field.className='auth-field';
    field.id='signupUsernameField';
    field.style.display='none';
    field.innerHTML=`<label for="signupUsername">Username</label><input id="signupUsername" type="text" maxlength="30" autocomplete="nickname" placeholder="Choose a username" /><div class="signup-username-note">This is the name shown on your MegaHub profile.</div>`;
    form.insertBefore(field,submit);
  }

  function syncSignupUsernameField(){
    const field=document.getElementById('signupUsernameField');
    const input=document.getElementById('signupUsername');
    if(!field||!input) return;
    const isSignup=typeof authMode!=='undefined'&&authMode==='signup';
    field.style.display=isSignup?'grid':'none';
    input.required=isSignup;
  }

  function setupSignupCapture(){
    const form=document.getElementById('authForm');
    if(!form||form.dataset.usernameCapture==='1') return;
    form.dataset.usernameCapture='1';
    form.addEventListener('submit',e=>{
      if(typeof authMode==='undefined'||authMode!=='signup') return;
      const input=document.getElementById('signupUsername');
      const username=(input?.value||'').trim();
      if(username.length<2){
        e.preventDefault();
        e.stopImmediatePropagation();
        if(typeof authMessage!=='undefined'){
          authMessage.textContent='Choose a username with at least 2 characters.';
          authMessage.className='auth-message error';
        }
        input?.focus();
        return;
      }
      const email=(document.getElementById('authEmail')?.value||'').trim().toLowerCase();
      localStorage.setItem(PENDING_USERNAME_KEY,JSON.stringify({email,username,savedAt:Date.now()}));
    },true);
  }

  async function fetchProfile(user){
    if(!user) return null;
    const {data,error}=await supabaseClient.from('profiles').select('id,display_name').eq('id',user.id).maybeSingle();
    if(error){console.warn('MegaHub profile check failed:',error.message);return null;}
    return data;
  }

  function readPendingUsername(){
    try{return JSON.parse(localStorage.getItem(PENDING_USERNAME_KEY)||'null');}catch{return null;}
  }

  async function applyPendingUsername(user,profile){
    const pending=readPendingUsername();
    if(!user||!pending?.username) return profile;
    const email=(user.email||'').toLowerCase();
    if(pending.email&&pending.email!==email) return profile;
    if(profile?.display_name?.trim()){
      localStorage.removeItem(PENDING_USERNAME_KEY);
      markSetupComplete();
      return profile;
    }
    const {data,error}=await supabaseClient.from('profiles').upsert({id:user.id,display_name:pending.username.trim()},{onConflict:'id'}).select('id,display_name').single();
    if(error){console.warn('MegaHub pending username save failed:',error.message);return profile;}
    localStorage.removeItem(PENDING_USERNAME_KEY);
    markSetupComplete();
    return data;
  }

  function hideNudge(){document.getElementById('setupNudge')?.classList.remove('show');}

  function showGuestNudge(){
    const root=document.getElementById('setupNudge');
    document.getElementById('setupNudgeTitle').textContent='Make MegaHub yours';
    document.getElementById('setupNudgeText').textContent='Create an account and choose a username to sync quiz progress, review items, and preferences across devices.';
    document.getElementById('setupGuestActions').style.display='flex';
    document.getElementById('setupUsernamePanel').style.display='none';
    markPromptShownToday();
    root.classList.add('show');
  }

  function showUsernameNudge(){
    const root=document.getElementById('setupNudge');
    document.getElementById('setupNudgeTitle').textContent='Finish your profile';
    document.getElementById('setupNudgeText').textContent='Your account is ready. Add a username to finish setup.';
    document.getElementById('setupGuestActions').style.display='none';
    document.getElementById('setupUsernamePanel').style.display='block';
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
    profile=await applyPendingUsername(user,profile);
    if(profile?.display_name?.trim()){
      markSetupComplete();
      return;
    }
    showUsernameNudge();
  }

  async function saveUsernameForCurrentUser(){
    const msg=document.getElementById('setupNudgeMessage');
    const input=document.getElementById('setupUsernameInput');
    const username=(input?.value||'').trim();
    if(username.length<2){
      msg.textContent='Choose a username with at least 2 characters.';
      msg.className='setup-nudge-message error';
      input?.focus();
      return;
    }
    msg.textContent='Saving…';
    msg.className='setup-nudge-message';
    const {data:{session}}=await supabaseClient.auth.getSession();
    const user=session?.user;
    if(!user){
      msg.textContent='Your session ended. Log in again to save your username.';
      msg.className='setup-nudge-message error';
      return;
    }
    const {error}=await supabaseClient.from('profiles').upsert({id:user.id,display_name:username},{onConflict:'id'});
    if(error){
      msg.textContent=error.message;
      msg.className='setup-nudge-message error';
      return;
    }
    localStorage.removeItem(PENDING_USERNAME_KEY);
    markSetupComplete();
    msg.textContent='Username saved.';
    msg.className='setup-nudge-message success';
    setTimeout(hideNudge,650);
  }

  function wireControls(){
    document.getElementById('setupNudgeClose')?.addEventListener('click',hideNudge);
    document.getElementById('setupNotToday')?.addEventListener('click',hideNudge);
    document.getElementById('setupUsernameNotToday')?.addEventListener('click',hideNudge);
    document.getElementById('setupSaveUsername')?.addEventListener('click',saveUsernameForCurrentUser);
    document.getElementById('setupUsernameInput')?.addEventListener('keydown',e=>{if(e.key==='Enter') saveUsernameForCurrentUser();});

    document.getElementById('setupCreateAccount')?.addEventListener('click',()=>{
      hideNudge();
      if(typeof setAuthMode==='function') setAuthMode('signup');
      syncSignupUsernameField();
      if(typeof openAuth==='function') openAuth();
      setTimeout(()=>document.getElementById('signupUsername')?.focus(),50);
    });
    document.getElementById('setupLogIn')?.addEventListener('click',()=>{
      hideNudge();
      if(typeof setAuthMode==='function') setAuthMode('login');
      syncSignupUsernameField();
      if(typeof openAuth==='function') openAuth();
    });

    document.getElementById('loginTab')?.addEventListener('click',()=>setTimeout(syncSignupUsernameField,0));
    document.getElementById('signupTab')?.addEventListener('click',()=>setTimeout(syncSignupUsernameField,0));
  }

  async function init(){
    if(typeof supabaseClient==='undefined') return;
    injectStyles();
    injectNudge();
    injectSignupUsernameField();
    syncSignupUsernameField();
    setupSignupCapture();
    wireControls();

    const {data:{session}}=await supabaseClient.auth.getSession();
    await evaluateSetupNudge(session?.user??null);

    supabaseClient.auth.onAuthStateChange((_event,nextSession)=>{
      const user=nextSession?.user??null;
      if(!user) return;
      setTimeout(async()=>{
        let profile=await fetchProfile(user);
        profile=await applyPendingUsername(user,profile);
        if(profile?.display_name?.trim()){
          markSetupComplete();
          hideNudge();
        }
      },0);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
