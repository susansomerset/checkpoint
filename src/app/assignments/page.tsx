import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AssignmentList } from '@/components/AssignmentList'
import { AuthTest } from '@/components/AuthTest'
import { MinimalAuthTest } from '@/components/MinimalAuthTest'
import { NetworkProbe } from '@/components/NetworkProbe'
import { SimpleTest } from '@/components/SimpleTest'
import { MinimalClientTest } from '@/components/MinimalClientTest'
import { Toaster } from 'react-hot-toast'

interface AssignmentsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function AssignmentListWrapper({ studentId }: { studentId?: string }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="text-center py-4"><div className="text-sm text-gray-500">Loading...</div></div>}>
        <AssignmentList studentId={studentId} />
      </Suspense>
    </ErrorBoundary>
  )
}

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  // Await searchParams in Next.js 15
  const resolvedSearchParams = await searchParams
  // Extract studentId from searchParams (server-side)
  const studentId = typeof resolvedSearchParams.student === 'string' ? resolvedSearchParams.student : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <p className="mt-2 text-sm text-gray-600">
              View all assignments with Canvas links and status information
            </p>
            {studentId && (
              <p className="mt-1 text-xs text-blue-600">
                Filtering for student: {studentId}
              </p>
            )}
          </div>

          <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
            <h3 className="font-bold">Server Component Test</h3>
            <p>This should appear immediately (server-rendered)</p>
            <p>Student ID: {studentId || 'none'}</p>
          </div>
          
          <MinimalClientTest />
          <SimpleTest />
          <NetworkProbe />
          <MinimalAuthTest />
          <AuthTest />
          <AssignmentListWrapper studentId={studentId} />
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
