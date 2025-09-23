'use client';

function AuthButtons() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="flex gap-3">
      <button onClick={handleLogin} className="underline" style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Log in
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Checkpoint</h1>
      <p>Sign in to view your dashboard.</p>
      <AuthButtons />
    </main>
  );
}