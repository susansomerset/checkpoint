/**
 * Unit tests for processing.getDetailRows
 * Spec: spec/current.json
 */

import { getDetailRows } from '../../../src/lib/pure/getDetailRows';

describe('processing.getDetailRows', () => {
  it('flattens only selected student subtree', () => {
    const student = {
      studentId: 'S1',
      meta: { preferredName: 'Alice' },
      courses: {
        'C1': {
          courseId: 'C1',
          meta: { shortName: 'Math' },
          assignments: {
            'A1': {
              assignmentId: 'A1',
              courseId: 'C1',
              canvas: { name: 'Quiz', html_url: 'https://example.com/a1' },
              meta: { checkpointStatus: 'Due' },
              pointsPossible: 10,
              submissions: {}
            }
          }
        }
      }
    };

    const rows = getDetailRows(student, '2025-10-01T12:00:00Z');

    expect(rows).toHaveLength(1);
    expect(rows[0].studentId).toBe('S1');
    expect(rows[0].studentPreferredName).toBe('Alice');
    expect(rows[0].courseId).toBe('C1');
    expect(rows[0].assignmentId).toBe('A1');
  });

  it('prefers canvas html_url then optional link http only', () => {
    const student = {
      studentId: 'S1',
      meta: {},
      courses: {
        'C1': {
          courseId: 'C1',
          assignments: {
            'A1': {
              assignmentId: 'A1',
              courseId: 'C1',
              canvas: { html_url: 'https://canvas.com/a1' },
              link: 'https://other.com',
              meta: {},
              submissions: {}
            },
            'A2': {
              assignmentId: 'A2',
              courseId: 'C1',
              canvas: {},
              link: 'https://valid.com',
              meta: {},
              submissions: {}
            },
            'A3': {
              assignmentId: 'A3',
              courseId: 'C1',
              canvas: {},
              link: 'ftp://invalid.com',
              meta: {},
              submissions: {}
            }
          }
        }
      }
    };

    const rows = getDetailRows(student);

    expect(rows).toHaveLength(2); // A3 excluded (no valid URL)
    expect(rows[0].assignmentUrl).toBe('https://canvas.com/a1'); // Prefers canvas
    expect(rows[1].assignmentUrl).toBe('https://valid.com'); // Fallback to link
  });

  it('pointsGraded defaults to zero', () => {
    const student = {
      studentId: 'S1',
      meta: {},
      courses: {
        'C1': {
          courseId: 'C1',
          assignments: {
            'A1': {
              assignmentId: 'A1',
              courseId: 'C1',
              canvas: { html_url: 'https://example.com/a1' },
              meta: {},
              submissions: {} // No submissions
            }
          }
        }
      }
    };

    const rows = getDetailRows(student);

    expect(rows[0].pointsGraded).toBe(0);
  });

  it('gradePct integer 0 decimals only when possible gt 0', () => {
    const student = {
      studentId: 'S1',
      meta: {},
      courses: {
        'C1': {
          courseId: 'C1',
          assignments: {
            'A1': {
              assignmentId: 'A1',
              courseId: 'C1',
              canvas: { html_url: 'https://example.com/a1' },
              meta: {},
              pointsPossible: 10,
              submissions: {
                'SUB1': { graded_points: 8 }
              }
            },
            'A2': {
              assignmentId: 'A2',
              courseId: 'C1',
              canvas: { html_url: 'https://example.com/a2' },
              meta: {},
              pointsPossible: 0,
              submissions: {
                'SUB2': { graded_points: 5 }
              }
            },
            'A3': {
              assignmentId: 'A3',
              courseId: 'C1',
              canvas: { html_url: 'https://example.com/a3' },
              meta: {},
              // No pointsPossible
              submissions: {
                'SUB3': { graded_points: 10 }
              }
            }
          }
        }
      }
    };

    const rows = getDetailRows(student);

    expect(rows[0].gradePct).toBe(80); // 8/10 = 80%
    expect(rows[1].gradePct).toBeUndefined(); // pointsPossible = 0
    expect(rows[2].gradePct).toBeUndefined(); // pointsPossible missing
  });

  it('date display M/D same year else M/D/YY', () => {
    const student = {
      studentId: 'S1',
      meta: {},
      courses: {
        'C1': {
          courseId: 'C1',
          assignments: {
            'A1': {
              assignmentId: 'A1',
              courseId: 'C1',
              canvas: { 
                html_url: 'https://example.com/a1',
                due_at: '2025-10-15T12:00:00Z'
              },
              meta: {},
              submissions: {
                'SUB1': {
                  submitted_at: '2024-09-01T12:00:00Z',
                  graded_at: '2024-09-02T12:00:00Z'
                }
              }
            }
          }
        }
      }
    };

    const rows = getDetailRows(student, '2025-10-01T12:00:00Z');

    expect(rows[0].dueAtDisplay).toBe('10/15'); // Same year (2025)
    expect(rows[0].submittedAtDisplay).toBe('9/1/24'); // Different year (2024)
    expect(rows[0].gradedAtDisplay).toBe('9/2/24'); // Different year (2024)
  });

  it('passes through arbitrary checkpointStatus strings', () => {
    const student = {
      studentId: 'S1',
      meta: {},
      courses: {
        'C1': {
          courseId: 'C1',
          assignments: {
            'A1': {
              assignmentId: 'A1',
              courseId: 'C1',
              canvas: { html_url: 'https://example.com/a1' },
              meta: { checkpointStatus: 'CustomStatus' },
              submissions: {}
            }
          }
        }
      }
    };

    const rows = getDetailRows(student);

    expect(rows[0].checkpointStatus).toBe('CustomStatus');
  });

  it('rows do not include raw field (per Vern spec v1.0.1)', () => {
    const student = {
      studentId: 'S1',
      meta: {},
      courses: {
        'C1': {
          courseId: 'C1',
          assignments: {
            'A1': {
              assignmentId: 'A1',
              courseId: 'C1',
              canvas: { html_url: 'https://example.com/a1' },
              meta: {},
              submissions: {}
            }
          }
        }
      }
    };

    const rows = getDetailRows(student);

    expect(rows[0]).not.toHaveProperty('raw');
    // IDs should be at top level instead
    expect(rows[0].studentId).toBe('S1');
    expect(rows[0].courseId).toBe('C1');
    expect(rows[0].assignmentId).toBe('A1');
  });
});

