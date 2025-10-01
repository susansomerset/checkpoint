# Proposed Spec Node: compose.detailData@1.0.0

**Status:** DRAFT - Awaiting PO Approval  
**Date:** October 1, 2025  
**Author:** Chuckles

---

## Complete Spec Node (JSON)

```json
{
  "id": "compose.detailData",
  "version": "1.0.0",
  "kind": "compose",
  "title": "Adapter from StudentContext → DetailRow[] for the selected student (plus static headers)",
  "deps": [
    "processing.getDetailRows@^1.0.0"
  ],
  "contracts": {
    "touch": [
      { "$ref": "node:processing.getDetailRows@^1.0.0#contracts.produces.DetailRow" }
    ],
    "produces": {
      "SelectedDetailData": {
        "rows[]": { "$ref": "node:processing.getDetailRows@^1.0.0#contracts.produces.DetailRow" },
        "selectedStudentId": "string",
        "headers": [
          "Student","Course","Teacher","Assignment","Status",
          "Points","Grade","%","Due","Turned in","Graded on"
        ]
      },
      "RawDetailSnapshot": {
        "student": {
          "studentId": "string",
          "meta?": "object"
        },
        "course": {
          "courseId": "string",
          "meta?": "object",
          "canvas?": "object"
        },
        "assignment": {
          "assignmentId": "string",
          "courseId": "string",
          "canvas?": "object",
          "meta?": "object",
          "pointsPossible?": "int",
          "link?": "string",
          "submissions?": "Record<string,object>"
        }
      }
    }
  },
  "signature": {
    "getSelectedDetail": {
      "input": {
        "studentContext": {
          "selectedStudentId": "string|null",
          "data": {
            "students": "Record<studentId,StudentNode>"
          }
        },
        "nowISO?": "iso8601"
      },
      "output": { "$ref": "#contracts.produces.SelectedDetailData" }
    },
    "getRawDetailSnapshot": {
      "input": {
        "studentData": {
          "students": "Record<studentId,StudentNode>"
        },
        "studentId": "string",
        "courseId": "string",
        "assignmentId": "string"
      },
      "output": { "$ref": "#contracts.produces.RawDetailSnapshot" }
    }
  },
  "processing": {
    "pipeline": [
      {
        "id": "getSelectedDetail",
        "kind": "compose",
        "rules": [
          "Read { selectedStudentId, data } from studentContext.",
          "If no selectedStudentId or no data, return { rows:[], selectedStudentId:'', headers:STATIC_HEADERS }.",
          "Resolve the Student node: data.students[selectedStudentId].",
          "If student not found, return { rows:[], selectedStudentId, headers:STATIC_HEADERS }.",
          "Call processing.getDetailRows(selectedStudent, nowISO).",
          "Return { rows, selectedStudentId, headers:STATIC_HEADERS }."
        ]
      },
      {
        "id": "getRawDetailSnapshot",
        "kind": "compose",
        "rules": [
          "Lazy-load function: ONLY called when user opens JSON modal for a row.",
          "Navigate studentData → students[studentId] → courses[courseId] → assignments[assignmentId].",
          "If any node missing, return null.",
          "Build snapshot with:",
          "  student: { studentId, meta } (NO nested courses)",
          "  course: { courseId, meta, canvas } (NO nested assignments)",
          "  assignment: { assignmentId, courseId, canvas, meta, pointsPossible, link, submissions }",
          "  ← assignment.meta includes checkpointStatus",
          "  ← assignment.submissions includes ALL submissions (not just first)",
          "Return snapshot for modal display."
        ]
      }
    ]
  },
  "fixtures": {
    "inputs": {
      "with_selected_student": {
        "studentContext": {
          "selectedStudentId": "S1",
          "data": {
            "students": {
              "S1": "@processing.getWeeklyGrids.fixtures.inputs.two_students_small.studentData.students.S1"
            }
          }
        },
        "nowISO": "2025-10-01T12:00:00-07:00"
      },
      "no_selected_student": {
        "studentContext": {
          "selectedStudentId": null,
          "data": {
            "students": {
              "S1": "@processing.getWeeklyGrids.fixtures.inputs.two_students_small.studentData.students.S1"
            }
          }
        },
        "nowISO": "2025-10-01T12:00:00-07:00"
      },
      "raw_snapshot_request": {
        "studentData": {
          "students": {
            "S1": "@processing.getWeeklyGrids.fixtures.inputs.two_students_small.studentData.students.S1"
          }
        },
        "studentId": "S1",
        "courseId": "C-101",
        "assignmentId": "A-0"
      }
    },
    "expectations": {
      "with_selected_student": {
        "rows": {
          "length": 6,
          "first": {
            "studentId": "S1",
            "studentPreferredName": "Alice",
            "courseId": "C-101",
            "assignmentId": "A-0"
          }
        },
        "selectedStudentId": "S1",
        "headers": {
          "length": 11,
          "first": "Student",
          "last": "Graded on"
        }
      },
      "no_selected_student": {
        "rows": [],
        "selectedStudentId": "",
        "headers": {
          "length": 11
        }
      },
      "raw_snapshot_request": {
        "student": {
          "studentId": "S1",
          "meta": {
            "preferredName": "Alice",
            "legalName": "Alice Johnson"
          }
        },
        "course": {
          "courseId": "C-101",
          "meta": {
            "shortName": "Algebra I",
            "period": "1"
          },
          "canvas": {
            "name": "Algebra I"
          }
        },
        "assignment": {
          "assignmentId": "A-0",
          "courseId": "C-101",
          "meta": {
            "checkpointStatus": "Missing"
          },
          "pointsPossible": 10,
          "submissions": {}
        }
      }
    }
  },
  "tests": {
    "unit": [
      { "name": "returns_empty_rows_with_headers_when_no_selectedStudentId" },
      { "name": "returns_empty_rows_with_headers_when_selectedStudent_not_found" },
      { "name": "delegates_to_getDetailRows_when_student_exists" },
      { "name": "includes_static_headers_array_11_items" },
      { "name": "returns_selectedStudentId_in_output" }
    ],
    "integration": [
      { "name": "getRawDetailSnapshot_returns_null_when_ids_invalid" },
      { "name": "getRawDetailSnapshot_includes_assignment_meta_with_checkpointStatus" },
      { "name": "getRawDetailSnapshot_includes_all_submissions_not_just_first" },
      { "name": "getRawDetailSnapshot_excludes_nested_courses_and_assignments" }
    ]
  },
  "guardrails": [
    "STOP_IF: any filtering/sorting logic is added to getSelectedDetail.",
    "STOP_IF: module mutates studentContext.",
    "STOP_IF: getRawDetailSnapshot includes nested courses or assignments Records.",
    "STOP_IF: headers array length !== 11 or order changes."
  ],
  "definition_of_done": {
    "developer_must": [
      "Export getSelectedDetail(studentContext, nowISO?) → { rows, selectedStudentId, headers }.",
      "Export getRawDetailSnapshot(studentData, studentId, courseId, assignmentId) → RawDetailSnapshot|null.",
      "Scratchpad shows both outputs side-by-side.",
      "Pass ESLint, TSC, unit + integration tests."
    ],
    "po_review": [
      "Verify composeOutput includes headers array with 11 items.",
      "Verify rows match processing.getDetailRows output.",
      "Verify raw snapshot demo shows assignment.meta.checkpointStatus.",
      "Verify raw snapshot excludes nested courses/assignments.",
      "Approve before implementing ui.TableDetail."
    ]
  },
  "implementation": {
    "module": "src/lib/compose/detailData.ts",
    "exports": ["getSelectedDetail", "getRawDetailSnapshot"],
    "pure": false,
    "notes": "Adapter layer - reads from StudentContext, delegates to pure processing layer"
  },
  "notes": {
    "lazy_loading": "getRawDetailSnapshot is only called when modal opens, not during initial row generation. This keeps getDetailRows fast.",
    "headers_static": "Headers array is static and hardcoded to ensure column order consistency.",
    "raw_ids_only": "DetailRow.raw contains only IDs (studentId, courseId, assignmentId), not full objects. Full objects retrieved on-demand via getRawDetailSnapshot.",
    "performance": "Separating raw snapshot retrieval from row generation improves student-switching performance significantly (no blob generation upfront)."
  },
  "commands": {
    "play": [
      "pnpm eslint src/lib/compose/detailData.ts",
      "pnpm tsc --noEmit",
      "pnpm test -t compose.detailData"
    ]
  }
}
```

