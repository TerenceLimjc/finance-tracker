# Finance Tracker UI Design Spec (Monthly Review Focus)

**Date:** March 15, 2026
**Primary Use Case:** Monthly statement reviews on desktop with hundreds of transactions
**Framework:** Ant Design 6.x + @ant-design/charts
**Navigation:** Sidebar with two sections — Dashboard (default), Uploads

---

## Screen 1: Dashboard (Monthly Review)

### Layout — Normal State

```
+------------------+---------------------------------------------------------------+
|                  |  Monthly Review                                               |
|  Dashboard  <--  |  [< March 2026 >v]   [Start - End]   [Search...]              |
|                  +---------------------------------------------------------------+
|  Uploads         |  Total: $2,847   |   Trans: 156   |   +$127 (+4.7%) vs Feb    |
|                  +---------------------------------------------------------------+
|                  |  +----------------------------------------------------------+ |
|                  |  |  Spending by Category                                    | |
|                  |  |                                                          | |
|                  |  |  [Pie chart]     Food/Dining   $423 * 35%  --------      | |
|                  |  |                  Transport     $298 * 25%  ------        | |
|                  |  |                  Shopping      $267 * 22%  -----         | |
|                  |  |                  Bills         $189 * 16%  ----          | |
|                  |  |                  Entertainment  $98 *  8%  --            | |
|                  |  |                                                          | |
|                  |  |  Click a slice or legend row to filter transactions      | |
|                  |  +----------------------------------------------------------+ |
|                  +---------------------------------------------------------------+
|                  |  Transactions                                                 |
|                  |  +-----+------------+------------------------+-----------+    |
|                  |  | Cat | Date     v | Description            | Amount  v |    |
|                  |  +-----+------------+------------------------+-----------+    |
|                  |  | v   | 3/15/26    | McDonald's             |    -$12   |    |
|                  |  | v   | 3/14/26    | Shell Gas              |    -$45   |    |
|                  |  | v   | 3/14/26    | Walmart Grocery        |   -$127   |    |
|                  |  | v   | 3/13/26    | Electric Bill          |    -$89   |    |
|                  |  | v   | 3/13/26    | Starbucks              |     -$4   |    |
|                  |  | v   | 3/12/26    | Metro Card             |     -$3   |    |
|                  |  +-----+------------+------------------------+-----------+    |
|                  |  [25 per page v]         [Page 1 of 7]   [<< 1 2 3 ... >>]    |
+------------------+---------------------------------------------------------------+
```

Notes:
- Left sidebar (narrow, fixed): holds navigation only. `<--` marks the active section.
- `[< March 2026 >]`: arrows step prev/next month; the label opens a dropdown for arbitrary jumps.
- `v` in the Cat column: click to open an inline dropdown to reassign the category.
- `v` on Date / Amount column headers: click to sort ascending/descending.
- Table header row stays **sticky** while scrolling (`Table scroll.y`).

---

### Layout — Empty State (no data uploaded yet)

```
+------------------+---------------------------------------------------------------+
|  Dashboard  <--  |                                                               |
|                  |                  [folder icon]                                |
|  Uploads         |             No transactions yet                               |
|                  |        Upload a bank statement to get started                 |
|                  |             [ --> Go to Uploads ]                             |
|                  |                                                               |
+------------------+---------------------------------------------------------------+
```

---

### Layout — Processing Banner (file still in progress)

```
+------------------------------------------------------------------------------+
|  [!]  Chase_March.pdf is still processing — data may be incomplete.   [x]   |
+------------------------------------------------------------------------------+
```

- Yellow `Alert` banner sits between the top header and the summary row.
- Auto-dismisses once processing completes; user can manually close with [x].

---

### Layout — Active Category Filter

```
|                  |  Transactions   [ Food/Dining x ]                             |
|                  |  +-----+------------+------------------------+-----------+    |
|                  |  | Cat | Date     v | Description            | Amount  v |    |
|                  |  +-----+------------+------------------------+-----------+    |
|                  |  | v   | 3/15/26    | McDonald's             |    -$12   |    |
|                  |  | v   | 3/13/26    | Starbucks              |     -$4   |    |
|                  |  +-----+------------+------------------------+-----------+    |
```

- Active filter shown as a dismissible `Tag` pill above the table.
- Non-selected pie slices dim to 30% opacity.
- Click [x] on the tag, or click the active slice again, to clear the filter.

---

### Interaction Notes
- Pie chart legend shows **category name, dollar amount, and percentage** per slice.
- **Inline category edit**: click the `v` arrow in the Cat cell to open a dropdown, pick a new category, saves immediately.
- Duplicate detection: if a file with an overlapping date range is uploaded, the row shows a yellow warning badge "Possible duplicate" in Upload History.
- Column headers sort by date or amount; table header is sticky on scroll.
- Hover tooltips on pie slices show full breakdown details.
- Keyboard: Ctrl+F focuses search, arrow keys navigate table rows, Enter opens category dropdown on selected row, Esc cancels.

