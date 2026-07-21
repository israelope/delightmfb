'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    // This actually changes the password in the database
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError('This reset link has expired or already been used. Please request a new one.');
      return;
    }

    // Sign them out of the temporary session so they have to log in normally
    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(true);
    
    setTimeout(() => router.push('/login'), 2000);
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Password updated</h1>
        <p className="mt-3 font-body text-sm text-ink-muted">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink">Choose a new password</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        This link is single-use — set your new password below.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Input
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" loading={loading} className="w-full py-3">
          Update password
        </Button>
      </form>
    </>
  );
}