---

## Key Design Decisions

### 1. **Two Exports (not one)**
- `getSelectedDetail()` - Main adapter for getting rows
- `getRawDetailSnapshot()` - On-demand snapshot retrieval for modal

### 2. **Lazy Loading Strategy**
- DetailRow.raw contains **only IDs** (3 strings)
- Full snapshot built **only when modal opens**
- Eliminates performance lag on student switch

### 3. **Static Headers**
11-item array, hardcoded:
```javascript
const HEADERS = [
  'Student', 'Course', 'Teacher', 'Assignment', 'Status',
  'Points', 'Grade', '%', 'Due', 'Turned in', 'Graded on'
];
```

### 4. **What getRawDetailSnapshot Returns**
- **student:** studentId + meta (preferredName, legalName)
- **course:** courseId + meta (shortName, teacher, period) + canvas (name)
- **assignment:** Full assignment INCLUDING:
  - `meta.checkpointStatus` ✅
  - `submissions` Record (ALL submissions) ✅
  - canvas, pointsPossible, link
  - **NO** nested courses or assignments

### 5. **Error Handling**
- Returns `{ rows: [], selectedStudentId, headers }` when:
  - No student selected
  - Selected student not found in data
- Returns `null` from getRawDetailSnapshot when IDs don't resolve

---

## Test Coverage

### Unit Tests (5):
1. Empty rows when no selectedStudentId
2. Empty rows when student not found
3. Delegates to getDetailRows when student exists
4. Static headers always 11 items
5. Returns selectedStudentId in output

### Integration Tests (4):
1. getRawDetailSnapshot returns null for invalid IDs
2. Includes assignment.meta.checkpointStatus
3. Includes ALL submissions
4. Excludes nested courses/assignments

---

## Fixtures

Uses existing `two_students_small` fixture from getWeeklyGrids (S1 has 6 assignments in C-101).

**Expected outputs:**
- **with_selected_student:** 6 rows, headers array, selectedStudentId="S1"
- **no_selected_student:** 0 rows, headers array, selectedStudentId=""
- **raw_snapshot_request:** Full snapshot for A-0 with meta.checkpointStatus="Missing"

---

## Scratchpad Display

Currently shows:
1. **compose.detailData Output** - Full package (rows + headers + selectedStudentId)
2. **processing.getDetailRows Output** - Raw rows only (for comparison)

**Validation:**
- Switch students → composeOutput updates
- Check headers array = 11 items
- Check rows.length matches assignment count
- Verify raw field in each row only has 3 IDs (not full objects)

---

**Ready for PO review!** Should I add this to `spec/current.json`?

