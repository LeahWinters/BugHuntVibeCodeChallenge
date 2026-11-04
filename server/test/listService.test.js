import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addItem,
  clearCompleted,
  createSeedItems,
  deleteItem,
  getView,
  patchItem,
  stepQuantity,
  toggleAll,
} from '../listService.js';

function fixture() {
  return [
    {
      id: 'a',
      name: 'Whole milk',
      quantity: '1',
      category: 'Dairy',
      notes: '',
      completed: false,
      createdAt: '2026-01-03T00:00:00.000Z',
    },
    {
      id: 'b',
      name: 'Eggs',
      quantity: '12',
      category: 'Dairy',
      notes: 'Large',
      completed: false,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'c',
      name: 'Bananas',
      quantity: '6',
      category: 'Produce',
      notes: '',
      completed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

test('sample list is eight rows in newest order and the count is honest until something is done', () => {
  const items = createSeedItems();
  const view = getView(items, {});
  assert.equal(items.length, 8);
  assert.equal(view.summary.itemCount, 8);
  assert.equal(view.summary.showing, 8);
  assert.equal(view.items[0].name, 'Whole milk');
  assert.equal(items.find((item) => item.name === 'Spinach').notes, 'Organic, bunch');
  assert.equal(view.summary.totalQuantity, 1 + 12 + 6 + 1 + 1 + 2 + 1 + 1);
});

test('empty names and a repeated name can both be saved', () => {
  const items = createSeedItems();
  const blank = addItem(items, { name: '', quantity: 1, category: 'Other', notes: '' });
  const spaces = addItem(items, { name: '   ', quantity: 1, category: 'Other', notes: '' });
  const again = addItem(items, { name: 'Whole milk', quantity: 1, category: 'Dairy', notes: '' });
  assert.equal(blank.ok, true);
  assert.equal(blank.item.name, '');
  assert.equal(spaces.item.name, '   ');
  assert.equal(again.ok, true);
  assert.equal(items.filter((item) => item.name === 'Whole milk').length, 2);
});

test('rejects a long name and a bad quantity, and stores a typed quantity exactly', () => {
  const items = fixture();
  assert.equal(addItem(items, { name: 'a'.repeat(81), quantity: 1, category: 'Other', notes: '' }).ok, false);
  assert.equal(addItem(items, { name: 'Ok', quantity: 0, category: 'Other', notes: '' }).ok, false);
  assert.equal(addItem(items, { name: 'Ok', quantity: 1.5, category: 'Other', notes: '' }).ok, false);
  assert.equal(patchItem(items, 'a', { quantity: 4 }).ok, true);
  assert.equal(items[0].quantity, '4');
  assert.equal(patchItem(items, 'a', { category: 'Bakery' }).ok, true);
  assert.equal(getView(items, { category: 'Bakery' }).items[0].name, 'Whole milk');
});

test('notes longer than 12 characters are cut on add and on save', () => {
  const items = createSeedItems();
  const added = addItem(items, {
    name: 'Apples',
    quantity: 1,
    category: 'Produce',
    notes: 'Get the ripe ones',
  });
  assert.equal(added.item.notes, 'Get the ripe');
  const spinach = items.find((item) => item.name === 'Spinach');
  patchItem(items, spinach.id, { notes: spinach.notes });
  assert.equal(spinach.notes, 'Organic, bun');
});

test('plus appends a digit and minus decreases by one', () => {
  const items = fixture();
  stepQuantity(items, 'a', 'up');
  assert.equal(items[0].quantity, '11');
  stepQuantity(items, 'a', 'up');
  assert.equal(items[0].quantity, '111');
  stepQuantity(items, 'b', 'down');
  assert.equal(items[1].quantity, '11');
  const fresh = fixture();
  stepQuantity(fresh, 'a', 'down');
  assert.equal(fresh[0].quantity, '1');
});

test('checkbox flips the next row, including a wrap from the last row', () => {
  const items = fixture();
  patchItem(items, 'a', { completed: true });
  assert.equal(items[0].completed, false);
  assert.equal(items[1].completed, true);
  const wrapped = fixture();
  patchItem(wrapped, 'c', { completed: true });
  assert.equal(wrapped[2].completed, false);
  assert.equal(wrapped[0].completed, true);
});

test('mark all done updates every other row in newest order', () => {
  const items = createSeedItems();
  toggleAll(items);
  const done = items.filter((item) => item.completed).map((item) => item.name);
  assert.deepEqual(done, ['Whole milk', 'Bananas', 'Sourdough', 'Ice cream']);
  assert.equal(getView(items, {}).summary.allCompleted, false);
});

test('clear completed removes done produce rows only', () => {
  const items = fixture();
  items[0].completed = true;
  items[2].completed = true;
  clearCompleted(items);
  assert.equal(items.find((item) => item.id === 'c'), undefined);
  assert.equal(items.find((item) => item.id === 'a').completed, true);
  assert.equal(items.find((item) => item.id === 'b').completed, false);
});

test('delete removes the next row and the only row when it is alone', () => {
  const items = fixture();
  deleteItem(items, 'a');
  assert.deepEqual(items.map((item) => item.id), ['a', 'c']);
  const wrapped = fixture();
  deleteItem(wrapped, 'c');
  assert.deepEqual(wrapped.map((item) => item.id), ['b', 'c']);
  const alone = fixture().slice(0, 1);
  deleteItem(alone, 'a');
  assert.equal(alone.length, 0);
});

test('a renamed item keeps the old name', () => {
  const items = fixture();
  const result = patchItem(items, 'a', { name: 'Oat milk', quantity: 2, notes: 'skim' });
  assert.equal(result.ok, true);
  assert.equal(items[0].name, 'Whole milk');
  assert.equal(items[0].quantity, '2');
  assert.equal(items[0].notes, 'skim');
});

test('search, dairy, and status filters are wrong; other filters and sorts are right', () => {
  const items = fixture();
  assert.equal(getView(items, { q: 'milk' }).items.length, 0);
  assert.equal(getView(items, { q: 'Large' }).items.length, 0);
  assert.equal(getView(items, { q: 'Dairy' }).items.length, 2);
  assert.equal(getView(items, { q: 'dairy' }).items.length, 0);
  assert.equal(getView(items, { category: 'Dairy' }).items.length, 0);
  assert.equal(getView(items, { category: 'Produce' }).items.length, 1);

  items[0].completed = true;
  assert.deepEqual(getView(items, { status: 'active' }).items.map((item) => item.id), ['a']);
  assert.deepEqual(getView(items, { status: 'completed' }).items.map((item) => item.id), ['b', 'c']);
  assert.deepEqual(getView(items, { sort: 'name' }).items.map((item) => item.name), [
    'Bananas',
    'Eggs',
    'Whole milk',
  ]);
  assert.deepEqual(getView(items, { sort: 'category' }).items.map((item) => item.name), [
    'Eggs',
    'Whole milk',
    'Bananas',
  ]);
});

test('the item count adds one extra for each done row, and units ignore done rows', () => {
  const items = fixture();
  assert.equal(getView(items, {}).summary.totalQuantity, 19);
  items[0].completed = true;
  const view = getView(items, {});
  assert.equal(view.summary.itemCount, 4);
  assert.equal(view.summary.showing, 3);
  assert.equal(view.summary.totalQuantity, 18);
});
