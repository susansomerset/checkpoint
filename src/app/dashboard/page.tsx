'use client';
import React from 'react';

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
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Record<string, unknown> | null>(null);

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

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <a href="/api/auth/logout" style={{ color: '#666', textDecoration: 'underline' }}>
          Log out
        </a>
      </div>
      <p>Retrieve the latest <code>studentData</code> JSON.</p>
      <button onClick={getStudentData} disabled={loading}>
        {loading ? 'Loading…' : 'Get Student Data'}
      </button>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {data && (
        <div style={{ marginTop: 16, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          <JsonNode data={data} label="root" />
        </div>
      )}
    </main>
  );
}
