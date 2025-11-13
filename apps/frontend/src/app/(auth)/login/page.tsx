"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        await api.auth.signup({ email, password, name });
      } else {
        await api.auth.login({ email, password });
      }
      // Wait a moment for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/';
    } catch (err: any) {
      let errorMessage = 'An error occurred';
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (isSignup) {
        errorMessage = 'Failed to create account';
      } else {
        errorMessage = 'Invalid credentials';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-background">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-card p-6 rounded-2xl shadow-lg border">
        <h1 className="text-2xl font-semibold">{isSignup ? 'Create Account' : 'Sign in to WeTime'}</h1>
        
        {isSignup && (
          <div>
            <input 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
              placeholder="Name" 
              value={name} 
              onChange={e=>setName(e.target.value)}
              required
            />
          </div>
        )}
        
        <div>
          <input 
            type="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            placeholder="Email" 
            value={email} 
            onChange={e=>setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <input 
            type="password" 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
            placeholder="Password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        
        {error && <p className="text-red-600 text-sm">{error}</p>}
        
        <button 
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Please wait...' : (isSignup ? 'Sign up' : 'Sign in')}
        </button>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </main>
  );
}

