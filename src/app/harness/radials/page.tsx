"use client";

import { useState, useEffect } from "react";
import ProgressRadialStack from "@/components/ProgressRadialStack.client";

// Golden fixture data for deterministic testing
const GOLDEN_FIXTURE = {
  courses: [
    {
      courseId: "course-101",
      courseName: "Algebra I",
      period: 1,
      progress: {
        earned: 85,
        submitted: 15,
        missing: 0,
        lost: 0,
        total: 100
      }
    },
    {
      courseId: "course-102", 
      courseName: "English Lit",
      period: 2,
      progress: {
        earned: 70,
        submitted: 20,
        missing: 10,
        lost: 0,
        total: 100
      }
    },
    {
      courseId: "course-103",
      courseName: "Biology",
      period: 3,
      progress: {
        earned: 0,
        submitted: 0,
        missing: 50,
        lost: 0,
        total: 50
      }
    },
    {
      courseId: "course-104",
      courseName: "History",
      period: 4,
      progress: {
        earned: 100,
        submitted: 0,
        missing: 0,
        lost: 0,
        total: 100
      }
    },
    {
      courseId: "course-105",
      courseName: "Chemistry",
      period: 5,
      progress: {
        earned: 60,
        submitted: 10,
        missing: 20,
        lost: 10,
        total: 100
      }
    },
    {
      courseId: "course-106",
      courseName: "Physics",
      period: 6,
      progress: {
        earned: 0,
        submitted: 0,
        missing: 0,
        lost: 0,
        total: 0
      }
    }
  ]
};

export default function RadialHarnessPage() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    // Wait for fonts to load for pixel-perfect comparison
    document.fonts.ready.then(() => {
      setFontsReady(true);
    });
  }, []);

  if (!fontsReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading fonts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Radial Chart Parity Harness
          </h1>
          <p className="text-gray-600">
            Side-by-side comparison of old vs new radial charts using golden fixture data
          </p>
        </div>

        <div className="space-y-12">
          {/* New Implementation */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              New Implementation (Current)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {GOLDEN_FIXTURE.courses.map((course) => {
                const { progress } = course;
                
                // Calculate the main percentage (earned + submitted) for center display
                // Use the SAME denominator as the individual buckets
                const total = progress.earned + progress.submitted + progress.missing + progress.lost;
                const mainPercentage = total > 0 
                  ? ((progress.earned + progress.submitted) / total) * 100
                  : 0;

                // Create buckets for the four stacked rings
                const buckets = {
                  earned: progress.earned,
                  submitted: progress.submitted,
                  missing: progress.missing,
                  lost: progress.lost
                };

                return (
                  <ProgressRadialStack
                    key={course.courseId}
                    buckets={buckets}
                    percent={mainPercentage}
                    title={`Period ${course.period}`}
                    subtitle={course.courseName}
                    className="w-full"
                    testMode={true} // Disable animations for deterministic testing
                  />
                );
              })}
            </div>
          </div>

          {/* Reference Implementation (Placeholder) */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Reference Implementation (Original)
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Reference Implementation Not Available
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      This would show the original canvas-checkpoint radial charts for comparison.
                      Since we don&apos;t have access to the original implementation, this serves as a placeholder
                      for the side-by-side comparison that would be used in a real parity test.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Test Controls
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Environment</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Fonts loaded: {fontsReady ? '✅' : '⏳'}</li>
                  <li>• Animations: Disabled (test mode)</li>
                  <li>• Device pixel ratio: {typeof window !== 'undefined' ? window.devicePixelRatio : 'N/A'}</li>
                  <li>• Reduced motion: {typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Yes' : 'No'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Fixture Data</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Courses: {GOLDEN_FIXTURE.courses.length}</li>
                  <li>• Test scenarios: Complete, Partial, Empty, Perfect</li>
                  <li>• Edge cases: 0%, 100%, mixed statuses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
