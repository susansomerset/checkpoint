# Spec Fixlog

This log tracks **corrections and modifications** to already-implemented spec nodes in `spec/current.json`.

**Scope:** Only log changes/fixes to specs that have been implemented and committed. Initial implementations are tracked in git history and delivery notes, not here.

---

## 2025-10-01 – Empty cells show nothing instead of em dash

**Issue/Context:**  
PO review found that empty cells were displaying "—" which added visual noise to the grid.

**Affected Spec Nodes:**  
- `ui.WeeklyGrid@1.0.1`

**Resolution:**  
- Updated spec rendering rules: empty cells return `null` instead of placeholder text
- Changed `renderGridItems` and `renderNoDate` functions accordingly
- Empty cells now render completely blank

**Commit:**  
(pending)

**Notes:**  
Visual improvement requested during PO review of /assignments page.

---

## 2025-10-01 – Student header displays studentId instead of preferredName

**Issue/Context:**  
PO review found that WeeklyGrid student header row displays "Student: S1" (studentId) instead of the student's preferred name. Additionally, the UI component was "smart" - it was building the header string from passed data instead of just rendering pre-formatted content.

**Affected Spec Nodes:**  
- `processing.getWeeklyGrids@1.0.2` → `@1.0.3`
- `ui.WeeklyGrid@1.0.1` → `@1.0.2`

**Resolution:**  
**Compose layer (`getWeeklyGrids`):**
- Added `studentHeader: string` field to `WeeklyGridHeader` output
- Format: `"${preferredName || legalName || studentId} — ⚠️:W / ❓:Q / 👍:T / ✅:C"`
- Compose layer now responsible for all header text formatting

**UI layer (`WeeklyGrid`):**
- Removed `formatAttentionSummary()` helper function (logic moved to compose)
- Render `header.studentHeader` as-is in a `<th colSpan={9}>` row above column headers
- UI is now pure presentation - no formatting logic

**Architectural improvement:**
- Follows "compose thinks, UI renders" principle
- Student header is part of grid.header structure (semantic grouping)
- UI component has zero business logic

**Commit:**  
4a65b7e

**Notes:**  
Student header now appears above column headers in table structure. UI automatically spans full width using colSpan.
