'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('That email and password combination was not recognized.');
      return;
    }

    router.refresh();
    router.push('/pending');
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in to your passbook</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Use the email and password you registered with.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p role="alert" className="rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" loading={loading} className="w-full py-3">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-ink-muted">
        New here?{' '}
        <Link href="/register" className="font-medium text-cooperative hover:underline">
          Register with an invite code
        </Link>
      </p>
    </>
  );
}