---

### Components (Ant Design 6.x)
- `Layout` + `Layout.Sider`, `Menu` for sidebar navigation
- `Select` (month dropdown) + prev/next `Button` arrows for month navigation
- `DatePicker.RangePicker` for custom date range
- `Card` for summary stats and chart container
- `@ant-design/charts` `Pie` for category visualization (label shows name + $ + %)
- `Table` with `scroll.y` (sticky header), pagination, and sortable columns
- `Select` inline in Cat cell for category reassignment
- `Tag` (closable) for active filter indicator above the table
- `Alert` type="warning" for the processing banner
- `Input.Search` for transaction search
- `Empty` component for the empty state with a CTA button

---

## Screen 2: Uploads

### Layout

```
+------------------+---------------------------------------------------------------+
|                  |  File Upload & Management                                     |
|  Dashboard       |                                                               |
|                  |  +--------------------------------------------------------+   |
|  Uploads    <--  |  |  Drag & Drop Bank Statements                           |   |
|                  |  |                                                        |   |
|                  |  |       [folder icon]  Drop files here                   |   |
|                  |  |                      or click to browse                |   |
|                  |  |                                                        |   |
|                  |  |  Formats: PDF, CSV, Excel, OFX, QIF                    |   |
|                  |  |  Max size: 50MB per file                               |   |
|                  |  +--------------------------------------------------------+   |
|                  |                                                               |
|                  |  Upload History                                               |
|                  |  +----+---------------------+---------+-------+-----------+   |
|                  |  | v  | File Name           | Status  | Trans | Action    |   |
|                  |  +----+---------------------+---------+-------+-----------+   |
|                  |  | [] | Bank_Statement_Feb  | Done    |  127  | [Delete]  |   |
|                  |  | [] | Chase_March.pdf     | [====]  |   --  | [Stop]    |   |
|                  |  | [] | Expenses_Q1.csv     | Done    |   89  | [Delete]  |   |
|                  |  | [] | Invalid_File.txt    | Failed  |    0  | [Retry]   |   |
|                  |  | [] | March_Dupe.pdf      | [!] Possible duplicate      |   |
|                  |  +----+---------------------+---------+-------+-----------+   |
|                  |  [Delete Selected]   [Refresh]                                |
+------------------+---------------------------------------------------------------+
```

Notes:
- `<--` marks Uploads as the active sidebar item.
- Status column uses Ant Design `Tag`: green "Done", blue progress bar for processing, red "Failed".
- `[!] Possible duplicate` row: yellow warning tag when the file's date range overlaps an already-processed file.
- `[Delete]` triggers an Ant Design `Popconfirm` before removing.

---

### Components
- `Upload.Dragger` for the drag-and-drop area
- `Table` with row selection checkboxes and status `Tag` / `Progress`
- `Button` for Delete, Stop, Retry actions
- `Popconfirm` before any destructive delete action
- `Badge` or `Tag` type="warning" for duplicate detection

---

## Visual Style & Accessibility
- **Color palette:** Financial blues/greens for primary actions; consistent category colors across chart slices and table Cat cells.
- **Typography:** Ant Design typography hierarchy; monospace font for currency amounts.
- **Contrast:** WCAG AA minimum (4.5:1) for all text.
- **Focus states:** Visible outlines on all interactive elements; full keyboard navigation.
- **Responsive:** Sidebar collapses to icon-only on smaller screens; layout gracefully degrades.

---

## Interaction Flow (Monthly Review)

```
1)  Upload statement     ->  Uploads tab, drag and drop file
2)  Auto-process         ->  Progress bar in Upload History; banner on Dashboard if still running
3)  Go to Dashboard      ->  Current month auto-selected; empty state shown if nothing processed yet
4)  Review pie chart     ->  Click category slice or legend row to filter transactions below
5)  Fix categories       ->  Click v in Cat column, pick correct category from dropdown
6)  Page through data    ->  25 rows/page; sort by date or amount as needed
7)  Next month           ->  Click > arrow or pick from month dropdown
```

---

## Non-Goals (Excluded)
- Export / report generation
- AI insights or predictions
- Complex budgeting / goal tracking
- Multi-account management

---

## Acceptance Criteria (UI)
- Sidebar is a fixed vertical left rail; active section marked with a highlight.
- Dashboard shows category pie chart with name, $ value, and % on each legend entry.
- Category slice / legend click filters the transaction table; active filter shown as a dismissible Tag.
- Processing banner (yellow Alert) appears on Dashboard when a file is still being processed.
- Empty state shown with a CTA when no transactions exist yet.
- Transaction table header is sticky; columns sortable by Date and Amount.
- Cat column supports inline category reassignment via a Select dropdown.
- Pagination defaults to 25 rows/page.
- Month selector supports prev/next arrow navigation and dropdown jump.
- Uploads view: drag-and-drop works, status shown per file, duplicate files flagged with a warning tag.
- All critical interactions keyboard-accessible (search focus, table nav, category edit, Esc to cancel).
