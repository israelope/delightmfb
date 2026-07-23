'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const TONES = {
  light: 'text-ink-muted hover:text-brick',
  dark: 'text-parchment-soft/80 hover:text-brass-light',
};

export default function SignOutButton({ tone = 'light' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 font-body text-sm disabled:opacity-50 ${TONES[tone]}`}
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} />
      Sign out
    </button>
  );
}
