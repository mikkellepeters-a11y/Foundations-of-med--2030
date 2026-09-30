(()=>{
  const GROUPS=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','AA','BB','CC','DD'];

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
      msg.className='notice ok';
      msg.textContent='Profile saved.';
    },true);
  }

  ensureTeamUI();
  installSaveHandler();
  syncTeamUI();

  let tries=0;
  const timer=setInterval(()=>{
    syncTeamUI();
    installSaveHandler();
    tries++;
    if((typeof profileRow!=='undefined'&&profileRow)||tries>=30)clearInterval(timer);
  },200);
})();
