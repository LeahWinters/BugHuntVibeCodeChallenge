import { CATEGORIES } from './constants.js';

const SEED = [
  { name: 'Whole milk', quantity: 1, category: 'Dairy', notes: '' },
  { name: 'Eggs', quantity: 12, category: 'Dairy', notes: 'Large' },
  { name: 'Bananas', quantity: 6, category: 'Produce', notes: '' },
  { name: 'Spinach', quantity: 1, category: 'Produce', notes: 'Organic, bunch' },
  { name: 'Sourdough', quantity: 1, category: 'Bakery', notes: '' },
  { name: 'Jasmine rice', quantity: 2, category: 'Pantry', notes: '' },
  { name: 'Ice cream', quantity: 1, category: 'Frozen', notes: 'Vanilla' },
  { name: 'Coffee beans', quantity: 1, category: 'Pantry', notes: '' },
];

function fail(status, message) {
  return { ok: false, status, message };
}

export function ordered(items) {
  return [...items].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
}

function neighbor(items, id) {
  const list = ordered(items);
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  return list[(index + 1) % list.length];
}

export function createSeedItems() {
  const now = Date.now();
  return SEED.map((item, index) => ({
    id: crypto.randomUUID(),
    name: item.name,
    quantity: String(item.quantity),
    category: item.category,
    notes: item.notes,
    completed: false,
    createdAt: new Date(now - index * 1000).toISOString(),
  }));
}

export function getView(items, query = {}) {
  let result = items.map((item) => ({ ...item }));
  const q = String(query.q || '').trim().slice(0, 80);
  const category = String(query.category || 'All');
  const status = String(query.status || 'all');
  const sort = String(query.sort || 'newest');

  // BUG search-wrong-field: case-sensitive match against the category, not the item name.
  if (q) result = result.filter((item) => item.category.includes(q));

  // BUG dairy-filter: the Dairy option looks up a misspelled category.
  if (category && category !== 'All') {
    const needle = category === 'Dairy' ? 'Diary' : category;
    result = result.filter((item) => item.category === needle);
  }

  // BUG status-inverted: Still to buy and Done are swapped. All is untouched.
  if (status === 'active') result = result.filter((item) => item.completed);
  else if (status === 'completed') result = result.filter((item) => !item.completed);

  if (sort === 'name') {
    result.sort(
      (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.id.localeCompare(b.id),
    );
  } else if (sort === 'category') {
    result.sort(
      (a, b) =>
        a.category.localeCompare(b.category, 'en') ||
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
    );
  } else {
    result.sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    );
  }

  const completedCount = items.filter((item) => item.completed).length;
  const totalQuantity = items
    .filter((item) => !item.completed)
    .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    items: result,
    summary: {
      // BUG count-inflated: done rows are counted a second time. Correct until something is done.
      itemCount: items.length + completedCount,
      showing: result.length,
      totalQuantity,
      allCompleted: items.length > 0 && completedCount === items.length,
    },
  };
}

export function addItem(items, body) {
  if (typeof body.name !== 'string') return fail(400, 'Enter an item name.');
  // BUG blank-name: empty and whitespace-only names are stored.
  if (body.name.length > 80) return fail(400, 'Item names must be 80 characters or fewer.');
  if (!CATEGORIES.includes(body.category)) return fail(400, 'Pick a category.');

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return fail(400, 'Quantity must be a whole number from 1 to 99.');
  }

  const notes = typeof body.notes === 'string' ? body.notes : '';
  if (notes.length > 200) return fail(400, 'Notes must be 200 characters or fewer.');

  const item = {
    id: crypto.randomUUID(),
    name: body.name,
    quantity: String(quantity),
    category: body.category,
    // BUG notes-truncated: notes are stored at 12 characters.
    notes: notes.slice(0, 12),
    completed: false,
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  return { ok: true, item };
}

export function patchItem(items, id, body) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return fail(404, 'Item not found.');

  let category;
  let notes;
  let quantity;

  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) return fail(400, 'Pick a category.');
    category = body.category;
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string' || body.notes.length > 200) {
      return fail(400, 'Notes must be 200 characters or fewer.');
    }
    notes = body.notes.slice(0, 12);
  }

  if (body.quantity !== undefined) {
    const next = Number(body.quantity);
    if (!Number.isInteger(next) || next < 1 || next > 99) {
      return fail(400, 'Quantity must be a whole number from 1 to 99.');
    }
    quantity = String(next);
  }

  if (category !== undefined) item.category = category;
  if (notes !== undefined) item.notes = notes;
  if (quantity !== undefined) item.quantity = quantity;

  // BUG toggle-neighbor: the checkbox flips the next row and leaves this one alone.
  if (body.completed !== undefined) {
    const other = neighbor(items, id);
    other.completed = !other.completed;
  }

  // BUG edit-ignores-name: a new name is accepted by the request and discarded.
  return { ok: true, item };
}

export function stepQuantity(items, id, direction) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return fail(404, 'Item not found.');

  if (direction === 'up') {
    // BUG quantity-concat: plus appends the character 1. Capped so a stuck click cannot grow forever.
    if (String(item.quantity).length < 12) item.quantity = `${item.quantity}1`;
    return { ok: true, item };
  }

  if (direction === 'down') {
    const prev = Number(item.quantity);
    const next = Math.max(1, (Number.isFinite(prev) ? Math.floor(prev) : 1) - 1);
    item.quantity = String(next);
    return { ok: true, item };
  }

  return fail(400, 'Unknown direction.');
}

export function deleteItem(items, id) {
  const list = ordered(items);
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return fail(404, 'Item not found.');
  // BUG delete-neighbor: remove the next row. With one row, the next row is itself.
  const victim = list[(index + 1) % list.length];
  const at = items.findIndex((item) => item.id === victim.id);
  const [removed] = items.splice(at, 1);
  return { ok: true, removed };
}

export function clearCompleted(items) {
  // BUG clear-produce-only: done rows outside Produce are left in place.
  const kept = items.filter((item) => !(item.completed && item.category === 'Produce'));
  items.splice(0, items.length, ...kept);
  return { ok: true };
}

export function toggleAll(items) {
  const list = ordered(items);
  const markDone = items.length > 0 && !items.every((item) => item.completed);
  // BUG toggle-all-partial: only even positions in Newest order change.
  list.forEach((item, index) => {
    if (index % 2 === 0) item.completed = markDone;
  });
  return { ok: true };
}
