'use client';

import React from 'react';

interface TestJsonViewerProps {
  data: unknown;
  title?: string;
}

function Toggle({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ marginLeft: 12 }}>
      <button 
        onClick={() => setOpen(!open)} 
        aria-expanded={open}
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '14px',
          color: '#666'
        }}
      >
        {open ? '▾' : '▸'} {label}
      </button>
      {open && <div style={{ paddingLeft: 16 }}>{children}</div>}
    </div>
  );
}

function JsonNode({ data, label }: { data: unknown; label: string }) {
  if (data === null || typeof data !== 'object') {
    return (
      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '14px' }}>
        <strong style={{ color: '#333' }}>{label}:</strong> 
        <span style={{ color: data === null ? '#999' : typeof data === 'string' ? '#0066cc' : '#cc6600' }}>
          {data === null ? 'null' : typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
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

export default function TestJsonViewer({ data, title }: TestJsonViewerProps) {
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      padding: '16px', 
      backgroundColor: '#fafafa',
      marginTop: '16px'
    }}>
      {title && (
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
          {title}
        </h3>
      )}
      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #e0e0e0', 
        borderRadius: '4px', 
        padding: '12px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <JsonNode data={data} label="root" />
      </div>
    </div>
  );
}
