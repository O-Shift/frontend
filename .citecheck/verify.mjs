// Ad-hoc verification of citations.ts against REAL agent output captured by
// scripts/agent_audit/harness.py. Not a unit test -- the frontend has no test
// runner -- but it proves the transform handles what the model actually emits.
import { readFileSync } from 'node:fs';
import { transformCitations, citationIndexFromTitle, hostLabel } from './citations.mjs';

const answer = JSON.parse(readFileSync(process.argv[2], 'utf8')).turns[0].answer;

let failures = 0;
const check = (name, cond, detail = '') => {
  if (cond) console.log(`  PASS  ${name}`);
  else { console.log(`  FAIL  ${name} ${detail}`); failures++; }
};

const { content, citations } = transformCitations(answer);

console.log('=== real agent output ===');
console.log(`markers in raw answer: ${(answer.match(/\[\[cite:/g) || []).length}`);
console.log(`citations extracted:   ${citations.length}`);

check('every marker consumed', !content.includes('[[cite:'), content.slice(0, 80));
check('citations found', citations.length > 0);
check('indices are 1..N contiguous',
  citations.every((c, i) => c.index === i + 1));
check('all urls http(s)', citations.every((c) => /^https?:\/\//.test(c.url)));
check('all have labels', citations.every((c) => c.label.length > 0));

// Every emitted link must be parseable back to its citation. The count is the
// number of markers whose URL was http(s) -- markers carrying an internal
// scheme (partnerships://<uuid>) are deliberately degraded to plain text, so
// asserting against the raw marker count would be asserting the bug.
const MARK = /\[\[cite:\s*([^|\]]+?)\s*(?:\|\s*([^\]]*?)\s*)?\]\]/g;
const rawUrls = [...answer.matchAll(MARK)].map((m) => m[1].trim());
const safeCount = rawUrls.filter((u) => /^https?:\/\//.test(u)).length;
const titles = [...content.matchAll(/"cite:(\d+)"/g)].map((m) => Number(m[1]));
check('every safe marker becomes a round-trippable link',
  titles.length === safeCount && titles.every((n) => citationIndexFromTitle(`cite:${n}`) === n),
  `titles=${titles.length} safe=${safeCount}`);
const unsafe = [...new Set(rawUrls.filter((u) => !/^https?:\/\//.test(u)))];
check('no non-http scheme reaches the rendered output',
  unsafe.every((u) => !content.includes(u)), unsafe.join(','));
if (unsafe.length) console.log(`  NOTE  model cited ${unsafe.length} internal URL(s): ${unsafe.join(', ')}`);
check('no marker text leaks into visible prose',
  !content.includes('cite:https'), '');

console.log('\n=== edge cases ===');
const dup = transformCitations('a [[cite:https://x.com/1|X]] b [[cite:https://x.com/1|X]] c');
check('same url reuses one index', dup.citations.length === 1 && (dup.content.match(/cite:1/g) || []).length === 2);

const evil = transformCitations('x [[cite:javascript:alert(1)|Bad]] y');
check('javascript: url never becomes a link', !evil.content.includes('javascript:') && evil.citations.length === 0, evil.content);
check('javascript: keeps label as plain text', evil.content.includes('Bad'), evil.content);

const noLabel = transformCitations('x [[cite:https://blog.coursera.org/ai]] y');
check('missing label falls back to host', noLabel.citations[0]?.label === 'blog.coursera.org');

const partial = transformCitations('Coursera shipped a thing [[cite:htt', { streaming: true });
check('streaming hides half-arrived marker', !partial.content.includes('[[cite'), partial.content);
const partialDone = transformCitations('Coursera shipped a thing [[cite:htt', { streaming: false });
check('non-streaming leaves it alone', partialDone.content.includes('[[cite'));

const inTable = transformCitations('| a | b |\n|---|---|\n| x [[cite:https://a.com/p|A]] | y |');
check('citation inside a table cell survives', inTable.content.includes('| x [A](<https://a.com/p> "cite:1") | y |'), inTable.content);

const brackets = transformCitations('x [[cite:https://a.com/p|Weird [label]]] y');
check('bracket in label is escaped', brackets.content.includes('\\[') || brackets.citations.length === 1, brackets.content);

check('hostLabel strips www', hostLabel('https://www.coursera.org/x') === 'coursera.org');
check('empty input is safe', transformCitations('').citations.length === 0 && transformCitations(null).content === '');

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
