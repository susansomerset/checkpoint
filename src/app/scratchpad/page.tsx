"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { WeeklyGrid } from '@/components/WeeklyGrid';
import tinyRender from '../../../tests/fixtures/ui.WeeklyGrid/tiny_render.json';

export const dynamic = 'force-dynamic';

export default function ScratchpadPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">ui.WeeklyGrid v1.0.1</h1>
        <p className="text-lg text-gray-600 mb-2">
          WeeklyGrid table component (render-only)
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Source: spec/current.json
        </p>
        
        <div className="space-y-6">
          <div className="border-2 border-gray-300 rounded-lg p-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Tiny Render - Single Student</h3>
            
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Test Data:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Student:</strong> S1</li>
                <li><strong>Course:</strong> Alg I (C-101)</li>
                <li><strong>Prior:</strong> A-0 (Warning - 10/2: Warmup)</li>
                <li><strong>Tue:</strong> A-2 (Thumb - Reflection)</li>
                <li><strong>No Date:</strong> Empty (should show em dash)</li>
                <li><strong>Summary:</strong> ⚠️:1 / ❓:0 / 👍:1 / ✅:0</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded border">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Rendered Component:</h4>
              <WeeklyGrid 
                grids={tinyRender.grids as any}
                selectedStudentId={tinyRender.selectedStudentId}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">⏸️ AWAITING PO APPROVAL</h2>
          <p className="text-blue-800 mb-3">
            <strong>ui.WeeklyGrid v1.0.1:</strong> Review the rendered table above:
          </p>
          <ul className="list-disc ml-6 text-blue-800 text-sm">
            <li>Verify table has exactly 9 column headers in correct order</li>
            <li>Verify today&apos;s column is highlighted (or Monday if weekend)</li>
            <li>Verify student header shows &quot;⚠️:1 / ❓:0 / 👍:1 / ✅:0&quot;</li>
            <li>Verify Prior cell shows &quot;⚠️ 10/2: Warmup (10)&quot; with red text and yellow highlight</li>
            <li>Verify Tue cell shows &quot;👍 Reflection (25)&quot; with blue text</li>
            <li>Verify empty cells (Mon, Wed, Thu, Fri, Next, Prior Weeks) show em dash &quot;—&quot;</li>
            <li>Verify No Date cell shows em dash &quot;—&quot; (count is 0)</li>
            <li>Verify all assignment links open in new tab with noopener</li>
            <li>Verify keyboard focus visible on all links</li>
          </ul>
        </div>
      </div>
    </div>
  );
}