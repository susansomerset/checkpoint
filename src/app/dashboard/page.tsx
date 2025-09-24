'use client';
import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import TestJsonViewer from '../../components/TestJsonViewer';

function Toggle({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ marginLeft: 12 }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? '▾' : '▸'} {label}
      </button>
      {open && <div style={{ paddingLeft: 16 }}>{children}</div>}
    </div>
  );
}

function JsonNode({ data, label }: { data: unknown; label: string }) {
  if (data === null || typeof data !== 'object') {
    return <div><strong>{label}:</strong> {String(data)}</div>;
  }
  if (Array.isArray(data)) {
    return (
      <Toggle label={`${label} [${data.length}]`}>
        {data.map((v, i) => (
          <JsonNode key={i} data={v} label={String(i)} />
        ))}
      </Toggle>
    );
  }
  return (
    <Toggle label={`${label} {}`}>
      {Object.entries(data).map(([k, v]) => (
        <JsonNode key={k} data={v} label={k} />
      ))}
    </Toggle>
  );
}

export default function DashboardPage() {
  const { user, error: authError, isLoading } = useUser();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Record<string, unknown> | null>(null);
  const [sessionValid, setSessionValid] = React.useState<boolean | null>(null);
  const [validating, setValidating] = React.useState(true);
  
      // StudentData test state
      const [studentDataLoading, setStudentDataLoading] = React.useState(false);
      const [studentDataError, setStudentDataError] = React.useState<string | null>(null);
      const [studentData, setStudentData] = React.useState<any>(null);

  // Validate session on component mount
  React.useEffect(() => {
    async function validateSession() {
      try {
        const res = await fetch('/api/auth/validate', { 
          cache: 'no-store',
          credentials: 'include'
        });
        const result = await res.json();
        setSessionValid(result.valid);
      } catch {
        setSessionValid(false);
      } finally {
        setValidating(false);
      }
    }
    
    validateSession();
  }, []);

  async function getStudentData() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/student-data', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError((e as Error).message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

      // StudentData test function
      async function testStudentData() {
        setStudentDataLoading(true); setStudentDataError(null);
        try {
          // Call reset endpoint to build complete student data
          const resetRes = await fetch('/api/student-data/reset', { 
            method: 'POST',
            cache: 'no-store' 
          });
          if (!resetRes.ok) throw new Error(`Reset failed: HTTP ${resetRes.status}`);
          const resetJson = await resetRes.json();
          
          if (!resetJson.ok) {
            throw new Error(resetJson.error || 'Reset failed');
          }
          
          // Get the posted student data using GET
          const dataRes = await fetch('/api/student-data', { cache: 'no-store' });
          if (!dataRes.ok) throw new Error(`Data fetch failed: HTTP ${dataRes.status}`);
          const studentDataJson = await dataRes.json();
          
          setStudentData(studentDataJson);
        } catch (e: unknown) {
          setStudentDataError((e as Error).message || 'StudentData test failed');
        } finally {
          setStudentDataLoading(false);
        }
      }

  if (isLoading || validating) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (sessionValid === false) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Hello, stranger! Your session is no longer valid. Please log in again.</p>
        <button 
          onClick={() => window.location.href = '/api/auth/login'} 
          style={{ color: '#666', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Log in
        </button>
      </main>
    );
  }

  if (authError) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Error: {authError.message}</p>
        <button 
          onClick={() => window.location.href = '/api/auth/logout'} 
          style={{ color: '#666', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Log out
        </button>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Hello, stranger! You need to be logged in to access the dashboard.</p>
        <button 
          onClick={() => window.location.href = '/api/auth/login'} 
          style={{ color: '#666', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Log in
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ margin: 0 }}>Boron</h1>
        <button 
          onClick={() => window.location.href = '/api/auth/logout'} 
          style={{ color: '#666', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Log out
        </button>
      </div>
      <p>Hello, {user.name || user.email || 'User'}! Retrieve the latest <code>studentData</code> JSON.</p>
      <button onClick={getStudentData} disabled={loading}>
        {loading ? 'Loading…' : 'Get Student Data'}
      </button>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {data && (
        <div style={{ marginTop: 16, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          <JsonNode data={data} label="root" />
        </div>
      )}

      {/* STUDENTDATA TEST SECTION - CAN BE REMOVED LATER */}
      <div style={{ marginTop: 32, padding: 16, border: '2px dashed #ccc', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#666' }}>
          🎓 Test StudentData (Temporary)
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#888' }}>
          Test the StudentData refresh and fetch functionality. This will refresh Canvas data and display the current student data structure. This entire section can be removed later.
        </p>
        
        <button 
          onClick={testStudentData} 
          disabled={studentDataLoading}
          style={{ padding: '8px 16px', fontSize: '14px', marginBottom: '12px' }}
        >
          {studentDataLoading ? 'Loading…' : 'Refresh & View StudentData'}
        </button>
      
        {studentDataError && (
          <p style={{ color: 'crimson', margin: '0 0 12px 0' }}>
            Error: {studentDataError}
          </p>
        )}
        
        {studentData && (
          <TestJsonViewer 
            data={studentData} 
            title="StudentData Response (Reset All Courses)"
          />
        )}
      </div>

      {/* SUBMISSIONS TEST SECTION - VERN'S DEBUGGING */}
      <div style={{ marginTop: 32, padding: 16, border: '2px dashed #007bff', borderRadius: 8, backgroundColor: '#f0f8ff' }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#007bff' }}>
          🔬 Test Submissions (Vern's Debugging)
        </h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              Test individual course-student submission combinations to debug 403 errors. Uses the main Canvas client with rate limiting.
            </p>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Course ID (e.g., 23758)" 
            id="testCourseId"
            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            defaultValue="23758"
          />
          <input 
            type="text" 
            placeholder="Student ID (e.g., 20682)" 
            id="testStudentId"
            style={{ padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px' }}
            defaultValue="20682"
          />
          <button 
            onClick={async () => {
              const courseId = (document.getElementById('testCourseId') as HTMLInputElement)?.value;
              const studentId = (document.getElementById('testStudentId') as HTMLInputElement)?.value;
              if (!courseId || !studentId) {
                alert('Please enter both Course ID and Student ID');
                return;
              }
              
              setStudentDataLoading(true);
              setStudentDataError(null);
              
              try {
                const res = await fetch(`/api/test-submissions?courseId=${courseId}&studentId=${studentId}`, { 
                  cache: 'no-store' 
                });
                const data = await res.json();
                setStudentData(data);
              } catch (e: unknown) {
                setStudentDataError((e as Error).message || 'Test failed');
              } finally {
                setStudentDataLoading(false);
              }
            }}
            disabled={studentDataLoading}
            style={{ padding: '8px 16px', fontSize: '14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {studentDataLoading ? 'Testing…' : 'Test Submissions'}
          </button>
        </div>
        
        {studentDataError && (
          <p style={{ color: 'crimson', margin: '0 0 12px 0' }}>
            Error: {studentDataError}
          </p>
        )}
        
        {studentData && (
          <TestJsonViewer 
            data={studentData} 
            title="Submissions Test Response"
          />
        )}
      </div>
        </main>
      );
    }
