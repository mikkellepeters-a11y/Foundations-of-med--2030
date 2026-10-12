(()=>{
'use strict';
if(window.__grossAnatomyImageNoticeLoaded)return;
window.__grossAnatomyImageNoticeLoaded=true;
const storageKey='grossAnatomyImageNotice:20261012';
const style=document.createElement('style');
style.textContent=`
.ga-image-policy-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid #ceddd3;background:#fbfdfb;color:#28543d;border-radius:999px;padding:8px 11px;font:850 11px/1.3 system-ui;cursor:pointer;margin:0 0 12px}
.ga-image-policy-btn:hover{background:#e3ece6}.ga-image-policy-btn:focus-visible,.ga-image-notice button:focus-visible,.ga-image-notice a:focus-visible{outline:3px solid #86aa93;outline-offset:3px}
.ga-image-notice{width:min(560px,calc(100vw - 32px));max-height:calc(100dvh - 40px);overflow:auto;padding:0;border:1px solid #cdded3;border-radius:22px;background:#fbfdfb;color:#21362b;box-shadow:0 22px 65px #102d2355;font:14px/1.65 system-ui}
.ga-image-notice::backdrop{background:rgba(13,32,23,.65);backdrop-filter:blur(3px)}
.ga-image-notice-head{background:linear-gradient(135deg,#183b2a,#28543d);color:#fff;padding:25px 28px 23px}.ga-image-notice-kicker{font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;opacity:.78}.ga-image-notice h2{font-size:25px;line-height:1.2;margin:8px 0 0;letter-spacing:-.025em;color:#fff}
.ga-image-notice-body{padding:23px 28px 27px}.ga-image-notice-body p{margin:0 0 16px}.ga-image-focus{padding:13px 15px;background:#eaf3ed;border:1px solid #ceddd3;border-radius:12px;color:#28543d}.ga-image-notice-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:22px}.ga-image-notice-actions a,.ga-image-notice-actions button{display:inline-flex;align-items:center;justify-content:center;padding:11px 15px;border-radius:10px;font:850 12px/1.3 system-ui;text-decoration:none;cursor:pointer}.ga-image-notice-actions button{background:#28543d;border:1px solid #28543d;color:#fff}.ga-image-notice-actions a{background:#fff;border:1px solid #ceddd3;color:#28543d}
@media(max-width:480px){.ga-image-notice-head{padding:22px}.ga-image-notice-body{padding:20px 22px 23px}.ga-image-notice h2{font-size:23px}.ga-image-notice-actions>*{flex:1}}
@media print{.ga-image-notice,.ga-image-policy-btn{display:none!important}}
`;
document.head.appendChild(style);
const notice=document.createElement('dialog');notice.className='ga-image-notice';notice.id='grossAnatomyImageNotice';notice.setAttribute('aria-labelledby','gaImageNoticeTitle');notice.setAttribute('aria-describedby','gaImageNoticePolicy');
notice.innerHTML=`<div class="ga-image-notice-head"><div class="ga-image-notice-kicker">Gross Anatomy · Image Policy</div><h2 id="gaImageNoticeTitle">Respect for Donors &amp; Patients</h2></div>
<div class="ga-image-notice-body"><p id="gaImageNoticePolicy"><strong>Photographs of anatomical donors or any other patients have never been used on this hub and never will be.</strong> This commitment honors our donors’ sacrifice, respects every patient’s dignity, and upholds the integrity of the MCG Honor Code.</p>
<p>If you are looking for donor or patient images to study, please use the <strong>authorized course materials in D2L</strong>.</p>
<div class="ga-image-focus">This hub primarily uses <strong>atlas illustrations and anatomy spelling practice</strong> to support your lab preparation.</div>
<div class="ga-image-notice-actions"><button type="button" id="gaImageNoticeDismiss" autofocus>I understand</button><a href="https://lms.augusta.edu/" target="_blank" rel="noopener noreferrer">Open D2L ↗</a></div></div>`;
document.body.appendChild(notice);
const reopen=document.createElement('button');reopen.type='button';reopen.className='ga-image-policy-btn';reopen.textContent='Image Policy';reopen.setAttribute('aria-haspopup','dialog');reopen.setAttribute('aria-controls',notice.id);
const main=document.querySelector('main');(main||document.body).prepend(reopen);
let previousFocus=null;
function show(){if(notice.open)return;previousFocus=document.activeElement;notice.showModal();document.getElementById('gaImageNoticeDismiss').focus()}
function dismissed(){try{sessionStorage.setItem(storageKey,'seen')}catch(e){}if(previousFocus&&previousFocus.isConnected&&typeof previousFocus.focus==='function')previousFocus.focus()}
reopen.addEventListener('click',show);
document.getElementById('gaImageNoticeDismiss').addEventListener('click',()=>notice.close());
notice.addEventListener('close',dismissed);
let seen=false;try{seen=sessionStorage.getItem(storageKey)==='seen'}catch(e){}
if(!seen)show();
})();
