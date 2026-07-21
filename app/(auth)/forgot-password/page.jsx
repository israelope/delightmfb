'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});

    // Validate email matching
    if (email.trim() !== confirmEmail.trim()) {
      setFieldErrors({ confirmEmail: 'Emails do not match.' });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    // Using the default Supabase flow with a redirectTo URL
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Check your email</h1>
        <p className="mt-3 font-body text-sm text-ink-muted">
          If an account exists for {email}, we've sent a link to reset the password.
        </p>
        <Link href="/login" className="mt-6 inline-block font-body text-sm font-medium text-cooperative hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        Enter the email you registered with and we'll send you a reset link.
      </p>
      
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" suppressHydrationWarning>
        <Input
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          id="confirmEmail"
          label="Confirm email address"
          type="email"
          autoComplete="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          error={fieldErrors.confirmEmail}
          required
        />

        <Button type="submit" variant="primary" loading={loading} className="w-full py-3">
          Send reset link
        </Button>
      </form>
      
      <p className="mt-6 text-center font-body text-sm text-ink-muted">
        <Link href="/login" className="font-medium text-cooperative hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}