'use client';
import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

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
  const [resetting, setResetting] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = React.useState<string | null>(null);
  
      

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

  async function resetStudentData() {
    setResetting(true); 
    setResetError(null); 
    setResetSuccess(null);
    try {
      const res = await fetch('/api/student-data/reset', { 
        method: 'POST',
        cache: 'no-store' 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      if (!json.ok) {
        throw new Error(json.error || 'Reset failed');
      }
      
      setResetSuccess(`Reset successful! Found ${json.counts?.students || 0} students, ${json.counts?.courses || 0} courses, ${json.counts?.assignments || 0} assignments, ${json.counts?.submissions || 0} submissions.`);
    } catch (e: unknown) {
      setResetError((e as Error).message || 'Reset failed');
    } finally {
      setResetting(false);
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
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button onClick={getStudentData} disabled={loading}>
          {loading ? 'Loading…' : 'Get Student Data'}
        </button>
        <button 
          onClick={resetStudentData} 
          disabled={resetting}
          style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}
        >
          {resetting ? 'Resetting…' : 'Reset Student Data'}
        </button>
      </div>
      
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {resetError && <p style={{ color: 'crimson' }}>Reset Error: {resetError}</p>}
      {resetSuccess && <p style={{ color: 'green' }}>{resetSuccess}</p>}
      {data && (
        <div style={{ marginTop: 16, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          <JsonNode data={data} label="root" />
        </div>
      )}


        </main>
      );
    }
