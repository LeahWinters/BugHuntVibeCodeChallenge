import { SEVERITY_POINTS } from './constants.js';

// Answer key and the phrases a report must contain before it counts.
// Gates are AND of OR-groups. Banned phrases reject a gate even if the groups hit.
export const bugs = [
  {
    id: 'blank-name',
    title: 'Empty item names are saved',
    area: 'Adding items',
    severity: 'medium',
    steps: 'Leave Item empty, or type only spaces, and press Add.',
    expected: 'The add is rejected and no row is created.',
    actual: 'A row is created with a blank name. Spaces are kept as the name too.',
    gate: [
      ['blank', 'empty name', 'no name', 'without a name', 'only spaces', 'just spaces', 'whitespace', 'missing name', 'name is empty'],
      ['add', 'added', 'save', 'saved', 'create', 'created', 'submit', 'accepted', 'allowed'],
    ],
  },
  {
    id: 'notes-truncated',
    title: 'Notes are silently cut to 12 characters',
    area: 'Notes',
    severity: 'medium',
    steps:
      'Add a row with a note longer than 12 characters, such as “Get the ripe ones”. Or edit Spinach (note: “Organic, bunch”) and press Save without shortening it.',
    expected: 'The full note is stored, up to 200 characters.',
    actual:
      'The note is cut to the first 12 characters with no warning. “Get the ripe ones” becomes “Get the ripe”. “Organic, bunch” becomes “Organic, bun”.',
    gate: [
      ['note'],
      ['12', 'truncat', 'cut off', 'cut short', 'chopped', 'shortened', 'characters were', 'first 12'],
    ],
  },
  {
    id: 'quantity-concat',
    title: 'Plus appends a digit instead of adding 1',
    area: 'Quantities',
    severity: 'high',
    steps: 'Press + on Whole milk, which starts at 1. Press + again. Compare with − on a normal quantity such as Eggs.',
    expected: '+ changes 1 to 2, then 3. − decreases by 1 and stops at 1. A quantity typed in Edit is stored as typed.',
    actual:
      '+ changes 1 to 11, then 111. It glues a “1” onto the end. − still subtracts 1 from the numeric value, and Edit still stores an exact quantity.',
    gate: [
      ['quantity', '+', 'plus', 'increment', 'increase'],
      ['11', '111', '121', 'concat', 'append', 'digit', 'to the end', 'extra 1'],
    ],
  },
  {
    id: 'toggle-neighbor',
    title: 'The checkbox updates the next row',
    area: 'Completing',
    severity: 'high',
    steps:
      'With Sort on Newest, check Whole milk. Then check the last row, Coffee beans.',
    expected: 'Only the row you click changes. It becomes done, or not done if it already was.',
    actual:
      'The row you click stays as it was. The next row in Newest order flips instead. The last row flips the first row.',
    gate: [
      ['checkbox', 'checking the', 'checked the', 'check off', 'uncheck'],
      ['instead', 'another', 'different', 'next row', 'other row', 'wrong row', 'wrong item', 'not the one', 'not the row'],
    ],
    banned: ['mark all', 'marked all', 'marking all', 'toggle all', 'clear completed'],
  },
  {
    id: 'toggle-all-partial',
    title: 'Mark all done only updates every other row',
    area: 'Completing',
    severity: 'medium',
    steps: 'On the sample list, with Sort on Newest, click Mark all done.',
    expected: 'Every row becomes done, and the button changes to Mark all not done.',
    actual:
      'Only every other row in Newest order changes, starting with the first: Whole milk, Bananas, Sourdough, and Ice cream. Eggs, Spinach, Jasmine rice, and Coffee beans stay as they were. The button keeps reading Mark all done. The current on-screen sort is ignored; Newest order is what counts.',
    gate: [
      ['mark all', 'marked all', 'marking all', 'toggle all'],
      ['every other', 'not all', 'skipped', 'stayed', 'remain', 'remained', 'left alone', 'only some', 'half', 'odd row', 'even row'],
    ],
  },
  {
    id: 'clear-produce-only',
    title: 'Clear completed only removes Produce',
    area: 'Clear completed',
    severity: 'medium',
    steps:
      'Get one Produce row and one non-Produce row into the done state. Mark all done is enough: it marks Whole milk, Bananas, Sourdough, and Ice cream. Then click Clear completed.',
    expected: 'Every done row is deleted, in every category. Rows that are not done stay.',
    actual:
      'Only done rows in Produce are deleted. Bananas disappears. Done rows in other categories, such as Whole milk, stay on the list.',
    gate: [
      ['clear completed', 'clear done'],
      ['produce', 'stayed', 'remained', 'not all', 'only removed', 'left behind', 'still on', 'not removed', 'other categor'],
    ],
  },
  {
    id: 'delete-neighbor',
    title: 'Delete removes the next row',
    area: 'Deleting',
    severity: 'high',
    steps: 'Click Delete on Whole milk. To see the wrap, click Delete on the last row.',
    expected: 'The row whose Delete button you clicked is removed. Other rows stay.',
    actual:
      'The next row in Newest order is removed. Whole milk stays and Eggs disappears. Deleting the last row removes the first row. A list with one row deletes that row.',
    gate: [
      ['delete', 'deleted', 'remove', 'removed'],
      ['instead', 'another', 'different', 'next row', 'other row', 'wrong row', 'wrong item', 'not the one', 'not the row'],
    ],
    banned: ['clear completed', 'clear done'],
  },
  {
    id: 'edit-ignores-name',
    title: 'Saving an edit drops the new name',
    area: 'Editing',
    severity: 'medium',
    steps: 'Edit Whole milk, change the name to Oat milk, and press Save. Try a category or quantity change on its own as a comparison.',
    expected: 'The new name is kept, along with any category, quantity, and note changes.',
    actual:
      'The name stays Whole milk. Category and quantity changes are kept. The name you typed is discarded with no error.',
    gate: [
      ['rename', 'renamed', 'renaming', 'new name', 'new item name', 'changed the name', 'change the name', 'name change'],
      ['stayed', 'unchanged', 'reverted', 'ignored', 'not saved', 'did not save', 'didnt save', 'does not save', 'doesnt save', 'snaps back', 'still named', 'not updated'],
    ],
  },
  {
    id: 'search-wrong-field',
    title: 'Search matches the category, not the item name',
    area: 'Search',
    severity: 'medium',
    steps: 'Search for banana. Then search for Dairy, and try dairy in lowercase.',
    expected:
      'Search matches item names and ignores capitalization. banana matches Bananas. It does not match category names, so Dairy matches nothing.',
    actual:
      'Search is case-sensitive and compares the category only. banana matches nothing. Dairy returns the Dairy rows. dairy in lowercase matches nothing.',
    gate: [
      ['search', 'searched', 'searching'],
      ['categor', 'item name', 'case sensitive', 'case insensitive', 'capital', 'lowercase', 'uppercase', 'not by name'],
    ],
  },
  {
    id: 'dairy-filter',
    title: 'The Dairy category filter matches nothing',
    area: 'Filters',
    severity: 'medium',
    steps: 'Set Category to Dairy. Then set Category back to All.',
    expected: 'Dairy shows Whole milk and Eggs. All shows every row again.',
    actual:
      'Dairy shows an empty list, even though Whole milk and Eggs are Dairy and still appear under All. Other categories filter correctly.',
    gate: [
      ['dairy'],
      ['filter', 'category'],
      ['empty', 'nothing', 'no items', 'no rows', 'none', 'does not show', 'doesnt show', 'not listed', 'missing', 'zero'],
    ],
  },
  {
    id: 'status-inverted',
    title: 'Still to buy and Done are swapped',
    area: 'Filters',
    severity: 'high',
    steps: 'Mark at least one row done. Set Show to Still to buy, then to Done.',
    expected: 'Still to buy shows rows that are not done. Done shows only done rows.',
    actual: 'The two options are swapped. Still to buy shows done rows. Done shows rows that are not done. All is fine.',
    gate: [
      ['still to buy', 'done filter', 'status filter', 'status filters', 'show filter'],
      ['swapped', 'backward', 'backwards', 'opposite', 'inverted', 'reversed', 'already done'],
    ],
  },
  {
    id: 'count-inflated',
    title: 'Items counts every done row twice',
    area: 'Counts',
    severity: 'low',
    steps: 'Read Items on the sample list (8). Mark one row done without adding or deleting a row.',
    expected: 'Items stays 8. It counts rows, done or not, and it ignores the filters. Showing still matches the visible rows.',
    actual:
      'Items is the number of rows plus the number of done rows. One done row makes Items read 9 while 8 rows are still on the list. Showing and Units to buy do not have this problem.',
    gate: [
      ['item count', 'items count', 'items total', 'items number', 'number of items', 'the items count'],
      ['higher', 'too high', 'too many', 'more than', 'went up', 'increased', 'does not match', 'doesnt match', 'not equal', 'extra', 'double', 'off by'],
    ],
  },
];

export function presentBug(bug) {
  return {
    id: bug.id,
    title: bug.title,
    area: bug.area,
    severity: bug.severity,
    points: SEVERITY_POINTS[bug.severity],
    maxPoints: SEVERITY_POINTS[bug.severity] + 100,
    steps: bug.steps,
    expected: bug.expected,
    actual: bug.actual,
  };
}
