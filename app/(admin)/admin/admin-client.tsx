'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { SERVICES } from '@/lib/services';

function toTitleCase(str: string) {
  return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

type User = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  pin_hash: string | null;
};

type Entry = {
  id: string;
  service_id: string;
  date: string;
  team: string;
  what: string;
  created_by_email: string;
  created_at: string;
};

type Tab = 'users' | 'entries' | 'settings';

export function AdminClient({ adminName, userNames }: { adminName: string; userNames: Record<string, string> }) {
  const [tab, setTab] = useState<Tab>('entries');

  // ── Users state ─────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<{ full_name: string; email: string }>({ full_name: '', email: '' });
  const [editUserError, setEditUserError] = useState('');
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [adminActionId, setAdminActionId] = useState<string | null>(null);

  // ── PIN change state ─────────────────────────────────────────────────────────
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' });
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // ── Entries state ────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [filterService, setFilterService] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Entry>>({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const res = await fetch('/api/admin/users');
    const json = await res.json();
    setUsers(json.users ?? []);
    setUsersLoading(false);
  }, []);

  const fetchEntries = useCallback(async () => {
    setEntriesLoading(true);
    const res = await fetch('/api/entries');
    const json = await res.json();
    // sort newest first
    const sorted = [...(json.entries ?? [])].sort(
      (a: Entry, b: Entry) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setEntries(sorted);
    setEntriesLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // ── Add user ─────────────────────────────────────────────────────────────────
  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: addName, email: addEmail }),
    });
    const json = await res.json();
    setAddLoading(false);
    if (!res.ok) { setAddError(json.error); return; }
    setAddName('');
    setAddEmail('');
    fetchUsers();
  }

  // ── Edit user ────────────────────────────────────────────────────────────────
  function startEditUser(user: User) {
    setEditingUserId(user.id);
    setEditUserForm({ full_name: user.full_name, email: user.email });
    setEditUserError('');
  }

  async function handleSaveUser(id: string) {
    setEditUserError('');
    setEditUserLoading(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: toTitleCase(editUserForm.full_name), email: editUserForm.email }),
    });
    const json = await res.json();
    setEditUserLoading(false);
    if (!res.ok) { setEditUserError(json.error); return; }
    setEditingUserId(null);
    fetchUsers();
  }

  // ── Delete user ──────────────────────────────────────────────────────────────
  async function handleDeleteUser(id: string, name: string) {
    if (!confirm(`Remove user "${name}"? This does not delete their entries.`)) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  }

  // ── Make / remove admin ───────────────────────────────────────────────────────
  async function handleMakeAdmin(id: string, name: string) {
    if (!confirm(`Make "${name}" an admin? They'll receive an email to set their PIN.`)) return;
    setAdminActionId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ makeAdmin: true }),
    });
    const json = await res.json();
    setAdminActionId(null);
    if (!res.ok) { alert(json.error); return; }
    fetchUsers();
  }

  async function handleRemoveAdmin(id: string, name: string) {
    if (!confirm(`Remove admin access from "${name}"? Their PIN will be cleared.`)) return;
    setAdminActionId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeAdmin: true }),
    });
    const json = await res.json();
    setAdminActionId(null);
    if (!res.ok) { alert(json.error); return; }
    fetchUsers();
  }

  async function handleResendInvite(id: string, name: string) {
    setAdminActionId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resendInvite: true }),
    });
    const json = await res.json();
    setAdminActionId(null);
    if (!res.ok && res.status !== 207) { alert(json.error); return; }
    if (res.status === 207) { alert(json.error); return; }
    alert(`Invite email resent to ${name}.`);
    fetchUsers();
  }

  async function handleCopyInviteLink(id: string) {
    setAdminActionId(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ getInviteLink: true }),
    });
    const json = await res.json();
    setAdminActionId(null);
    if (!res.ok) { alert(json.error); return; }
    await navigator.clipboard.writeText(json.link);
    alert('Setup link copied! Share it directly with the user.');
  }

  // ── Change PIN ───────────────────────────────────────────────────────────────
  async function handleChangePIN(e: React.FormEvent) {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');
    if (pinForm.next.length < 4) { setPinError('New PIN must be at least 4 digits.'); return; }
    if (pinForm.next !== pinForm.confirm) { setPinError('New PINs do not match.'); return; }
    setPinLoading(true);
    const res = await fetch('/api/admin/pin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin: pinForm.current, newPin: pinForm.next }),
    });
    const json = await res.json();
    setPinLoading(false);
    if (!res.ok) { setPinError(json.error); return; }
    setPinSuccess('PIN updated successfully! Use your new PIN next time you sign in.');
    setPinForm({ current: '', next: '', confirm: '' });
  }

  // ── Edit entry ───────────────────────────────────────────────────────────────
  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setEditForm({ service_id: entry.service_id, date: entry.date, team: entry.team, what: entry.what });
    setEditError('');
  }

  async function handleSaveEdit(id: string) {
    setEditError('');
    setEditLoading(true);
    const res = await fetch(`/api/admin/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    setEditLoading(false);
    if (!res.ok) { setEditError(json.error); return; }
    setEditingId(null);
    fetchEntries();
  }

  // ── Delete entry ─────────────────────────────────────────────────────────────
  async function handleDeleteEntry(id: string, date: string) {
    if (!confirm(`Delete entry for ${date}? This cannot be undone.`)) return;
    await fetch(`/api/admin/entries/${id}`, { method: 'DELETE' });
    fetchEntries();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function serviceName(id: string) {
    return SERVICES.find(s => s.id === id)?.name ?? id;
  }

  const filteredEntries = filterService
    ? entries.filter(e => e.service_id === filterService)
    : entries;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-stone-800">⚙️ Admin</span>
            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
              {adminName}
            </span>
          </div>
          <a href="/dashboard" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
            ← Back to app
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-lg w-fit">
          {(['entries', 'users', 'settings'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t === 'entries' ? `Entries (${entries.length})` : t === 'users' ? `Users (${users.length})` : '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* ── ENTRIES TAB ─────────────────────────────────────────────────────── */}
        {tab === 'entries' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-stone-800">Service Entries</h2>
              <select
                value={filterService}
                onChange={e => setFilterService(e.target.value)}
                className="ml-auto text-sm border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">All services</option>
                {SERVICES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {entriesLoading ? (
              <p className="text-stone-400 text-sm py-8 text-center">Loading entries…</p>
            ) : filteredEntries.length === 0 ? (
              <p className="text-stone-400 text-sm py-8 text-center">No entries found.</p>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 bg-stone-50">
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Service</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Team</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Activity</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Added by</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, i) => (
                        <Fragment key={entry.id}>
                          <tr
                            className={`border-b border-stone-50 hover:bg-stone-50 transition-colors ${
                              i === filteredEntries.length - 1 ? 'border-b-0' : ''
                            }`}
                          >
                            {editingId === entry.id ? (
                              // ── Edit row ──────────────────────────────────────
                              <>
                                <td className="px-4 py-2">
                                  <input
                                    type="date"
                                    lang="en-GB"
                                    value={editForm.date ?? ''}
                                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                                    className="border border-stone-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <select
                                    value={editForm.service_id ?? ''}
                                    onChange={e => setEditForm(f => ({ ...f, service_id: e.target.value }))}
                                    className="border border-stone-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  >
                                    {SERVICES.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    value={editForm.team ?? ''}
                                    onChange={e => setEditForm(f => ({ ...f, team: e.target.value }))}
                                    className="border border-stone-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    value={editForm.what ?? ''}
                                    onChange={e => setEditForm(f => ({ ...f, what: e.target.value }))}
                                    className="border border-stone-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </td>
                                <td className="px-4 py-2 text-stone-400 text-xs">{userNames[entry.created_by_email] ?? 'Unknown'}</td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => handleSaveEdit(entry.id)}
                                      disabled={editLoading}
                                      className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                      {editLoading ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              // ── Read row ──────────────────────────────────────
                              <>
                                <td className="px-4 py-3 text-stone-700 whitespace-nowrap">{formatDate(entry.date)}</td>
                                <td className="px-4 py-3">
                                  <span className="text-stone-700">{serviceName(entry.service_id)}</span>
                                </td>
                                <td className="px-4 py-3 text-stone-600 max-w-[160px] truncate">{entry.team}</td>
                                <td className="px-4 py-3 text-stone-600 max-w-[200px] truncate">{entry.what}</td>
                                <td className="px-4 py-3 text-stone-600">{userNames[entry.created_by_email] ?? 'Unknown'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => startEdit(entry)}
                                      className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEntry(entry.id, entry.date)}
                                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                          {editingId === entry.id && editError && (
                            <tr>
                              <td colSpan={6} className="px-4 pb-2">
                                <p className="text-red-500 text-xs">{editError}</p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ───────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="space-y-6">
            {/* Add user form */}
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Add New User</h3>
              <form onSubmit={handleAddUser} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-stone-500 mb-1">Full Name</label>
                  <input
                    required
                    placeholder="John Smith"
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-stone-500 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {addLoading ? 'Adding…' : 'Add User'}
                </button>
              </form>
              {addError && <p className="text-red-500 text-xs mt-2">{addError}</p>}
            </div>

            {/* Users table */}
            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-4">All Users</h2>
              {usersLoading ? (
                <p className="text-stone-400 text-sm py-8 text-center">Loading users…</p>
              ) : users.length === 0 ? (
                <p className="text-stone-400 text-sm py-8 text-center">No users found.</p>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 bg-stone-50">
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-stone-500">Joined</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, i) => (
                        <Fragment key={user.id}>
                          <tr className={`hover:bg-stone-50 transition-colors ${i < users.length - 1 ? 'border-b border-stone-50' : ''}`}>
                            {editingUserId === user.id ? (
                              <>
                                <td className="px-4 py-2">
                                  <input
                                    value={editUserForm.full_name}
                                    onChange={e => setEditUserForm(f => ({ ...f, full_name: e.target.value }))}
                                    className="border border-stone-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="email"
                                    value={editUserForm.email}
                                    onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))}
                                    className="border border-stone-200 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400"
                                  />
                                </td>
                                <td className="px-4 py-2 text-stone-400 text-xs whitespace-nowrap">
                                  {user.created_at.slice(8, 10)}/{user.created_at.slice(5, 7)}/{user.created_at.slice(0, 4)}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      onClick={() => handleSaveUser(user.id)}
                                      disabled={editUserLoading}
                                      className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                      {editUserLoading ? 'Saving…' : 'Save'}
                                    </button>
                                    <button
                                      onClick={() => setEditingUserId(null)}
                                      className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded-lg transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 font-medium text-stone-800">{user.full_name}</td>
                                <td className="px-4 py-3 text-stone-500">{user.email}</td>
                                <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">
                                  {user.created_at.slice(8, 10)}/{user.created_at.slice(5, 7)}/{user.created_at.slice(0, 4)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {user.email.toLowerCase() === 'basemmorkos98@gmail.com' ? (
                                    <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Super Admin</span>
                                  ) : (
                                    <div className="flex items-center gap-3 justify-end">
                                      {user.is_admin && (
                                        <>
                                          <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">Admin</span>
                                          {!user.pin_hash && (
                                            <>
                                              <button
                                                onClick={() => handleResendInvite(user.id, user.full_name)}
                                                disabled={adminActionId === user.id}
                                                className="text-xs text-stone-400 hover:text-stone-600 font-medium transition-colors disabled:opacity-50"
                                                title="Resend PIN setup email"
                                              >
                                                {adminActionId === user.id ? '…' : 'Resend Invite'}
                                              </button>
                                              <button
                                                onClick={() => handleCopyInviteLink(user.id)}
                                                disabled={adminActionId === user.id}
                                                className="text-xs text-stone-400 hover:text-stone-600 font-medium transition-colors disabled:opacity-50"
                                                title="Copy setup link to clipboard"
                                              >
                                                Copy Link
                                              </button>
                                            </>
                                          )}
                                        </>
                                      )}
                                      <button
                                        onClick={() => startEditUser(user)}
                                        className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                                      >
                                        Edit
                                      </button>
                                      {user.is_admin ? (
                                        <button
                                          onClick={() => handleRemoveAdmin(user.id, user.full_name)}
                                          disabled={adminActionId === user.id}
                                          className="text-xs text-violet-500 hover:text-violet-700 font-medium transition-colors disabled:opacity-50"
                                        >
                                          {adminActionId === user.id ? '…' : 'Remove Admin'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleMakeAdmin(user.id, user.full_name)}
                                          disabled={adminActionId === user.id}
                                          className="text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors disabled:opacity-50"
                                        >
                                          {adminActionId === user.id ? '…' : 'Make Admin'}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                          {editingUserId === user.id && editUserError && (
                            <tr>
                              <td colSpan={4} className="px-4 pb-2">
                                <p className="text-red-500 text-xs">{editUserError}</p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ── SETTINGS TAB ────────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="max-w-md space-y-6">
            <h2 className="text-lg font-semibold text-stone-800">Admin Settings</h2>

            {/* Test email */}
            <TestEmailCard />

            {/* Change PIN */}
            <div className="bg-white rounded-xl border border-stone-200 p-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-1">Change Admin PIN</h3>
              <p className="text-xs text-stone-400 mb-4">Your PIN must be at least 4 digits. You&apos;ll need it next time you sign in.</p>
              <form onSubmit={handleChangePIN} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Current PIN</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={pinForm.current}
                    onChange={e => setPinForm(f => ({ ...f, current: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">New PIN</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={pinForm.next}
                    onChange={e => setPinForm(f => ({ ...f, next: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">Confirm New PIN</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={pinForm.confirm}
                    onChange={e => setPinForm(f => ({ ...f, confirm: e.target.value }))}
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                {pinError && <p className="text-red-500 text-xs">{pinError}</p>}
                {pinSuccess && <p className="text-green-600 text-xs font-medium">{pinSuccess}</p>}
                <button
                  type="submit"
                  disabled={pinLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 w-fit"
                >
                  {pinLoading ? 'Saving…' : 'Update PIN'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TestEmailCard() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleTest() {
    setStatus('sending');
    setMessage('');
    const res = await fetch('/api/admin/test-email', { method: 'POST' });
    const json = await res.json();
    if (res.ok) {
      setStatus('ok');
      setMessage('Test email sent! Check your inbox.');
    } else {
      setStatus('error');
      setMessage(json.error ?? 'Unknown error');
    }
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h3 className="text-sm font-semibold text-stone-700 mb-1">Email Connection</h3>
      <p className="text-xs text-stone-400 mb-4">Send a test email to yourself to confirm Resend is correctly configured.</p>
      <button
        onClick={handleTest}
        disabled={status === 'sending'}
        className="bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send Test Email'}
      </button>
      {status === 'ok' && <p className="text-green-600 text-xs font-medium mt-3">✅ {message}</p>}
      {status === 'error' && <p className="text-red-500 text-xs mt-3">❌ {message}</p>}
    </div>
  );
}
