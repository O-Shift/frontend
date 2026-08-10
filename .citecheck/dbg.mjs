import { readFileSync } from 'node:fs';
const answer = JSON.parse(readFileSync('real.json','utf8')).turns[0].answer;
const MARK = /\[\[cite:\s*([^|\]]+?)\s*(?:\|\s*([^\]]*?)\s*)?\]\]/g;
const all = [...answer.matchAll(MARK)];
console.log('regex-matched markers:', all.length);
console.log('raw "[[cite:" occurrences:', (answer.match(/\[\[cite:/g)||[]).length);
const urls = all.map(m=>m[1]);
const uniq = [...new Set(urls)];
console.log('unique urls:', uniq.length);
// which raw occurrences did the regex NOT match?
const idxs = all.map(m=>m.index);
let pos = -1; const unmatched=[];
while ((pos = answer.indexOf('[[cite:', pos+1)) !== -1) if (!idxs.includes(pos)) unmatched.push(pos);
console.log('\nUNMATCHED marker sites:', unmatched.length);
for (const p of unmatched) console.log('  >>>', JSON.stringify(answer.slice(p, p+160)));
const dupes = urls.filter((u,i)=>urls.indexOf(u)!==i);
console.log('\nduplicate urls:', dupes.length, dupes.slice(0,5));
console.log('\ntail of answer:', JSON.stringify(answer.slice(-200)));
