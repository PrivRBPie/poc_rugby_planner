import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">Loading…</div>;
  }

  if (session) {
    if (!localStorage.getItem('rugbyPlannerUsername')) {
      localStorage.setItem('rugbyPlannerUsername', session.user.email?.split('@')[0] || 'Coach');
    }
    return children;
  }

  const signInWithPassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMagicLink = async () => {
    setMessage('');
    if (!email.trim()) {
      setMessage('Enter your email address first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      setMessage(error ? error.message : 'Check your email for the secure sign-in link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <form onSubmit={signInWithPassword} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="text-4xl text-center">🏉</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rugby Planner</h1>
          <p className="text-sm text-slate-500">Coach sign-in is required to protect team data.</p>
        </div>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="coach@example.com"
          className="w-full border border-slate-300 rounded-xl px-3 py-2"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-slate-300 rounded-xl px-3 py-2"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-900 text-white font-semibold py-2.5 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={sendMagicLink}
          className="w-full rounded-xl border border-slate-300 text-slate-700 font-semibold py-2.5 disabled:opacity-60"
        >
          Send magic link instead
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </form>
    </div>
  );
}
