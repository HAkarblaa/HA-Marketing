/* In-app practice. Objective items auto-graded; written responses reviewed against model. */
(function(){
'use strict';let answers=new Map(),results=null,examRef=null;
const norm=s=>String(s??'').normalize('NFKC').trim().toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/\s+/g,' ');
function tf(s){const x=norm(s).replace(/[.،!]/g,'');if(['true','t','صح','صحيح','صواب'].includes(x))return true;if(['false','f','خطأ','خاطئ','غلط'].includes(x))return false;return null;}
function key(q){
 if(q.type==='tf')return tf(q.answer);
 if(Array.isArray(q.correct_indices)&&q.correct_indices.length&&q.correct_indices.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length))return [...new Set(q.correct_indices)].sort((a,b)=>a-b);
 const exact=q.options.findIndex(o=>norm(o)===norm(q.answer));if(exact>=0)return [exact];
 const a=norm(q.answer).toUpperCase();if(/^[A-Z](?:\s*[,،;]\s*[A-Z])*$/.test(a)){const ids=a.split(/[,،;]/).map(x=>x.trim().charCodeAt(0)-65);if(ids.every(i=>i>=0&&i<q.options.length))return ids.sort((x,y)=>x-y);}
 return null;
}
function grade(q,value){
 if(q.type==='tf'){const correct=key(q);return correct===null?null:value===correct;}
 if(['mcq','multi'].includes(q.type)||q.options.length){const correct=key(q);if(!correct)return null;const chosen=Array.isArray(value)?[...value].sort((a,b)=>a-b):[];return chosen.length===correct.length&&chosen.every((v,i)=>v===correct[i]);}
 return null;
}
const style=document.createElement('style');style.textContent='.ha-exam-option{display:flex;align-items:flex-start;gap:10px;padding:13px;margin:8px 0;border:1px solid #cbdde6;border-radius:12px;cursor:pointer;background:#fff}.ha-exam-option:has(input:checked){background:#e8f4ff;border-color:#087de1}.ha-exam-option input{width:20px!important;min-width:20px;height:20px!important;accent-color:#087de1;margin-top:4px}.ha-exam-written{width:100%;min-height:110px;box-sizing:border-box;padding:12px;border:1px solid #cbdde6;border-radius:12px;font:inherit}.ha-exam-feedback{padding:12px;margin-top:12px;border-radius:12px;white-space:pre-wrap;line-height:1.8}.ha-exam-feedback.good{background:#e5f7eb;color:#086534}.ha-exam-feedback.bad{background:#fff0f0;color:#9c2020}.ha-exam-feedback.review{background:#fff5d8;color:#694900}#haExamScore{padding:16px;border-radius:14px;background:#eef6ff;margin-bottom:14px;font-weight:bold}';document.head.append(style);
const controls=document.createElement('div');controls.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin:12px 0';const submit=document.createElement('button'),reset=document.createElement('button');submit.type=reset.type='button';submit.textContent='تصحيح الإجابات';reset.textContent='إعادة المحاولة';submit.className='primary';reset.className='secondary';controls.append(submit,reset);examList.before(controls);
const score=document.createElement('div');score.id='haExamScore';score.hidden=true;score.setAttribute('role','status');examList.before(score);
window.renderExam=function(){
 if(examRef!==lastExam){examRef=lastExam;answers=new Map();results=null;score.hidden=true;}
 examList.replaceChildren();const english=window.__examLanguage==='English';
 lastExam.forEach((q,i)=>{
  const card=document.createElement('div');card.className='q';card.dir=english?'ltr':'rtl';const heading=document.createElement('strong');heading.textContent=q.number+'. '+q.question;card.append(heading);
  const choices=q.type==='tf'?[english?'True':'صح',english?'False':'خطأ']:q.options;
  if(choices.length){
   choices.forEach((text,j)=>{const label=document.createElement('label');label.className='ha-exam-option';const input=document.createElement('input');input.type=q.type==='multi'?'checkbox':'radio';input.name='ha-answer-'+i;input.disabled=!!results;
    const value=answers.get(i);input.checked=q.type==='tf'?value===(j===0):Array.isArray(value)&&value.includes(j);
    input.addEventListener('change',()=>{if(q.type==='tf')answers.set(i,j===0);else if(q.type==='multi'){const set=new Set(answers.get(i)||[]);if(input.checked)set.add(j);else set.delete(j);answers.set(i,[...set]);}else answers.set(i,[j]);});
    const span=document.createElement('span');span.textContent=text;label.append(input,span);card.append(label);
   });
  }else{const input=document.createElement('textarea');input.className='ha-exam-written';input.placeholder=english?'Write your answer here':'اكتب إجابتك هنا';input.value=answers.get(i)||'';input.disabled=!!results;input.oninput=()=>answers.set(i,input.value);card.append(input);}
  if(results||answersVisible){const outcome=results?.[i];const feedback=document.createElement('div');feedback.className='ha-exam-feedback '+(outcome===true?'good':outcome===false?'bad':'review');let text=results?(outcome===true?(english?'Correct':'إجابة صحيحة'):outcome===false?(english?'Incorrect or unanswered':'إجابة غير صحيحة أو غير مجابة'):(english?'Review against the model answer; not auto-graded.':'للمراجعة مقابل الجواب النموذجي؛ غير محسوبة بالتصحيح التلقائي.'))+'\n':'';text+=(english?'Model answer: ':'الجواب النموذجي: ')+q.answer;if(q.explanation)text+='\n'+q.explanation;if(q.source_quote)text+='\n'+(english?'Source: ':'من المادة: ')+q.source_quote;feedback.textContent=text;card.append(feedback);}
  examList.append(card);
 });resultCard.classList.add('show');submit.disabled=!!results;reset.disabled=!lastExam.length;
};
submit.onclick=()=>{if(!lastExam.length)return;results=lastExam.map((q,i)=>grade(q,answers.get(i)));const graded=results.filter(v=>v!==null),correct=graded.filter(Boolean).length,review=results.length-graded.length;score.hidden=false;score.textContent='النتيجة التلقائية: '+correct+' / '+graded.length+(graded.length?' — '+Math.round(correct/graded.length*100)+'%':'')+(review?' | '+review+' سؤال للمراجعة اليدوية':'');renderExam();score.scrollIntoView({behavior:'smooth',block:'center'});};
reset.onclick=()=>{answers=new Map();results=null;answersVisible=false;answersBtn.textContent='إظهار الأجوبة';score.hidden=true;renderExam();};
window.HAExamPractice={grade,key};
})();
