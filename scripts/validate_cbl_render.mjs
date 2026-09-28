import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const root=process.cwd();
const cases=[
  ['week3_case_quiz_30.html','week3-cbl-case-30',30],
  ['week4_case_quiz_27.html','week4-cbl-case-27',27],
  ['week5_case_quiz_19.html','week5-cbl-case-19',19],
  ['week6_case_quiz_33.html','week6-cbl-case-33',33],
  ['week7_case_quiz_35.html','week7-cbl-case-35',35],
  ['week8_case_quiz_27.html','week8-cbl-case-27',27],
  ['week9_case_quiz_28.html','week9-cbl-case-28',28],
];

function diagnoseInlineScripts(html,file){
  const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  scripts.forEach((m,i)=>{
    const code=m[1];
    try{
      new vm.Script(code,{filename:`${file}:inline-${i+1}`});
    }catch(err){
      console.log(`  SYNTAX ${file} inline script ${i+1}:`);
      console.log(String(err.stack||err));
      const lineMatch=String(err.stack||'').match(new RegExp(`${file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}:inline-${i+1}:(\\d+)`));
      if(lineMatch){
        const n=Number(lineMatch[1]);
        const lines=code.split('\n');
        for(let x=Math.max(1,n-2);x<=Math.min(lines.length,n+2);x++) console.log(`    ${x}: ${lines[x-1]}`);
      }
    }
  });
}

let failures=0;
for(const [file,quizId,expected] of cases){
  let html=fs.readFileSync(path.join(root,'weeks','cbl',file),'utf8');
  html=html.replace(/<script[^>]+src=["'][^"']*(?:supabase|cbl-supabase)[^"']*["'][^>]*><\/script>/gi,'');
  diagnoseInlineScripts(html,file);
  const virtualConsole=new VirtualConsole();
  const errors=[];
  virtualConsole.on('jsdomError',e=>errors.push(String(e?.message||e)));
  virtualConsole.on('error',e=>errors.push(String(e)));
  const dom=new JSDOM(html,{
    runScripts:'dangerously',
    url:`https://megahub.test/weeks/cbl/${file}`,
    virtualConsole,
    beforeParse(window){
      window.localStorage.setItem(`cbl-flags:${quizId}`,'{bad-json');
      window.confirm=()=>true;
      window.alert=()=>{};
    }
  });
  await new Promise(r=>setTimeout(r,25));
  const rendered=dom.window.document.querySelectorAll('#quiz .question').length;
  const ok=rendered===expected;
  console.log(`${ok?'PASS':'FAIL'} ${file}: rendered ${rendered}/${expected}`);
  if(!ok){
    failures++;
    if(errors.length) console.log('  JS errors:',errors.join(' | '));
  }
  dom.window.close();
}
if(failures) process.exit(1);
