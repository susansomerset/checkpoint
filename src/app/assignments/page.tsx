// src/app/assignments/page.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AssignmentList } from '@/components/AssignmentList'
import { Toaster } from 'react-hot-toast'

interface AssignmentsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function AssignmentListWrapper() {
  return (
    <ErrorBoundary>
      <AssignmentList />
    </ErrorBoundary>
  )
}

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  // Await searchParams in Next.js 15
  await searchParams
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
              <p className="mt-2 text-sm text-gray-600">
                View all assignments with Canvas links and status information
              </p>
            </div>
            <div className="flex gap-4">
              <a 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Dashboard
              </a>
              <a 
                href="/progress" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Progress
              </a>
            </div>
          </div>
        </div>
        
        <AssignmentListWrapper />
      </div>
      <Toaster position="top-right" />
    </div>
  )
}
