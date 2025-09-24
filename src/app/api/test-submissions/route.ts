/**
 * Test submissions endpoint - uses main Canvas client with rate limiting
 * 
 * This endpoint tests Canvas submissions API with proper rate limiting and retry logic.
 * Uses the main CanvasClient instead of the test client for consistency.
 */

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createCanvasClient } from '@/lib/canvas/client';

export async function GET(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (process.env.SMOKE_ROUTES !== '1') {
      return NextResponse.json({ error: 'Disabled' }, { status: 404 });
    }

    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    const studentId = url.searchParams.get('studentId');
    if (!courseId || !studentId) {
      return NextResponse.json({ error: 'courseId and studentId are required' }, { status: 400 });
    }

    const client = createCanvasClient();

    const t0 = Date.now();
    // Use the main client's custom URL pagination for submissions
    const submissions = await client.paginateCustomUrl(
      `${process.env.CANVAS_BASE_URL}/api/v1/courses/${courseId}/students/submissions?per_page=100&student_ids[]=${studentId}`
    );
    const t1 = Date.now();

    const uniqueAssignments = new Set(submissions.map((s: any) => s.assignment_id));
    const gradedSubmissions = submissions.filter((s: any) => s.workflow_state === 'graded');
    const submittedSubmissions = submissions.filter((s: any) => s.workflow_state === 'submitted' || s.workflow_state === 'graded');

    return NextResponse.json({
      success: true,
      courseId,
      studentId,
      url: `${process.env.CANVAS_BASE_URL}/api/v1/courses/${courseId}/students/submissions?per_page=100&student_ids[]=${studentId}`,
      timing: {
        start: new Date(t0).toISOString(),
        end: new Date(t1).toISOString(),
        durationMs: t1 - t0
      },
      summary: {
        totalSubmissions: submissions.length,
        uniqueAssignments: uniqueAssignments.size,
        gradedSubmissions: gradedSubmissions.length,
        submittedSubmissions: submittedSubmissions.length,
        assignmentIds: Array.from(uniqueAssignments)
      },
      sampleSubmissions: submissions.slice(0, 5).map((s: any) => ({
        id: s.id,
        assignmentId: s.assignment_id,
        userId: s.user_id,
        workflowState: s.workflow_state,
        score: s.score,
        grade: s.grade,
        submittedAt: s.submitted_at
      }))
    });

  } catch (error) {
    console.error('Test submissions error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}