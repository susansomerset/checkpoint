'use client';

function AuthButtons() {
  return (
    <div className="flex gap-3">
      <a href="/api/auth/login" className="underline">Log in</a>
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