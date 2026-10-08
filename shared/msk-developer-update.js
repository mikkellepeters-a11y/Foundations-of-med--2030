(()=>{
  'use strict';

  const SEEN_KEY='mskDeveloperUpdateSeen_v20261008';
  const EXPIRES_AT=Date.parse('2026-10-17T00:00:00-04:00');

  if(Date.now()>=EXPIRES_AT) return;
  try{ if(localStorage.getItem(SEEN_KEY)==='1') return; }catch(e){}
  if(window.__MSK_DEVELOPER_UPDATE_ACTIVE__) return;
  window.__MSK_DEVELOPER_UPDATE_ACTIVE__=true;

  const css=`
    #mskDevUpdateOverlay{
      position:fixed;inset:0;z-index:2147482500;
      display:grid;place-items:center;padding:18px;
      background:rgba(10,27,18,.72);backdrop-filter:blur(5px);
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    #mskDevUpdateModal{
      width:min(820px,100%);max-height:min(88vh,860px);overflow:hidden;
      display:flex;flex-direction:column;
      background:#fbfdfb;color:#21362b;border:1px solid #c9d9cf;border-radius:24px;
      box-shadow:0 30px 80px rgba(0,0,0,.34);
    }
    #mskDevUpdateModal *{box-sizing:border-box}
    #mskDevUpdateHead{
      position:relative;padding:24px 26px 20px;color:#fff;
      background:linear-gradient(135deg,#183b2a,#28543d 62%,#527761);
    }
    #mskDevUpdateHead .dev-kicker{
      display:block;margin-bottom:7px;font-size:10px;line-height:1;
      text-transform:uppercase;letter-spacing:.13em;font-weight:900;opacity:.72;
    }
    #mskDevUpdateHead h2{margin:0;font-size:clamp(28px,4vw,42px);line-height:1.02;letter-spacing:-.035em}
    #mskDevUpdateHead p{margin:9px 42px 0 0;max-width:690px;color:rgba(255,255,255,.84);font-size:13px;line-height:1.55}
    #mskDevUpdateClose{
      position:absolute;right:17px;top:17px;width:34px;height:34px;border-radius:50%;
      border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.10);color:#fff;
      font-size:20px;line-height:1;cursor:pointer;
    }
    #mskDevUpdateBody{overflow:auto;padding:20px 22px 8px}
    #mskDevUpdateBody .dev-flow{
      margin:0 0 16px;padding:12px 14px;border:1px solid #cdded3;border-radius:14px;
      background:#e7f0ea;color:#28543d;font-size:12px;font-weight:900;line-height:1.45;text-align:center;
    }
    #mskDevUpdateBody .dev-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
    #mskDevUpdateBody .dev-card{
      border:1px solid #d5e1d8;background:#fff;border-radius:15px;padding:14px 15px;
    }
    #mskDevUpdateBody .dev-card h3{margin:0 0 6px;font-size:14px;letter-spacing:-.01em}
    #mskDevUpdateBody .dev-card p{margin:0;color:#63736a;font-size:11px;line-height:1.5}
    #mskDevUpdateBody .dev-card strong{color:#28543d}
    #mskDevUpdateBody .dev-wide{grid-column:1/-1}
    #mskDevUpdateBody .dev-question-scale{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
    #mskDevUpdateBody .dev-chip{
      padding:5px 7px;border-radius:999px;background:#e3ece6;border:1px solid #cdded3;
      color:#28543d;font-size:9px;font-weight:900;
    }
    #mskDevUpdateFoot{
      display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;
      padding:14px 22px 18px;border-top:1px solid #d8e3db;background:#f6faf7;
    }
    #mskDevUpdateFoot .dev-note{color:#74847a;font-size:9.5px;line-height:1.4}
    #mskDevUpdateFoot .dev-actions{display:flex;gap:8px;flex-wrap:wrap}
    #mskDevUpdateFoot button{
      border-radius:10px;padding:9px 12px;font:850 10.5px/1 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer;
    }
    #mskDevUpdateTutorial{border:1px solid #c8d9ce;background:#fff;color:#28543d}
    #mskDevUpdateDone{border:1px solid #28543d;background:#28543d;color:#fff}
    @media(max-width:680px){
      #mskDevUpdateOverlay{padding:10px}
      #mskDevUpdateModal{max-height:94vh;border-radius:19px}
      #mskDevUpdateHead{padding:21px 20px 17px}
      #mskDevUpdateHead p{margin-right:34px}
      #mskDevUpdateBody{padding:15px 14px 7px}
      #mskDevUpdateBody .dev-grid{grid-template-columns:1fr}
      #mskDevUpdateBody .dev-wide{grid-column:auto}
      #mskDevUpdateFoot{padding:12px 14px 14px;align-items:flex-start}
      #mskDevUpdateFoot .dev-actions{width:100%}
      #mskDevUpdateFoot button{flex:1}
    }
  `;

  function markSeen(){
    try{localStorage.setItem(SEEN_KEY,'1')}catch(e){}
  }

  function close(){
    markSeen();
    const overlay=document.getElementById('mskDevUpdateOverlay');
    if(overlay)overlay.remove();
    document.body.style.removeProperty('overflow');
    window.__MSK_DEVELOPER_UPDATE_ACTIVE__=false;
  }

  function openTutorial(){
    close();
    setTimeout(()=>{
      const btn=document.getElementById('mskTutorialButton');
      if(btn)btn.click();
    },120);
  }

  function render(){
    if(document.getElementById('mskDevUpdateOverlay')) return;
    const style=document.createElement('style');
    style.id='mskDevUpdateStyles';
    style.textContent=css;
    document.head.appendChild(style);

    const overlay=document.createElement('div');
    overlay.id='mskDevUpdateOverlay';
    overlay.innerHTML=`
      <section id="mskDevUpdateModal" role="dialog" aria-modal="true" aria-labelledby="mskDevUpdateTitle">
        <div id="mskDevUpdateHead">
          <span class="dev-kicker">Developer Update · First Look</span>
          <h2 id="mskDevUpdateTitle">Welcome to MSK-Skin</h2>
          <p>Foundations was where MegaHub was built and tested. MSK is where the pieces start working together as one study system.</p>
          <button id="mskDevUpdateClose" type="button" aria-label="Close developer update">×</button>
        </div>

        <div id="mskDevUpdateBody">
          <div class="dev-flow">Learn → Recall → Practice → Find Weaknesses → Review → Improve</div>

          <div class="dev-grid">
            <article class="dev-card">
              <h3>📚 Weekly Hubs</h3>
              <p>Each week follows the actual module schedule. Lectures can include <strong>Companions, Factoid Sheets, Anki decks, and practice questions</strong>. Gross Anatomy now lives in its own dedicated hub.</p>
            </article>

            <article class="dev-card">
              <h3>🃏 Lecture Anki Decks</h3>
              <p>Selected lectures now have <strong>downloadable Anki decks</strong> right beside the Companion and Factoid. The intended flow is: learn it, condense it, retrieve it, then apply it.</p>
            </article>

            <article class="dev-card">
              <h3>💊 Drug + 🔬 Pathology Hubs</h3>
              <p>Both hubs will grow throughout MSK. Use them as running libraries for drugs, diseases, mechanisms, clinical connections, and focused review.</p>
            </article>

            <article class="dev-card">
              <h3>🧠 Better Questions</h3>
              <p>Question writing has been revamped using the best Foundations Drug/Path questions as the benchmark. Most major banks are being built around <strong>~80% Step-style questions</strong>.</p>
              <div class="dev-question-scale"><span class="dev-chip">In-House = Recall</span><span class="dev-chip">Intermediate = Applied</span><span class="dev-chip">Step 1 = Vignette</span></div>
            </article>

            <article class="dev-card dev-wide">
              <h3>🎯 Smart Review Center</h3>
              <p><strong>Review the Module</strong> is no longer just another cumulative quiz. MSK can track filed questions, repeated misses, confidence errors, low-confidence answers, and due reviews. The <strong>Weakness Radar</strong>, personalized study recommendations, spaced review, mastery tracking, and <strong>Adaptive Quiz Builder</strong> are designed to help decide what you should study next.</p>
            </article>

            <article class="dev-card">
              <h3>📝 MSK Notebook</h3>
              <p>A private, account-synced space for mnemonics, reminders, weak concepts, and anything else you want to keep during the module. Multiple notes, search, autosave, and draft recovery are built in.</p>
            </article>

            <article class="dev-card">
              <h3>🏆 MSK Leaderboard</h3>
              <p>Completely separate from Foundations. It rewards <strong>questions answered, not correctness</strong>, with more points for harder questions. Individual and CBL team standings are available.</p>
            </article>

            <article class="dev-card">
              <h3>👤 Your Account</h3>
              <p>Your account now ties together more of MegaHub: question history, review data, leaderboard activity, profile information, and your notebook. New users also receive a random medicine-themed screen name.</p>
            </article>

            <article class="dev-card">
              <h3>📋 CBL + 🧭 Tutorial</h3>
              <p>CBL now has its own hub for case quizzes and Quick Guides. If the new MSK layout feels like a lot, use the <strong>Tutorial</strong> button for a guided walkthrough at any time.</p>
            </article>

            <article class="dev-card dev-wide">
              <h3>💬 Please send feedback</h3>
              <p>Broken link? Bad question? Confusing explanation? Feature idea? Use the feedback section on the MSK homepage. The site is being built alongside the module, and feedback is one of the fastest ways to make it better.</p>
            </article>
          </div>
        </div>

        <div id="mskDevUpdateFoot">
          <span class="dev-note">This welcome update appears once and retires after Friday, October 16.</span>
          <div class="dev-actions">
            <button id="mskDevUpdateTutorial" type="button">Take the Tutorial</button>
            <button id="mskDevUpdateDone" type="button">Start Exploring</button>
          </div>
        </div>
      </section>`;

    document.body.appendChild(overlay);
    document.body.style.overflow='hidden';

    document.getElementById('mskDevUpdateClose').addEventListener('click',close);
    document.getElementById('mskDevUpdateDone').addEventListener('click',close);
    document.getElementById('mskDevUpdateTutorial').addEventListener('click',openTutorial);
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    document.addEventListener('keydown',function onKey(e){
      if(e.key==='Escape'){
        document.removeEventListener('keydown',onKey);
        close();
      }
    });

    markSeen();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(render,180),{once:true});
  else setTimeout(render,180);
})();