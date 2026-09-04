import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  transformCitations,
  citationIndexFromTitle,
  hostLabel,
  CITE_TITLE_PREFIX,
} from './citations.ts';

describe('Citations Utility & Markdown Transformation Suite', () => {
  it('correctly transforms standard citation markers into titled markdown links', () => {
    const raw = 'According to research [[cite:https://example.com/report|Industry Report]], market growth is accelerating.';
    const { content, citations } = transformCitations(raw);

    assert.equal(citations.length, 1);
    assert.equal(citations[0].index, 1);
    assert.equal(citations[0].url, 'https://example.com/report');
    assert.equal(citations[0].label, 'Industry Report');
    assert.equal(
      content,
      'According to research [Industry Report](<https://example.com/report> "cite:1"), market growth is accelerating.'
    );
  });

  it('reuses the same index when the same URL is cited multiple times', () => {
    const raw = 'First [[cite:https://x.com/1|Source X]] and second [[cite:https://x.com/1|Source X]] and third [[cite:https://y.com/2|Source Y]].';
    const { content, citations } = transformCitations(raw);

    assert.equal(citations.length, 2);
    assert.equal(citations[0].index, 1);
    assert.equal(citations[1].index, 2);

    // Both occurrences of Source X should point to cite:1
    const cite1Occurrences = (content.match(/cite:1/g) || []).length;
    assert.equal(cite1Occurrences, 2);

    const cite2Occurrences = (content.match(/cite:2/g) || []).length;
    assert.equal(cite2Occurrences, 1);
  });

  it('falls back to cleaned hostname when label is omitted', () => {
    const raw = 'Reference: [[cite:https://www.coursera.org/articles/ai-trends]].';
    const { content, citations } = transformCitations(raw);

    assert.equal(citations.length, 1);
    assert.equal(citations[0].label, 'coursera.org');
    assert.ok(content.includes('[coursera.org](<https://www.coursera.org/articles/ai-trends> "cite:1")'));
  });

  it('hostLabel strips leading www and handles invalid URLs safely', () => {
    assert.equal(hostLabel('https://www.coursera.org/x'), 'coursera.org');
    assert.equal(hostLabel('https://blog.google/technology/'), 'blog.google');
    assert.equal(hostLabel('invalid-url-string'), 'invalid-url-string');
  });

  it('neutralizes javascript: XSS URLs into plain text without creating markdown links', () => {
    const raw = 'Click here [[cite:javascript:alert(1)|Malicious Exploit]] to see proof.';
    const { content, citations } = transformCitations(raw);

    assert.equal(citations.length, 0);
    assert.ok(!content.includes('javascript:'));
    assert.ok(!content.includes('href='));
    assert.ok(content.includes('Malicious Exploit'));
  });

  it('neutralizes non-http internal schemes (e.g. partnerships://) to plain text', () => {
    const raw = 'Connected via [[cite:partnerships://uuid-1234|Internal Partnership]].';
    const { content, citations } = transformCitations(raw);

    assert.equal(citations.length, 0);
    assert.ok(!content.includes('partnerships://'));
    assert.ok(content.includes('Internal Partnership'));
  });

  it('hides partially arrived trailing marker during streaming mode', () => {
    const streamingIncomplete = 'The competitor recently launched [[cite:htt';
    const resultStreaming = transformCitations(streamingIncomplete, { streaming: true });
    assert.equal(resultStreaming.content, 'The competitor recently launched ');
    assert.equal(resultStreaming.citations.length, 0);

    const resultNonStreaming = transformCitations(streamingIncomplete, { streaming: false });
    assert.equal(resultNonStreaming.content, streamingIncomplete);
  });

  it('preserves table cell formatting containing citations', () => {
    const table = '| Metric | Source |\n|---|---|\n| Growth | [[cite:https://data.com/metrics|Data Report]] |';
    const { content, citations } = transformCitations(table);

    assert.equal(citations.length, 1);
    assert.ok(content.includes('| Growth | [Data Report](<https://data.com/metrics> "cite:1") |'));
  });

  it('escapes brackets within citation labels', () => {
    const raw = 'Check this [[cite:https://a.com/p|Weird [label]]] note.';
    const { content, citations } = transformCitations(raw);

    assert.equal(citations.length, 1);
    assert.ok(content.includes('\\[label'));
  });

  it('parses citationIndexFromTitle correctly', () => {
    assert.equal(citationIndexFromTitle('cite:1'), 1);
    assert.equal(citationIndexFromTitle('cite:42'), 42);
    assert.equal(citationIndexFromTitle('cite:0'), null);
    assert.equal(citationIndexFromTitle('cite:-5'), null);
    assert.equal(citationIndexFromTitle('ordinary-title'), null);
    assert.equal(citationIndexFromTitle(null), null);
    assert.equal(citationIndexFromTitle(undefined), null);
    assert.equal(citationIndexFromTitle(''), null);
  });

  it('handles empty, null, and undefined inputs gracefully', () => {
    assert.deepEqual(transformCitations(''), { content: '', citations: [] });
    assert.deepEqual(transformCitations(null), { content: '', citations: [] });
    assert.deepEqual(transformCitations(undefined), { content: '', citations: [] });
  });
});
