// src/app/assignments/page.tsx
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AssignmentList } from '@/components/AssignmentList'
import { Toaster } from 'react-hot-toast'

interface AssignmentsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

function AssignmentListWrapper() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="text-center py-4"><div className="text-sm text-gray-500">Loading...</div></div>}>
        <AssignmentList />
      </Suspense>
    </ErrorBoundary>
  )
}

export default async function AssignmentsPage({ searchParams: _searchParams }: AssignmentsPageProps) {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="mt-2 text-sm text-gray-600">
            View all assignments with Canvas links and status information
          </p>
        </div>
        
        <AssignmentListWrapper />
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
