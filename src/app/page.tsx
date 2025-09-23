'use client';

import Link from 'next/link';

function AuthButtons() {
  return (
    <div className="flex gap-3">
      <Link href="/api/auth/login" className="underline">Log in</Link>
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