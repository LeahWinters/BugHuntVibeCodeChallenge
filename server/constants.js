export const CATEGORIES = ['Produce', 'Dairy', 'Bakery', 'Pantry', 'Frozen', 'Other'];

export const AREAS = [
  'Adding items',
  'Quantities',
  'Completing',
  'Clear completed',
  'Editing',
  'Deleting',
  'Search',
  'Filters',
  'Sorting',
  'Notes',
  'Counts',
];

export const SEVERITIES = ['low', 'medium', 'high'];

export const SEVERITY_POINTS = {
  low: 100,
  medium: 200,
  high: 300,
};

export const AREA_BONUS = 50;
export const SEVERITY_BONUS = 50;

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
