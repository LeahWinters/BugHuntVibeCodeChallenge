import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createStore } from '../store.js';

test('a hunt is saved on disk and a second Whole milk is allowed', () => {
  const file = path.join(os.tmpdir(), `bughunt-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  const store = createStore(file);
  const session = store.createSession('  Ada  ');
  assert.equal(session.playerName, 'Ada');
  assert.equal(session.items.length, 8);

  const saved = store.addReport(session, {
    title: 'Plus appends a digit',
    area: 'Quantities',
    severity: 'high',
    steps: 'I pressed + on Whole milk. Quantity went from 1 to 11, then to 111.',
    expected: 'Plus should increase the quantity by one.',
    actual: 'The quantity became 11 and then 111.',
  });
  assert.equal(saved.ok, true);
  assert.equal(saved.report.result.status, 'matched');
  assert.equal(saved.report.result.bugId, 'quantity-concat');

  const reloaded = createStore(file);
  const again = reloaded.getSession(session.id);
  assert.equal(again.reports.length, 1);
  assert.equal(again.items.length, 8);
  fs.unlinkSync(file);
});
