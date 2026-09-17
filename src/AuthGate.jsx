import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

async function ensureAnonymousSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let session = sessionData.session;

  // Username/password auth deliberately uses an anonymous Supabase identity.
  if (session && !session.user?.is_anonymous) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    session = null;
  }

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }

  return session;
}

function rememberCoach(data, { startOnPrimaryTeam = false } = {}) {
  localStorage.setItem('rugbyPlannerUsername', data.displayName || data.username || 'Coach');

  if (data.primaryTeamId) {
    localStorage.setItem('rugbyPlannerPrimaryTeamId', data.primaryTeamId);
    if (startOnPrimaryTeam) localStorage.setItem('rugbyPlannerStartTeamId', data.primaryTeamId);
  }

  if (data.role) localStorage.setItem('rugbyPlannerCoachRole', data.role);
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [coach, setCoach] = useState(undefined);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const nextSession = await ensureAnonymousSession();
        if (cancelled) return;
        setSession(nextSession);

        const { data, error } = await supabase.rpc('current_coach');
        if (cancelled) return;

        if (error) {
          setCoach(null);
          setMessage('Username/password login is not configured in the database yet.');
          return;
        }

        if (data?.ok) {
          rememberCoach(data);
          setCoach(data);
        } else {
          setCoach(null);
        }
      } catch (error) {
        if (cancelled) return;
        setSession(null);
        setCoach(null);
        const msg = error?.message || String(error);
        if (msg.toLowerCase().includes('anonymous')) {
          setMessage('Anonymous sign-ins must be enabled in Supabase Authentication settings before username login can be used.');
        } else {
          setMessage(msg);
        }
      }
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!cancelled) setSession(nextSession || null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const nextSession = session?.user?.is_anonymous ? session : await ensureAnonymousSession();
      setSession(nextSession);

      const { data, error } = await supabase.rpc('coach_login', {
        p_username: username.trim(),
        p_password: password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data?.ok) {
        setMessage(data?.error || 'Invalid username, password or access code.');
        return;
      }

      rememberCoach(data, { startOnPrimaryTeam: !data.mustSetPassword });
      setCoach(data);
      setPassword('');
    } catch (error) {
      setMessage(error?.message || String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPassword = async (event) => {
    event.preventDefault();
    setMessage('');

    if (newPassword.length < 8) {
      setMessage('Choose a password with at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('coach_set_password', {
        p_new_password: newPassword,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data?.ok) {
        setMessage(data?.error || 'Password setup failed. Please sign in again.');
        return;
      }

      rememberCoach(data, { startOnPrimaryTeam: true });
      setCoach(data);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(error?.message || String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session === undefined || coach === undefined) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">Loading…</div>;
  }

  if (session && coach?.ok && !coach.mustSetPassword) {
    return React.isValidElement(children)
      ? React.cloneElement(children, { coachRole: coach.role || 'coach' })
      : children;
  }

  if (session && coach?.ok && coach.mustSetPassword) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
        <form onSubmit={createPassword} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="text-4xl text-center">🏉</div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create your password</h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome {coach.displayName || coach.username}. Your one-time access code was accepted. Choose your own password to continue.
            </p>
          </div>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-slate-300 rounded-xl px-3 py-2"
          />
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full border border-slate-300 rounded-xl px-3 py-2"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-slate-900 text-white font-semibold py-2.5 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save password & continue'}
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
          <p className="text-xs text-slate-400">Your one-time access code stops working after the password is created.</p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <form onSubmit={signIn} className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="text-4xl text-center">🏉</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Rugby Planner</h1>
          <p className="text-sm text-slate-500">Sign in with your coach username and password.</p>
        </div>
        <input
          type="text"
          required
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full border border-slate-300 rounded-xl px-3 py-2"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password or one-time access code"
          className="w-full border border-slate-300 rounded-xl px-3 py-2"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-slate-900 text-white font-semibold py-2.5 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
        {message && <p className="text-sm text-slate-600">{message}</p>}
        <p className="text-xs text-slate-400">New coaches receive a username and one-time access code from an admin. No email address or phone number is required.</p>
      </form>
    </div>
  );
}
