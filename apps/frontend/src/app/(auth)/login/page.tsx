"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState('alice@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.auth.login({ email, password });
      r.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    }
  };
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold">Sign in to WeTime</h1>
        <input className="w-full rounded border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full rounded border p-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-sky-600 text-white py-2 rounded">Sign in</button>
      </form>
    </main>
  );
}

