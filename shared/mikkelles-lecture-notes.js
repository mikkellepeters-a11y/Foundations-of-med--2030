(()=>{'use strict';
const URL='https://ofqfdnxpftifnvxnvppe.supabase.co',KEY='sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
const week=(document.title.match(/Week\\s+(\\d+)/i)||location.pathname.match(/week(\\d+)/i)||[])[1];
if(!week)return;
const cards=[...document.querySelectorAll('.lecture')].filter(x=>x.querySelector('.lnum')&&x.querySelector('strong')&&!/not added yet/i.test(x.querySelector('strong').textContent));
if(!cards.length)return;
const css=document.createElement('style');css.textContent=`
.mikkelle-note{margin:12px 0 0;padding:11px 13px;border:1px solid #bfd5c5;border-left:4px solid #28543d;border-radius:10px;background:#f1f8f2;color:#21362b;grid-column:1/-1;flex-basis:100%;min-width:0}
.mikkelle-note-header{font-size:12px;font-weight:850;display:flex;gap:6px;align-items:center;margin-bottom:5px}
.mikkelle-note-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.55}
.mikkelle-note-edit{margin-top:8px;background:transparent;border:1px solid #8aaf99;color:#28543d;border-radius:7px;font-size:11px;padding:4px 8px;cursor:pointer}
.mikkelle-note-add{display:block;margin-top:9px;background:#e5f0e9;border:1px dashed #90b49e;border-radius:8px;color:#28543d;font-size:11px;font-weight:750;padding:7px 10px;cursor:pointer;grid-column:1/-1;flex-basis:100%}
.mikkelle-note-dialog{border:1px solid #bfd5c5;border-radius:17px;padding:22px;max-width:min(520px,92vw);width:100%;background:#fbfdfb;color:#21362b;box-shadow:0 20px 55px #0004}
.mikkelle-note-dialog::backdrop{background:#12291b99}
.mikkelle-note-dialog textarea{width:100%;min-height:130px;resize:vertical;font:inherit;font-size:14px;line-height:1.5;padding:11px;border:1px solid #bccfc2;border-radius:9px;margin:12px 0}
.mikkelle-note-dialog menu{display:flex;gap:8px;justify-content:flex-end;padding:0;margin:8px 0 0;flex-wrap:wrap}
.mikkelle-note-dialog button{border:1px solid #b7cbbb;background:white;color:#28543d;border-radius:8px;padding:9px 12px;cursor:pointer}
.mikkelle-note-dialog button.primary{background:#28543d;color:white;border-color:#28543d}
`;document.head.append(css);
const client=()=>window.supabase?.createClient(URL,KEY);
let supa,admin=false,notes=new Map();
const ids=cards.map((card,i)=>{const number=(card.querySelector('.lnum')?.textContent||'').trim();const key=/^\\d+$/.test(number)?'lecture-'+Number(number):'lecture-'+(i+1);card.dataset.mikkelleLectureKey=key;return key;});
const place=(card,element)=>{const actions=card.querySelector('.lecture-actions');(actions||card).insertAdjacentElement('afterend',element);};
const render=()=>cards.forEach(card=>{
card.querySelectorAll('.mikkelle-note,.mikkelle-note-add').forEach(x=>x.remove());
const key=card.dataset.mikkelleLectureKey,n=notes.get(key);
if(n?.is_visible){const box=document.createElement('div');box.className='mikkelle-note';const head=document.createElement('div');head.className='mikkelle-note-header';head.textContent='✎ Mikkelle’s Note';const body=document.createElement('div');body.className='mikkelle-note-body';body.textContent=n.note_text;box.append(head,body);if(admin){const edit=document.createElement('button');edit.type='button';edit.className='mikkelle-note-edit';edit.textContent='Edit note';edit.onclick=()=>editNote(key,n);box.append(edit);}place(card,box);}
else if(admin){const b=document.createElement('button');b.type='button';b.className='mikkelle-note-add';b.textContent='+ Add Mikkelle’s Note';b.onclick=()=>editNote(key,n);place(card,b);}
});
const dialog=document.createElement('dialog');dialog.className='mikkelle-note-dialog';dialog.innerHTML='<form method="dialog"><strong>Mikkelle’s Note</strong><p style="font-size:12px">Shown directly on the selected lecture card.</p><textarea maxlength="2000" aria-label="Note text" placeholder="Add a short, helpful note for this lecture"></textarea><div role="status" class="status" style="font-size:12px"></div><menu><button type="button" class="remove">Delete</button><button type="button" class="cancel">Cancel</button><button type="button" class="primary save">Save note</button></menu></form>';document.body.append(dialog);
const textarea=dialog.querySelector('textarea'),status=dialog.querySelector('.status'),remove=dialog.querySelector('.remove'),save=dialog.querySelector('.save');
dialog.querySelector('.cancel').onclick=()=>dialog.close();
let current='';
function editNote(key,n){if(!admin)return;current=key;textarea.value=n?.note_text||'';status.textContent='';remove.hidden=!n;dialog.showModal();textarea.focus();}
async function reload(){const {data,error}=await supa.from('mikkelles_lecture_notes').select('lecture_key,note_text,is_visible').eq('module_key','msk-week-'+week).in('lecture_key',ids);if(error)throw error;notes=new Map((data||[]).map(n=>[n.lecture_key,n]));render();}
save.onclick=async()=>{const text=textarea.value.trim();if(!text){status.textContent='Enter a note first.';return;}save.disabled=true;status.textContent='Saving…';const {data:{user}}=await supa.auth.getUser();if(!user){status.textContent='Please sign in again.';save.disabled=false;return;}const {error}=await supa.from('mikkelles_lecture_notes').upsert({module_key:'msk-week-'+week,lecture_key:current,note_text:text,is_visible:true,created_by:user.id},{onConflict:'module_key,lecture_key'});save.disabled=false;if(error){status.textContent=error.message;return;}dialog.close();await reload();};
remove.onclick=async()=>{if(!confirm('Delete this note?'))return;remove.disabled=true;const {error}=await supa.from('mikkelles_lecture_notes').delete().eq('module_key','msk-week-'+week).eq('lecture_key',current);remove.disabled=false;if(error){status.textContent=error.message;return;}dialog.close();await reload();};
async function init(){if(!window.supabase){setTimeout(init,200);return;}supa=client();const {data:{user}}=await supa.auth.getUser();if(user){const {data}=await supa.from('megahub_note_admins').select('user_id').eq('user_id',user.id).maybeSingle();admin=!!data;}try{await reload();}catch(e){console.warn('Mikkelle note load failed',e);}supa.auth.onAuthStateChange(()=>setTimeout(async()=>{const {data:{user}}=await supa.auth.getUser();admin=false;if(user){const {data}=await supa.from('megahub_note_admins').select('user_id').eq('user_id',user.id).maybeSingle();admin=!!data;}await reload();},0));}
init();
})();