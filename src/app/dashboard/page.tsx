'use client';
import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

function Toggle({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
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
  const [metadata, setMetadata] = React.useState<Record<string, unknown> | null>(null);
  const [loadingMetadata, setLoadingMetadata] = React.useState(false);
  const [metadataJson, setMetadataJson] = React.useState<string>('');
  const [savingMetadata, setSavingMetadata] = React.useState(false);
  const [metadataSaveSuccess, setMetadataSaveSuccess] = React.useState<string | null>(null);
  
      

  // Validate session on component mount
  React.useEffect(() => {
    async function validateSession() {
      try {
        const res = await fetch('/api/auth/me', { 
          cache: 'no-store',
          credentials: 'include'
        });
        // Auth0 returns 204 when not authenticated, 200 with user data when authenticated
        setSessionValid(res.status === 200);
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
        cache: 'no-store',
        credentials: 'include'
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

  async function getMetadata() {
    setLoadingMetadata(true);
    setError(null);
    try {
      const res = await fetch('/api/metadata', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMetadata(json);
    } catch (e: unknown) {
      setError((e as Error).message || 'Request failed');
    } finally {
      setLoadingMetadata(false);
    }
  }

  async function saveMetadata() {
    setSavingMetadata(true);
    setError(null);
    setMetadataSaveSuccess(null);
    try {
      const parsedMetadata = JSON.parse(metadataJson);
      const res = await fetch('/api/metadata', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedMetadata)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMetadataSaveSuccess('Metadata saved successfully!');
    } catch (e: unknown) {
      setError((e as Error).message || 'Save failed');
    } finally {
      setSavingMetadata(false);
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
                <h1 style={{ margin: 0 }}>Carbon</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a 
            href="/assignments" 
            style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View Assignments
          </a>
          <button 
            onClick={() => {
              // Clear all cookies (including Auth0)
              const cookies = document.cookie.split(';');
              const domain = window.location.hostname;
              const domainParts = domain.split('.');
              
              cookies.forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name) {
                  // Clear with current domain
                  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
                  
                  // For vercel.app subdomains, try parent domain
                  if (domain.includes('vercel.app') && domainParts.length > 2) {
                    const parentDomain = domainParts.slice(-2).join('.');
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${parentDomain}`;
                  }
                  
                  // Also try with just the domain as-is (for exact match)
                  if (domainParts.length > 1) {
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
                  }
                }
              });
              
              // Clear storage
              localStorage.clear();
              sessionStorage.clear();
              
              // Simple logout without nested returnTo to avoid CORS
              window.location.href = '/api/auth/logout';
            }} 
            style={{ color: '#dc3545', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            title="Clear all cookies and storage, then logout"
          >
            Clear Cookies
          </button>
          <button 
            onClick={() => {
              // Force re-login with prompt=login to show login screen instead of SSO
              window.location.href = '/api/auth/login?prompt=login&returnTo=' + encodeURIComponent('/dashboard');
            }} 
            style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            title="Force login prompt (shows login screen instead of auto-login)"
          >
            Force Re-Login
          </button>
          <button 
            onClick={() => window.location.href = '/api/auth/logout'} 
            style={{ color: '#666', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Log out
          </button>
        </div>
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
            <button onClick={getMetadata} disabled={loadingMetadata}>
              {loadingMetadata ? 'Loading…' : 'Get Metadata'}
            </button>
          </div>
      
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {resetError && <p style={{ color: 'crimson' }}>Reset Error: {resetError}</p>}
      {resetSuccess && <p style={{ color: 'green' }}>{resetSuccess}</p>}
      <div style={{ marginTop: 16 }}>
        <h3>Save Metadata</h3>
            <textarea
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              placeholder="Paste your metadata JSON here..."
              style={{
                width: '100%',
                height: '200px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '12px',
                color: '#000'
              }}
            />
        <button 
          onClick={saveMetadata} 
          disabled={savingMetadata || !metadataJson.trim()}
          style={{ marginTop: '8px' }}
        >
          {savingMetadata ? 'Saving...' : 'Save Metadata'}
        </button>
        {metadataSaveSuccess && <p style={{ color: 'green' }}>{metadataSaveSuccess}</p>}
      </div>
      {metadata && (
        <div style={{ marginTop: 16 }}>
          <h3>Metadata</h3>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            <JsonNode data={metadata} label="metadata" />
          </div>
        </div>
      )}
      {data && (
        <div style={{ marginTop: 16 }}>
          
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            <JsonNode data={data} label="root" />
          </div>
        </div>
      )}


        </main>
      );
    }
