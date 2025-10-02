# ui.TableDetail Spec Review & Proposed Revision

**Date:** October 2, 2025  
**From:** Chuckles  
**To:** Vern & Susan  
**Re:** Reviewing ui.TableDetail spec against lessons learned

---

## Original Spec (from Susan's message)

The original spec had these key features:
- Self-contained filtering (course, status, keyword)
- Self-contained sorting (clickable headers)
- Renders table with 11 columns
- "View JSON" action per row
- Derives filter options from rows (unique courses/statuses)
- Resets filters when selectedStudentId changes

---

## Issues & Improvements Based on Lessons Learned

### **Issue 1: "View JSON" action undefined**

**Original spec:**
```
"Row action: 'View JSON' opens a modal showing row.raw (pretty-printed, scrollable, copyable)."
```

**Problem:** 
- We removed `row.raw` field per Vern's design
- No mention of HOW to trigger modal (button? icon? column?)
- No connection to ui.DetailModal component

**Proposed Fix:**
- Add explicit "View" column (12th column, first position)
- Render 🔍 magnifier icon/button
- Pass `{studentId, courseId, assignmentId}` to DetailModal
- DetailModal uses `useRawDetailSnapshot` hook internally

---

### **Issue 2: Filter/sort state reset logic unclear**

**Original spec:**
```
"When selectedStudentId changes, reset all local state to defaults."
```

**Problem:**
- How does the component KNOW when selectedStudentId changes?
- Does it receive it as a prop? Compare via useEffect?
- What if rows change but selectedStudentId doesn't?

**Proposed Fix:**
Add `selectedStudentId` to props signature:
```json
"input": {
  "rows[]": {...},
  "headers": [...],
  "selectedStudentId": "string",
  "initialSort?": {...}
}
```

Use `useEffect(() => { resetFilters(); }, [selectedStudentId])` to detect changes.

---

### **Issue 3: "Points" column formatting ambiguous**

**Original spec:**
```
"Points → 'pointsGraded / pointsPossible' (single value if only one exists; '-' if both missing)"
```

**Ambiguity:**
- What if `pointsGraded=0` and `pointsPossible=10`? → "0 / 10" ✅
- What if `pointsGraded=5` and `pointsPossible=undefined`? → "5" or "5 / -"?
- What if both are `undefined`? → "-" ✅

**Proposed Clarification:**
```
Points cell logic:
- If both present: "pointsGraded / pointsPossible" (e.g., "8 / 10")
- If only pointsGraded: pointsGraded (e.g., "8")
- If only pointsPossible: "- / pointsPossible" (e.g., "- / 10")
- If both missing/undefined: "-"
```

---

### **Issue 4: Headers array redundant?**

**Original spec:**
```
"input": {
  "headers": [
    "Student","Course","Teacher","Assignment","Status",
    "Points","Grade","%","Due","Turned in","Graded on"
  ]
}
```

**Question:**
- Headers are STATIC (always the same 11 items)
- Why pass as prop instead of hardcoding in component?
- compose.detailData already returns headers

