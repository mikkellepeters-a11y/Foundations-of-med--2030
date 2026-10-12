(()=>{
'use strict';
const PREFIX='MSK-RICH-TEXT:1\n';
const HIGHLIGHT='#fff1a8';
const allowed=new Set(['B','STRONG','I','EM','U','MARK','SPAN','BR','DIV','P','UL','OL','LI']);
const blocked=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','TEXTAREA','SELECT','LINK','META','IMG','VIDEO','AUDIO']);
function plainHTML(text){const d=document.createElement('div');d.textContent=String(text||'');return d.innerHTML.replace(/\r\n?|\n/g,'<br>')}
function sanitizeHTML(value){
 const template=document.createElement('template');template.innerHTML=String(value||'');
 const out=document.createElement('div');
 function copy(node,parent){
  if(node.nodeType===3){parent.appendChild(document.createTextNode(node.nodeValue));return}
  if(node.nodeType!==1||blocked.has(node.tagName))return;
  if(!allowed.has(node.tagName)){[...node.childNodes].forEach(n=>copy(n,parent));return}
  const clean=document.createElement(node.tagName.toLowerCase());
  if(node.tagName==='SPAN'){
   const st=node.style;
   if(st.fontWeight==='bold'||Number(st.fontWeight)>=600)clean.style.fontWeight='bold';
   if(st.fontStyle==='italic')clean.style.fontStyle='italic';
   if((st.textDecorationLine||st.textDecoration||'').includes('underline'))clean.style.textDecoration='underline';
   const bg=st.backgroundColor.replace(/\s/g,'').toLowerCase();
   if(bg&&bg!=='transparent'&&bg!=='rgba(0,0,0,0)')clean.style.backgroundColor=HIGHLIGHT;
  }
  [...node.childNodes].forEach(n=>copy(n,clean));parent.appendChild(clean);
 }
 [...template.content.childNodes].forEach(n=>copy(n,out));return out.innerHTML;
}
function readContent(value){
 const raw=String(value||'');
 if(raw.startsWith(PREFIX)){
  try{const v=JSON.parse(raw.slice(PREFIX.length));if(v&&typeof v.html==='string')return sanitizeHTML(v.html)}catch(e){}
 }
 return plainHTML(raw);
}
function plainTextFromHTML(html){
 const d=document.createElement('div');d.innerHTML=sanitizeHTML(html);
 function walk(node){
  if(node.nodeType===3)return node.nodeValue;
  if(node.nodeType!==1)return '';
  if(node.tagName==='BR')return '\n';
  const text=children(node);
  return ['DIV','P','LI'].includes(node.tagName)?text+'\n':text;
 }
 function children(node){return [...node.childNodes].reduce((text,child)=>{if(child.nodeType===1&&['DIV','P','LI'].includes(child.tagName)&&text&&!text.endsWith('\n'))text+='\n';return text+walk(child)},'')}
 return children(d).replace(/\u00a0/g,' ').replace(/\n$/,'');
}
function contentText(value){return plainTextFromHTML(readContent(value))}
function serialize(html){const clean=sanitizeHTML(html);return PREFIX+JSON.stringify({html:clean})}
window.MSKNoteFormatting=Object.freeze({HIGHLIGHT,plainHTML,sanitizeHTML,readContent,plainTextFromHTML,contentText,serialize});
})();
