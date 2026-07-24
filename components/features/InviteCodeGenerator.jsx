'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const MAX_ATTEMPTS = 5;

function randomCode() {
  const digits = Math.floor(1000 + Math.random() * 9000); // 4-digit suffix
  return `COOP-${digits}`;
}

export default function InviteCodeGenerator() {
  const [codes, setCodes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [deletingCode, setDeletingCode] = useState(null);
  const [clearingUsed, setClearingUsed] = useState(false);

  async function loadCodes() {
    setLoadingList(true);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('invite_codes')
      .select('code, is_used, created_at')
      .order('created_at', { ascending: false });

    if (!fetchError) setCodes(data ?? []);
    setLoadingList(false);
  }

  useEffect(() => {
    loadCodes();
  }, []);

  async function handleGenerate() {
    setError('');
    setGenerating(true);
    const supabase = createClient();

    let lastError = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const code = randomCode();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from('invite_codes')
        .insert({ code, created_by: user?.id });

      if (!insertError) {
        setGenerating(false);
        await loadCodes();
        return;
      }
      lastError = insertError;
      // 23505 = unique_violation — collided with an existing code, try again.
      if (insertError.code !== '23505') break;
    }

    setGenerating(false);
    setError(lastError?.message ?? 'Could not generate a code. Please try again.');
  }

  function handleCopy(code) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
  }

  async function handleDelete(code) {
    setError('');
    setDeletingCode(code);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('invite_codes').delete().eq('code', code);
    setDeletingCode(null);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadCodes();
  }

  async function handleClearUsed() {
    const confirmed = window.confirm(
      `Delete all ${used.length} used invite code${used.length === 1 ? '' : 's'}? This can't be undone.`
    );
    if (!confirmed) return;

    setError('');
    setClearingUsed(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('invite_codes').delete().eq('is_used', true);
    setClearingUsed(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadCodes();
  }

  const available = codes.filter((c) => !c.is_used);
  const used = codes.filter((c) => c.is_used);

  return (
    <div className="rounded-sm border border-rule bg-parchment-soft p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Invite codes</h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Generate a code and hand it to a prospective member offline.
          </p>
        </div>
        <Button variant="primary" loading={generating} onClick={handleGenerate}>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New code
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
          {error}
        </p>
      )}

      <div className="mt-6">
        <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
          Available ({available.length})
        </p>
        {loadingList ? (
          <p className="mt-3 font-body text-sm text-ink-muted">Loading…</p>
        ) : available.length === 0 ? (
          <p className="mt-3 font-body text-sm text-ink-muted">
            No unused codes yet — generate one above.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {available.map(({ code }) => (
              <li key={code} className="flex items-center justify-between rounded-sm border border-rule bg-parchment px-3.5 py-2.5">
                <span className="font-mono text-sm tracking-wide text-ink">{code}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="available">Available</Badge>
                  <button
                    onClick={() => handleCopy(code)}
                    className="text-ink-muted hover:text-cooperative"
                    aria-label={`Copy ${code}`}
                  >
                    {copiedCode === code ? (
                      <Check className="h-4 w-4 text-cooperative" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(code)}
                    disabled={deletingCode === code}
                    className="text-ink-muted hover:text-brick disabled:opacity-50"
                    aria-label={`Delete ${code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {used.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="font-body text-xs font-medium uppercase tracking-wider text-ink-muted">
              Used ({used.length})
            </p>
            <button
              onClick={handleClearUsed}
              disabled={clearingUsed}
              className="font-body text-xs text-brick hover:underline disabled:opacity-50"
            >
              {clearingUsed ? 'Clearing…' : 'Clear all used'}
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {used.map(({ code }) => (
              <li key={code} className="flex items-center justify-between rounded-sm border border-rule px-3.5 py-2.5 opacity-60">
                <span className="font-mono text-sm tracking-wide text-ink">{code}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="used">Used</Badge>
                  <button
                    onClick={() => handleDelete(code)}
                    disabled={deletingCode === code}
                    className="text-ink-muted hover:text-brick disabled:opacity-50"
                    aria-label={`Delete ${code}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}