**Options:**
- **A:** Keep headers as prop (flexibility for future)
- **B:** Hardcode in component (simpler, headers won't change)

**My Take:** Keep as prop for now (matches compose output), but consider hardcoding later if they truly never change.

---

### **Issue 5: Keyword search fields missing row.raw**

**Original spec:**
```
"Keyword q: tokenize by whitespace; all tokens must match (case-insensitive) against assignmentName, courseShortName, teacherName, checkpointStatus, studentPreferredName, and date fields (dueAtDisplay, submittedAtDisplay, gradedAtDisplay) and/or ISO fields (dueAtISO, submittedAtISO, gradedAtISO)."
```

**Problem:**
- This is comprehensive! ✅
- But no mention of searching by IDs (studentId, courseId, assignmentId)

**Proposed Addition:**
Add IDs to searchable fields: "...and ID fields (studentId, courseId, assignmentId)."

---

### **Issue 6: Missing "View" column in headers**

**Original spec headers:**
```
["Student","Course","Teacher","Assignment","Status","Points","Grade","%","Due","Turned in","Graded on"]
```

That's 11 columns, but there's NO "View" column for the magnifier icon.

**Options:**
- **A:** Add "View" as 12th column (end of row)
- **B:** Add "" (empty header) as 1st column (icon-only, no label)
- **C:** Add "Actions" as 12th column (more flexible for future actions)

**My Recommendation:** **Option C** - Add "Actions" as 12th column
```
["Student","Course","Teacher","Assignment","Status","Points","Grade","%","Due","Turned in","Graded on","Actions"]
```

This makes it clear there's an actions column, and we can add more actions later if needed.

---

### **Issue 7: Accessibility - table caption missing**

**Original spec:**
```
"Semantic table with <thead>/<tbody> and <caption>."
```

**Good!** But what should the caption SAY?

**Proposed:**
```
<caption className="sr-only">
  Detail view: {rows.length} assignments for {selectedStudentId}
</caption>
```

Screen readers announce this, sighted users don't see it (sr-only).

---

### **Issue 8: Integration with DetailModal not spec'd**

**Missing from original:**
- How TableDetail and DetailModal work together
- Modal state management (which row is open?)
- Passing row data to modal

**Proposed Addition to spec:**
```json
"processing": {
  "pipeline": [
    {
      "id": "modal_state",
      "kind": "ui",
      "rules": [
        "Local state: modalRow:{studentId,courseId,assignmentId}|null.",
        "Click magnifier → setModalRow(row).",
        "DetailModal receives modalRow, isOpen=!!modalRow, onClose=()=>setModalRow(null)."
      ]
    }
  ]
}
```

---

## Revised Spec (Vern-quality)

```json
{
  "id": "ui.TableDetail",
  "version": "1.0.0",
  "kind": "ui",
  "title": "Detail table: self-contained filtering, sorting, rendering, and JSON modal",
  "deps": [
    "processing.getDetailRows@^1.0.0",
    "ui.DetailModal@^1.0.1"
  ],
  "contracts": {
    "touch": [
      { "$ref": "node:processing.getDetailRows@^1.0.0#contracts.produces.DetailRow" },
      { "$ref": "node:ui.DetailModal@^1.0.1#contracts.produces.component" }
    ],
    "produces": {
      "component": "React.FunctionComponent"
    }
  },
  "signature": {
    "input": {
      "headers": [
        "Student","Course","Teacher","Assignment","Status",
        "Points","Grade","%","Due","Turned in","Graded on","Actions"
      ],
      "rows[]": { "$ref": "node:processing.getDetailRows@^1.0.0#contracts.produces.DetailRow" },
      "selectedStudentId": "string",
      "initialSort?": { "by": "string", "dir": "enum[asc|desc]" }
    },
    "output": { "react": "JSX.Element" }
  },
  "processing": {
    "pipeline": [
      {
        "id": "derive_filter_options",
        "kind": "ui",
        "rules": [
          "Course options: unique by courseId → { courseId, label: '${courseShortName} (${teacherName})' }, sorted by label asc.",
          "Status options: unique set of checkpointStatus strings (open set, no restrictions), sorted alphabetically."
        ]
      },
      {
        "id": "local_state",
        "kind": "ui",
        "rules": [
          "Local state: selectedCourseIds:string[], selectedStatuses:string[], q:string, sort:{by,dir}, modalRow:{studentId,courseId,assignmentId}|null.",
          "Default sort: initialSort || {by:'Due', dir:'asc'}.",
          "When selectedStudentId changes (via useEffect), reset: selectedCourseIds=[], selectedStatuses=[], q='', sort=default, modalRow=null."
        ]
      },
      {
        "id": "filter_and_sort",
        "kind": "ui",
        "rules": [
          "Start from input rows.",
          "Course filter: if selectedCourseIds.length>0, keep rows where courseId ∈ selectedCourseIds.",
          "Status filter: if selectedStatuses.length>0, keep rows where checkpointStatus ∈ selectedStatuses.",
          "Keyword q: tokenize by whitespace; ALL tokens must match (case-insensitive) at least one of:",
          "  - assignmentName, courseShortName, teacherName, checkpointStatus, studentPreferredName",
          "  - Date displays: dueAtDisplay, submittedAtDisplay, gradedAtDisplay",
          "  - Date ISOs: dueAtISO, submittedAtISO, gradedAtISO",
          "  - IDs: studentId, courseId, assignmentId",
          "Stable sort by column key:",
          "  'Student'    → studentPreferredName (localeCompare)",
          "  'Course'     → courseShortName (localeCompare)",
          "  'Teacher'    → teacherName (localeCompare)",
          "  'Assignment' → assignmentName (localeCompare)",
          "  'Status'     → checkpointStatus (localeCompare)",
          "  'Points'     → pointsPossible (numeric; undefined last on asc, first on desc)",
          "  'Grade'      → pointsGraded (numeric)",
          "  '%'          → gradePct (numeric; undefined last on asc, first on desc)",
          "  'Due'        → dueAtISO (chronological; undefined last on asc, first on desc)",
          "  'Turned in'  → submittedAtISO (chronological; undefined last/first)",
          "  'Graded on'  → gradedAtISO (chronological; undefined last/first)",
          "Toggle sort direction on repeated header clicks."
        ]
      },
      {
        "id": "render_filters",
        "kind": "ui",
        "rules": [
          "Filter row above table:",
          "  Course multi-select dropdown (show selected count when >0: 'Courses (2)').",
          "  Status multi-select dropdown (show selected count: 'Statuses (1)').",
          "  Keyword search input (placeholder: 'Search assignments, courses, teachers, IDs…').",
          "  Clear Filters button (visible only when any filter active).",
          "Show filtered row count: 'Showing X of Y assignments'."
        ]
      },
      {
        "id": "render_table",
        "kind": "ui",
        "rules": [
          "Semantic <table> with <caption>, <thead>, <tbody>.",
          "Caption (sr-only): 'Detail view: {Y} total assignments for {selectedStudentId}'.",
          "Column headers from props.headers (12 items); clicking toggles sort.",
          "Show sort indicator (↑/↓) on active sort column.",
          "Cells:",
          "  Student → studentPreferredName",
          "  Course → courseShortName",
          "  Teacher → teacherName",
          "  Assignment → <a href=assignmentUrl target=_blank rel=noopener>{assignmentName}</a>",
          "  Status → checkpointStatus",
          "  Points → if both present: 'pointsGraded / pointsPossible'; if only one: that value; if both undefined: '-'",
          "  Grade → pointsGraded or '-'",
          "  % → gradePct + '%' or '-'",
          "  Due/Turned in/Graded on → *Display fields or '-'",
          "  Actions → 🔍 magnifier button (aria-label='View assignment details') opens DetailModal",
          "Empty state (after filters): 'No assignments match your filters.'",
          "Empty state (no rows): 'No assignments found.'"
        ]
      },
      {
        "id": "modal_integration",
        "kind": "ui",
        "rules": [
          "Import DetailModal component.",
          "Render <DetailModal row={modalRow} isOpen={!!modalRow} onClose={()=>setModalRow(null)} />.",
          "Magnifier click → setModalRow({studentId, courseId, assignmentId}) from that row.",
          "Modal handles its own data fetching via useRawDetailSnapshot hook (no prop drilling)."
        ]
      },
      {
        "id": "a11y_responsive",
        "kind": "ui",
        "rules": [
          "Sticky header; horizontal overflow on narrow screens; text wraps in long cells.",
          "Keyboard-accessible: all buttons, links, dropdowns focusable with visible outlines.",
          "ARIA: role=table (implicit), columnheader scope=col, row/cell structure.",
          "Magnifier button: role=button, aria-label='View details for {assignmentName}'."
        ]
      }
    ]
  },
  "fixtures": {
    "inputs": {
      "small_dataset": {
        "headers": [
          "Student","Course","Teacher","Assignment","Status",
          "Points","Grade","%","Due","Turned in","Graded on","Actions"
        ],
        "rows": "@compose.detailData.fixtures.expectations.with_selected_student.rows",
        "selectedStudentId": "S1",
        "initialSort": { "by": "Due", "dir": "asc" }
      }
    },
    "expectations": {
      "derives_3_course_options_from_6_rows": false,
      "derives_4_status_options": true,
      "filters_AND_logic": true,
      "keyword_matches_all_text_fields_and_IDs": true,
      "sorts_correctly_by_all_12_columns": true,
      "resets_on_selectedStudentId_change": true,
      "magnifier_opens_modal": true,
      "modal_receives_row_IDs_not_full_data": true
    }
  },
  "tests": {
    "unit": [
      { "name": "derives_unique_course_options_with_labels" },
      { "name": "derives_unique_status_options_sorted" },
      { "name": "resets_filters_when_selectedStudentId_changes" },
      { "name": "filters_course_AND_status_AND_keyword" },
      { "name": "keyword_search_tokenizes_and_matches_all_fields_including_IDs" },
      { "name": "sorts_text_columns_with_localeCompare" },
      { "name": "sorts_numeric_columns_with_undefined_handling" },
      { "name": "sorts_date_columns_chronologically" },
      { "name": "toggles_sort_direction_on_repeated_header_click" },
      { "name": "magnifier_click_sets_modalRow_state" },
      { "name": "renders_DetailModal_with_correct_props" },
      { "name": "points_cell_formats_correctly_per_spec" },
      { "name": "empty_state_shown_when_no_rows_after_filter" }
    ],
    "integration": [
      { "name": "modal_opens_and_displays_snapshot_on_magnifier_click" },
      { "name": "modal_closes_and_clears_modalRow_on_onClose" },
      { "name": "filter_dropdowns_update_visible_rows" },
      { "name": "clear_filters_button_resets_all_filters" }
    ],
    "visual": [
      { "name": "table_with_filters_and_sorted_data_renders" },
      { "name": "modal_overlay_appears_on_magnifier_click" }
    ]
  },
  "guardrails": [
    "STOP_IF: component mutates input rows.",
    "STOP_IF: non-http(s) assignmentUrl is rendered.",
    "STOP_IF: filtering/sorting depend on external globals.",
    "STOP_IF: modal receives full StudentData as prop (should use useRawDetailSnapshot hook).",
    "STOP_IF: magnifier icon is not keyboard-accessible.",
    "STOP_IF: headers.length !== 12 (added Actions column).",
    "STOP_IF: Points cell shows 'NaN' or invalid format."
  ],
  "definition_of_done": {
    "developer_must": [
      "Implement as self-contained component with local filter/sort/modal state.",
      "Derive course/status options from rows.",
      "Reset filters on selectedStudentId change via useEffect.",
      "Implement keyword tokenization (all tokens must match).",
      "Implement sort for all 12 columns with correct comparators.",
      "Render magnifier 🔍 in Actions column, opens DetailModal.",
      "DetailModal integration: pass {studentId, courseId, assignmentId}, no full data.",
      "Honor headers order and mapping.",
      "Pass ESLint, TSC, unit + integration + visual tests."
    ],
    "po_review": [
      "Filters work independently and in combination (AND logic).",
      "Keyword search finds assignments by name, course, teacher, status, dates, IDs.",
      "Sorting works for all columns; clicking header toggles direction.",
      "Magnifier icon opens modal with full JSON (student, course, assignment, submissions).",
      "Modal search/copy/close work correctly.",
      "Switching students clears filters and resets table.",
      "Empty states display correctly."
    ]
  },
  "implementation": {
    "module": "src/components/TableDetail.tsx",
    "export": "TableDetail",
    "layer": "ui",
    "tags": ["table", "detail", "filtering", "sorting", "modal"],
    "dependencies": {
      "ui.DetailModal": "^1.0.1"
    }
  },
  "notes": {
    "self_contained": "All filtering, sorting, and modal state managed internally. No external dependencies except DetailModal component.",
    "performance": "Filter/sort computed on every render; acceptable for <1000 rows. Consider useMemo for larger datasets.",
    "modal_integration": "DetailModal uses useRawDetailSnapshot hook internally, so TableDetail only passes IDs, not data.",
    "headers": "12 columns total (original 11 + Actions). Actions column contains magnifier icon for modal.",
    "filter_reset": "Filters reset when selectedStudentId changes (detected via useEffect dependency).",
    "keyword_search": "Searches ALL text fields, date fields (display and ISO), and ID fields. Tokenized AND logic.",
    "layering": "Lives in src/components/ (not src/ui/components/) because it's a feature component, not a primitive UI element."
  },
  "commands": {
    "play": [
      "pnpm eslint src/components/TableDetail.tsx",
      "pnpm tsc --noEmit",
      "pnpm test -t ui.TableDetail"
    ]
  }
}
```

---

## Key Changes from Original

1. ✅ **Added "Actions" column** (12th column for magnifier icon)
2. ✅ **Added `selectedStudentId` to props** (for reset detection)
3. ✅ **Clarified Points cell formatting** (all 4 cases)
4. ✅ **Added IDs to keyword search** (studentId, courseId, assignmentId)
5. ✅ **Specified modal integration** (state management, props, DetailModal import)
6. ✅ **Added table caption** (accessibility)
7. ✅ **Expanded test coverage** (modal integration, filter reset, points formatting)
8. ✅ **Added guardrails** (no NaN in Points, headers.length === 12, keyboard accessibility)
9. ✅ **Performance notes** (useMemo considerations for large datasets)
10. ✅ **Layering clarity** (src/components/ vs src/ui/components/)

---

## Open Questions

1. **Headers as prop vs hardcoded?**
   - Currently: prop (matches compose.detailData output)
   - Could hardcode since they never change
   - **Recommendation:** Keep as prop for consistency with compose layer

2. **Course filter label format?**
   - My suggestion: "Math (Mr. Smith)" (shortName + teacher)
   - Alternative: Just "Math" (simpler)
   - **Recommendation:** Include teacher for disambiguation (multiple sections)

3. **Actions column position?**
   - My suggestion: Last column (after Graded on)
   - Alternative: First column (before Student)
   - **Recommendation:** Last column (less distracting, common pattern)

---

## Recommendations

**Approve this revised spec?** It addresses all the gaps and ambiguities from the original while staying true to the intent. The additions are minimal but important for implementation clarity.

Once approved, I'll:
1. Add to `spec/current.json`
2. Implement at `src/components/TableDetail.tsx`
3. Create test suite at `tests/spec/ui.TableDetail/`
4. Demo on scratchpad or detail page

**Estimated implementation time:** ~45-60 minutes (it's a complex component with filters, sorting, and modal integration).

---

— Chuckles

