'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AuthButtons() {
  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <div className="flex gap-3">
      <button onClick={handleLogin} className="underline" style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Log in
      </button>
      <button onClick={handleLogout} className="underline" style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Log out
      </button>
    </div>
  );
}

export default function Home() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Checkpoint</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Checkpoint</h1>
        <p>Error: {error.message}</p>
        <AuthButtons />
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Checkpoint</h1>
      <p>Sign in to view your dashboard.</p>
      <AuthButtons />
    </main>
  );
}