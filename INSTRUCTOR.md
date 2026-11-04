# Instructor notes

Market List 0.9.4-rc has **12 planted defects**. The spec in the app is the contract testers should use. Do not read this file aloud before the debrief.

Defects are implemented in `server/listService.js`. The answer key and the report matcher live in `server/catalog.js`. `npm test` asserts the broken behavior on purpose. If you repair a defect, change the matching test too.

## Scoring

- Low 100, medium 200, high 300.
- +50 when the report’s area matches, +50 when the severity matches.
- A report confirms only when it describes a single unfound defect. Vague reports come back unconfirmed. A report that fits two defects is rejected so they file them separately.
- The in-app key stays hidden until someone opens it. Opening it stops new reports for that hunt.

## The twelve defects

1. **Empty item names are saved** (Adding items, medium). Add with a blank name, or only spaces. A row is created.
2. **Notes are silently cut to 12 characters** (Notes, medium). Add “Get the ripe ones”, or edit Spinach (“Organic, bunch”) and save. The note becomes “Get the ripe” or “Organic, bun”.
3. **Plus appends a digit instead of adding 1** (Quantities, high). + on Whole milk turns 1 into 11, then 111. Minus still subtracts 1. A quantity typed in Edit is stored exactly.
4. **The checkbox updates the next row** (Completing, high). On Newest, checking Whole milk flips Eggs and leaves milk alone. Checking the last row flips the first row.
5. **Mark all done only updates every other row** (Completing, medium). In Newest order, only Whole milk, Bananas, Sourdough, and Ice cream change. The button stays “Mark all done”.
6. **Clear completed only removes Produce** (Clear completed, medium). After Mark all done, Clear completed removes Bananas and leaves the other done rows.
7. **Delete removes the next row** (Deleting, high). Delete on Whole milk removes Eggs. Delete on the last row removes the first. A one-row list deletes that row.
8. **Saving an edit drops the new name** (Editing, medium). Rename Whole milk to Oat milk and save. The name stays. Category and quantity changes do save.
9. **Search matches the category, not the item name** (Search, medium). `banana` finds nothing. `Dairy` returns the dairy rows. `dairy` finds nothing. Notes are not searched, which matches the spec.
10. **The Dairy category filter matches nothing** (Filters, medium). Category Dairy is an empty list. Milk and eggs still show under All. Other categories filter correctly.
11. **Still to buy and Done are swapped** (Filters, high). Still to buy shows done rows. Done shows rows that are not done. All is fine.
12. **Items counts every done row twice** (Counts, low). The sample list reads 8. Each done row increases Items by one extra. Eight rows with one done reads 9. Showing still matches the visible rows.

## Behavior that should keep working

Use these when someone files a report against something that matches the spec.

- Duplicate names are allowed.
- Minus decreases by 1 and stops at 1.
- Edit stores an exact quantity and a new category.
- Category filters other than Dairy work.
- Newest, Name (A to Z), and Category sorts match the spec.
- Search does not look at notes.
- Items is correct until a row is done, and it ignores filters.
- Units to buy sums the quantities of rows that are not done.
- Delete removes the row when it is the only one left.

Checkbox and Delete follow Newest order, not whatever sort is currently on screen. If a tester sorted first, ask them to set Sort back to Newest and try again before the debrief.
