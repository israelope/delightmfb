'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Ban, RotateCcw, Search, ShieldPlus, ShieldMinus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const STATUS_ORDER = { pending: 0, active: 1, suspended: 2 };
const BADGE_VARIANT = { pending: 'pending', active: 'available', suspended: 'suspended' };

export default function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function loadMembers() {
    setLoading(true);
    const supabase = createClient();

    const [{ data, error: fetchError }, { data: authData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, cooperative_id, role, status, created_at')
        .order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ]);

    setCurrentUserId(authData?.user?.id ?? null);

    if (!fetchError) {
      const sorted = [...(data ?? [])].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      );
      setMembers(sorted);
    } else {
      setError(fetchError.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function updateProfile(id, fields) {
    setError('');
    setBusyId(id);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', id);

    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await loadMembers();
  }

  function handlePromote(member) {
    const confirmed = window.confirm(
      `Make ${member.full_name} an admin? They'll get full access to member management, contributions, and loans.`
    );
    if (confirmed) updateProfile(member.id, { role: 'admin' });
  }

  function handleDemote(member) {
    const confirmed = window.confirm(
      `Demote ${member.full_name} back to a regular member? They'll lose admin access and see their own passbook instead.`
    );
    if (confirmed) updateProfile(member.id, { role: 'member' });
  }

  async function handleDelete(member) {
    const typed = window.prompt(
      `This permanently deletes ${member.full_name}'s account and ALL their records (contributions, loans, repayments). This cannot be undone.\n\nType their Cooperative ID to confirm: ${member.cooperative_id}`
    );
    if (typed === null) return; // cancelled
    if (typed.trim() !== member.cooperative_id) {
      setError('Confirmation text did not match — account was not deleted.');
      return;
    }

    setError('');
    setBusyId(member.id);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Could not delete this account.');
        setBusyId(null);
        return;
      }
    } catch {
      setError('Could not reach the server. Please try again.');
      setBusyId(null);
      return;
    }

    setBusyId(null);
    await loadMembers();
  }

  // Counts always reflect the full list, independent of the search filter.
  const counts = useMemo(
    () => ({
      active: members.filter((m) => m.status === 'active').length,
      pending: members.filter((m) => m.status === 'pending').length,
      suspended: members.filter((m) => m.status === 'suspended').length,
    }),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.cooperative_id?.toLowerCase().includes(term)
    );
  }, [members, search]);

  return (
    <div className="mt-8 rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Members</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Approve against the physical records, or manage an existing account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="available">{counts.active} active</Badge>
          <Badge variant="pending">{counts.pending} pending</Badge>
          <Badge variant="suspended">{counts.suspended} suspended</Badge>
        </div>
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="text"
          placeholder="Search by name, email, or cooperative ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-sm border border-rule bg-parchment py-2.5 pl-9 pr-3 font-body text-sm text-ink placeholder:text-ink-muted/60 focus:border-cooperative focus:outline-none focus:ring-1 focus:ring-cooperative"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-body text-sm text-ink-muted">Loading…</p>
      ) : filteredMembers.length === 0 ? (
        <p className="mt-6 font-body text-sm text-ink-muted">
          {members.length === 0 ? 'No members yet.' : 'No members match your search.'}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {filteredMembers.map((m) => {
            const isSelf = m.id === currentUserId;
            const hasActions = !isSelf || m.status === 'pending';

            return (
              <li key={m.id} className="flex flex-col gap-3 py-4">
                
                {/* --- TOP ROW: User Info & Status Badge --- */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-ink">
                      {m.full_name}
                      {m.role === 'admin' && (
                        <span className="ml-2 font-mono text-[11px] uppercase tracking-wide text-brass">
                          admin
                        </span>
                      )}
                      {isSelf && (
                        <span className="ml-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                          you
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-ink-muted">{m.cooperative_id}</p>
                    <p className="truncate font-body text-xs text-ink-muted">{m.email}</p>
                  </div>
                  
                  <div className="mt-0.5 shrink-0">
                    <Badge variant={BADGE_VARIANT[m.status]}>{m.status}</Badge>
                  </div>
                </div>

                {/* --- BOTTOM ROW: Action Buttons (Forced Single Line) --- */}
                {hasActions && (
                  <div className="flex w-full flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                    
                    {m.status === 'pending' && (
                      <Button
                        variant="primary"
                        className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
                        loading={busyId === m.id}
                        onClick={() => updateProfile(m.id, { status: 'active' })}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Approve
                      </Button>
                    )}

                    {m.status === 'active' && m.role !== 'admin' && (
                      <>
                        <Button
                          variant="secondary"
                          className="shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs"
                          loading={busyId === m.id}
                          onClick={() => handlePromote(m)}
                        >
                          <ShieldPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Make admin
                        </Button>
                        <Button
                          variant="ghost"
                          className="shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs text-brick hover:bg-brick/5"
                          loading={busyId === m.id}
                          onClick={() => updateProfile(m.id, { status: 'suspended' })}
                        >
                          <Ban className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Suspend
                        </Button>
                      </>
                    )}

                    {m.status === 'active' && m.role === 'admin' && !isSelf && (
                      <Button
                        variant="secondary"
                        className="shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs"
                        loading={busyId === m.id}
                        onClick={() => handleDemote(m)}
                      >
                        <ShieldMinus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Demote to member
                      </Button>
                    )}

                    {m.status === 'suspended' && (
                      <Button
                        variant="secondary"
                        className="shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs"
                        loading={busyId === m.id}
                        onClick={() => updateProfile(m.id, { status: 'active' })}
                      >
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Reactivate
                      </Button>
                    )}

                    {!isSelf && (
                      <Button
                        variant="ghost"
                        className="shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs text-brick hover:bg-brick/5"
                        loading={busyId === m.id}
                        onClick={() => handleDelete(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
