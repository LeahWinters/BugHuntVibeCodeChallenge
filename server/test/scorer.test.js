import assert from 'node:assert/strict';
import test from 'node:test';
import { AREAS, SEVERITIES } from '../constants.js';
import { bugs } from '../catalog.js';
import { buildDebrief } from '../debrief.js';
import { scoreReport } from '../scorer.js';

const samples = [
  [
    'blank-name',
    'I added an item with a blank name and it was saved. Expected the add to be rejected when the name is empty or only spaces.',
  ],
  [
    'notes-truncated',
    'I saved a note that said Get the ripe ones. Only the first 12 characters were kept. Expected the full note to be stored.',
  ],
  [
    'quantity-concat',
    'I pressed + on Whole milk. Quantity went from 1 to 11, then to 111. Expected plus to increase the quantity by one.',
  ],
  [
    'toggle-neighbor',
    'Checking the checkbox on Whole milk marks Eggs done instead. Whole milk stays unchecked. Expected the row I checked to change.',
  ],
  [
    'toggle-all-partial',
    'Mark all done only changes every other row. Eggs stayed not done. Expected every row to be marked done.',
  ],
  [
    'clear-produce-only',
    'I clicked Clear completed after Bananas and Whole milk were done. Bananas was removed and Whole milk stayed. Expected every done row to be removed, including ones that are not Produce.',
  ],
  [
    'delete-neighbor',
    'I clicked Delete on Whole milk. Eggs was removed instead and Whole milk stayed. Expected only the row I clicked to be removed.',
  ],
  [
    'edit-ignores-name',
    'I renamed Whole milk to Oat milk and clicked Save. The name stayed Whole milk. Expected the new item name to be kept.',
  ],
  [
    'search-wrong-field',
    'Searching for banana does not find Bananas. Searching for Dairy returns the dairy rows, so search is matching the category and not the item name. Expected a case-insensitive match on the item name.',
  ],
  [
    'dairy-filter',
    'The Dairy category filter shows an empty list. Whole milk and Eggs still show when the category is All. Expected the Dairy filter to list them.',
  ],
  [
    'status-inverted',
    'The Still to buy filter shows rows that are already done, and the Done filter shows rows that are not done. The status filters are swapped.',
  ],
  [
    'count-inflated',
    'After a row is done, the item count is higher than the number of rows. Expected the item count to stay equal to the rows.',
  ],
];

function hunt(text, extra = {}) {
  return {
    title: text.slice(0, 110),
    area: 'Notes',
    severity: 'low',
    steps: text,
    expected: 'Per the spec.',
    actual: text,
    ...extra,
  };
}

test('the catalog is a fixed set of distinct defects', () => {
  assert.equal(bugs.length, 12);
  assert.equal(new Set(bugs.map((bug) => bug.id)).size, bugs.length);
  for (const bug of bugs) {
    assert.ok(AREAS.includes(bug.area), bug.area);
    assert.ok(SEVERITIES.includes(bug.severity), bug.severity);
    assert.ok(bug.gate.every((group) => group.length > 0));
  }
});

test('a specific report matches one defect and a vague one does not', () => {
  const found = [];
  for (const [id, text] of samples) {
    const result = scoreReport(hunt(text));
    assert.equal(result.status, 'matched', `${id} => ${result.status} (${result.message})`);
    assert.equal(result.bugId, id);
    found.push(result.bugId);
  }
  assert.equal(new Set(found).size, samples.length);

  assert.equal(scoreReport(hunt('Delete is broken and I do not like it right now.')).status, 'unmatched');
  assert.equal(
    scoreReport(hunt('I searched for Organic and got no results from the note.')).status,
    'unmatched',
  );
  assert.equal(
    scoreReport(
      hunt(
        'Checking the checkbox on Whole milk marks a different item instead. Also I clicked Delete on Whole milk and a different row was removed instead.',
      ),
    ).status,
    'ambiguous',
  );
});

test('points reward the official severity and the matching area', () => {
  const text = samples.find(([id]) => id === 'quantity-concat')[1];
  const exact = scoreReport(hunt(text, { area: 'Quantities', severity: 'high' }));
  assert.equal(exact.points, 400);
  assert.match(exact.message, /Area and severity both matched/);

  const off = scoreReport(hunt(text, { area: 'Notes', severity: 'low' }));
  assert.equal(off.points, 300);
  assert.match(off.message, /Quantities/);
  assert.match(off.message, /High/);

  const prior = [{ result: { status: 'matched', bugId: 'quantity-concat' } }];
  const again = scoreReport(hunt(text), prior);
  assert.equal(again.status, 'duplicate');
  assert.match(again.message, /Already confirmed/);
});

test('the answer key stays sealed until the hunt is revealed', () => {
  const hidden = buildDebrief({
    revealed: false,
    reports: [
      {
        title: 'Plus is weird',
        result: { status: 'matched', bugId: 'quantity-concat', points: 400 },
      },
    ],
  });
  assert.equal(hidden.revealed, false);
  assert.equal(hidden.score, 400);
  assert.equal(hidden.confirmedCount, 1);
  assert.equal(hidden.bugs, undefined);
  assert.equal(JSON.stringify(hidden).includes('blank-name'), false);

  const open = buildDebrief({
    revealed: true,
    reports: [
      {
        title: 'Plus appends a one',
        result: { status: 'matched', bugId: 'quantity-concat', points: 400 },
      },
    ],
  });
  assert.equal(open.totalBugs, 12);
  assert.equal(open.maxScore, 3900);
  const plus = open.bugs.find((bug) => bug.id === 'quantity-concat');
  assert.equal(plus.found, true);
  assert.equal(plus.reportTitle, 'Plus appends a one');
  assert.equal(open.bugs.filter((bug) => bug.found).length, 1);
});
