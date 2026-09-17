import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient';

const emptyCreate = { username: '', displayName: '', primaryTeamId: '', role: 'coach' };

function AccessCodeCard({ username, code, onClose }) {
  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Username: ${username}\nOne-time access code: ${code}`);
    } catch {
      // Clipboard may be unavailable on older/insecure browsers; the code remains selectable.
    }
  };

  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-emerald-900">One-time login for {username}</div>
          <p className="text-xs text-emerald-800 mt-1">Give this code to the coach. It is only shown now and stops working after they create their password.</p>
        </div>
        <button onClick={onClose} className="text-emerald-800 hover:text-emerald-950" aria-label="Close">×</button>
      </div>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <code className="flex-1 rounded-lg bg-white border border-emerald-200 px-3 py-2 font-bold tracking-wide text-emerald-950 select-all">{code}</code>
        <button onClick={copy} className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-800">Copy login</button>
      </div>
    </div>
  );
}

export default function CoachAccessPanel({ teams = [] }) {
  const role = localStorage.getItem('rugbyPlannerCoachRole');
  const [coaches, setCoaches] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [accessCode, setAccessCode] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const sortedTeams = useMemo(() => [...teams].sort((a, b) => (a.name || '').localeCompare(b.name || '')), [teams]);

  const setCoachDrafts = (rows) => {
    setDrafts(Object.fromEntries((rows || []).map(row => [row.coachId, {
      displayName: row.displayName || '',
      primaryTeamId: row.primaryTeamId || '',
      role: row.role || 'coach',
    }])));
  };

  const load = async () => {
    if (role !== 'admin') return;
    setMessage('');
    const { data, error } = await supabase.rpc('admin_list_coaches');
    if (error) {
      setMessage('Coach Access requires the coach-management database migration.');
      return;
    }
    if (data?.error) {
      setMessage(data.error);
      return;
    }
    const rows = Array.isArray(data) ? data : [];
    setCoaches(rows);
    setCoachDrafts(rows);
  };

  useEffect(() => {
    if (!createForm.primaryTeamId && sortedTeams[0]?.id) {
      setCreateForm(prev => ({ ...prev, primaryTeamId: sortedTeams[0].id }));
    }
  }, [createForm.primaryTeamId, sortedTeams]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (role !== 'admin') return null;

  const createCoach = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setAccessCode(null);
    try {
      const { data, error } = await supabase.rpc('admin_create_coach', {
        p_username: createForm.username.trim().toLowerCase(),
        p_display_name: createForm.displayName.trim(),
        p_primary_team_id: createForm.primaryTeamId,
        p_role: createForm.role,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Could not create coach.');
      setAccessCode({ username: data.username, code: data.accessCode });
      setCreateForm({ ...emptyCreate, primaryTeamId: sortedTeams[0]?.id || '' });
      await load();
    } catch (error) {
      setMessage(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  };

  const saveCoach = async (coachId) => {
    const draft = drafts[coachId];
    if (!draft) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.rpc('admin_update_coach', {
        p_coach_id: coachId,
        p_display_name: draft.displayName.trim(),
        p_primary_team_id: draft.primaryTeamId,
        p_role: draft.role,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Could not update coach.');
      setMessage('Coach updated.');
      await load();
    } catch (error) {
      setMessage(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  };

  const resetAccess = async (coach) => {
    if (!window.confirm(`Reset ${coach.displayName || coach.username}'s password and issue a new one-time access code? Their current login sessions will be closed.`)) return;
    setBusy(true);
    setMessage('');
    setAccessCode(null);
    try {
      const { data, error } = await supabase.rpc('admin_reset_coach_access', { p_coach_id: coach.coachId });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Could not reset access.');
      setAccessCode({ username: coach.username, code: data.accessCode });
      await load();
    } catch (error) {
      setMessage(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  };

  const toggleDisabled = async (coach) => {
    const nextDisabled = !coach.disabled;
    const action = nextDisabled ? 'disable' : 'enable';
    if (!window.confirm(`${action[0].toUpperCase() + action.slice(1)} ${coach.displayName || coach.username}?`)) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.rpc('admin_set_coach_disabled', {
        p_coach_id: coach.coachId,
        p_disabled: nextDisabled,
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || `Could not ${action} coach.`);
      await load();
    } catch (error) {
      setMessage(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  };

  const removeCoach = async (coach) => {
    if (!window.confirm(`Permanently remove coach ${coach.displayName || coach.username}? This removes their planner login, not team/player history.`)) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.rpc('admin_remove_coach', { p_coach_id: coach.coachId });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Could not remove coach.');
      await load();
    } catch (error) {
      setMessage(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">👥 Coach Access</h2>
        <p className="text-sm text-gray-500 mt-1">Every active coach can view and edit both teams. The Primary team only decides which team opens after login.</p>
      </div>

      <AccessCodeCard username={accessCode?.username} code={accessCode?.code} onClose={() => setAccessCode(null)} />
      {message && <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700">{message}</div>}

      <form onSubmit={createCoach} className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 space-y-3">
        <div className="font-semibold text-gray-900">Add coach</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-gray-600">Username
            <input required minLength={3} maxLength={32} autoCapitalize="none" value={createForm.username} onChange={e => setCreateForm(prev => ({ ...prev, username: e.target.value.toLowerCase() }))} placeholder="e.g. eric" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-gray-600">Name
            <input required value={createForm.displayName} onChange={e => setCreateForm(prev => ({ ...prev, displayName: e.target.value }))} placeholder="Eric" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-gray-600">Primary team
            <select required value={createForm.primaryTeamId} onChange={e => setCreateForm(prev => ({ ...prev, primaryTeamId: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              {sortedTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-600">Role
            <select value={createForm.role} onChange={e => setCreateForm(prev => ({ ...prev, role: e.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">The coach receives a one-time access code, then creates their own password on first login.</p>
          <button type="submit" disabled={busy || !sortedTeams.length} className="shrink-0 rounded-lg bg-blue-700 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">Add Coach</button>
        </div>
      </form>

      <div className="space-y-3">
        {coaches.map(coach => {
          const draft = drafts[coach.coachId] || {};
          return (
            <div key={coach.coachId} className={`rounded-xl border p-4 ${coach.disabled ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-200 bg-white'}`}>
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="lg:w-48 shrink-0">
                  <div className="font-semibold text-gray-900">{coach.displayName}</div>
                  <div className="text-xs text-gray-500">@{coach.username}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${coach.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{coach.role === 'admin' ? 'Admin' : 'Coach'}</span>
                    {coach.mustSetPassword && <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">Awaiting password</span>}
                    {coach.disabled && <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-gray-200 text-gray-700">Disabled</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                  <label className="text-xs text-gray-600">Name
                    <input value={draft.displayName || ''} onChange={e => setDrafts(prev => ({ ...prev, [coach.coachId]: { ...prev[coach.coachId], displayName: e.target.value } }))} className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="text-xs text-gray-600">Primary team
                    <select value={draft.primaryTeamId || ''} onChange={e => setDrafts(prev => ({ ...prev, [coach.coachId]: { ...prev[coach.coachId], primaryTeamId: e.target.value } }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm">
                      {sortedTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs text-gray-600">Role
                    <select value={draft.role || 'coach'} onChange={e => setDrafts(prev => ({ ...prev, [coach.coachId]: { ...prev[coach.coachId], role: e.target.value } }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm">
                      <option value="coach">Coach</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 justify-end">
                <button onClick={() => saveCoach(coach.coachId)} disabled={busy} className="rounded-lg bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-900 disabled:opacity-50">Save</button>
                <button onClick={() => resetAccess(coach)} disabled={busy || coach.disabled} className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 disabled:opacity-50">Reset password</button>
                <button onClick={() => toggleDisabled(coach)} disabled={busy} className="rounded-lg bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-100 disabled:opacity-50">{coach.disabled ? 'Enable' : 'Disable'}</button>
                <button onClick={() => removeCoach(coach)} disabled={busy} className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50">Remove</button>
              </div>
            </div>
          );
        })}
        {!coaches.length && <div className="text-sm text-gray-500">No coach accounts found yet.</div>}
      </div>
    </section>
  );
}
