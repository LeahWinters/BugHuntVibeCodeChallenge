import { AREAS, CATEGORIES, SEVERITIES } from './constants.js';

export const spec = {
  product: 'Market List',
  version: '0.9.4-rc',
  summary:
    'A personal grocery list. This is the contract for the build under test. If the product disagrees with a line here, that is a defect.',
  categories: CATEGORIES,
  areas: AREAS,
  severities: [
    { id: 'low', label: 'Low', hint: 'Easy to work around, or a small lie in the UI' },
    { id: 'medium', label: 'Medium', hint: 'Wrong result, but another path still works' },
    { id: 'high', label: 'High', hint: 'A core task fails, or the list lies about your data' },
  ],
  rules: [
    {
      id: 'adding',
      title: 'Adding items',
      points: [
        'An item has a name, a category, a quantity, and an optional note. Add creates one row.',
        'The name is required. An empty name, or a name made only of spaces, is rejected and no row is created.',
        'The same name may be added more than once. Each Add creates its own row.',
        'Names are stored as typed, up to 80 characters.',
      ],
    },
    {
      id: 'notes',
      title: 'Notes',
      points: [
        'Note is optional.',
        'A note may be up to 200 characters and is stored in full, both when you add a row and when you save an edit.',
        'Saving a change to the name or quantity does not alter the note, unless you changed the note yourself.',
      ],
    },
    {
      id: 'quantities',
      title: 'Quantities',
      points: [
        'Quantity is a whole number from 1 to 99.',
        '+ increases that row’s quantity by exactly 1.',
        '− decreases that row’s quantity by exactly 1 and never takes it below 1.',
        'Edit can set an exact quantity. Save stores that number.',
      ],
    },
    {
      id: 'completing',
      title: 'Completing items',
      points: [
        'The checkbox changes only the row you clicked. It marks that row done, or returns it to not done.',
        'Mark all done marks every row done.',
        'When every row is already done, that button reads Mark all not done and marks every row not done.',
      ],
    },
    {
      id: 'clear',
      title: 'Clear completed',
      points: [
        'Clear completed deletes every done row, in every category.',
        'Rows that are not done stay on the list, notes and quantities included.',
      ],
    },
    {
      id: 'editing',
      title: 'Editing',
      points: [
        'Edit can change the name, category, quantity, and note of that row.',
        'Save keeps every change you made. Cancel throws them away.',
      ],
    },
    {
      id: 'deleting',
      title: 'Deleting',
      points: ['Delete removes the row whose Delete button you clicked, and no other row.'],
    },
    {
      id: 'finding',
      title: 'Search, filters, and sort',
      points: [
        'Search matches item names and ignores capitalization. It does not match category names or notes.',
        'Category shows the rows in the chosen category. All shows every category. Dairy shows dairy items.',
        'Show: Still to buy shows rows that are not done. Done shows rows that are done. All shows both.',
        'Sort Newest puts the most recently added row first. The sample list starts in that order.',
        'Sort Name orders rows A to Z by item name.',
        'Sort Category orders rows A to Z by category, then by item name.',
      ],
    },
    {
      id: 'counts',
      title: 'Counts',
      points: [
        'Items is the number of rows on the list, done or not. Checking a row off does not change Items. Adding or deleting a row does.',
        'Items ignores Search, Category, and Show.',
        'Showing is how many rows match the current Search, Category, and Show.',
        'Units to buy adds up the quantities of rows that are not done.',
      ],
    },
  ],
};

export function publicSpec() {
  return {
    ...spec,
    severities: spec.severities.filter((item) => SEVERITIES.includes(item.id)),
  };
}
