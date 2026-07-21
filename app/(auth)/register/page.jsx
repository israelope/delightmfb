'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// Catch frequent domain typos before submission
const COMMON_TYPOS = {
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yaho.co.uk': 'yahoo.co.uk',
  'outlok.com': 'outlook.com',
  'hotmial.com': 'hotmail.com',
};

function checkEmailTypo(emailStr) {
  if (!emailStr || !emailStr.includes('@')) return null;
  const domain = emailStr.split('@')[1]?.toLowerCase().trim();
  if (COMMON_TYPOS[domain]) {
    return `Did you mean @${COMMON_TYPOS[domain]}?`;
  }
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState(''); // NEW STATE
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailTypoWarning, setEmailTypoWarning] = useState(''); // NEW STATE
  
  const [registered, setRegistered] = useState(false);
  const [cooperativeId, setCooperativeId] = useState(null);

  // NEW: Real-time email typo check
  function handleEmailChange(value) {
    setEmail(value);
    const suggestion = checkEmailTypo(value);
    setEmailTypoWarning(suggestion || '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const newFieldErrors = {};

    // NEW: Validate email matching
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      newFieldErrors.confirmEmail = 'Email addresses do not match.';
    }

    // Validate password matching
    if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match.';
    }

    // Stop if there are field validation errors
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          invite_code: inviteCode.trim().toUpperCase(),
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      // Log the exact error to your browser console for debugging
      console.error("Supabase Auth Error:", signUpError); 
      
      const msg = signUpError.message?.toLowerCase() ?? '';
      
      // Add a check for Supabase's masked database error
      if (msg.includes('database error saving new user')) {
        setError('Registration failed: The invite code is invalid, or the database trigger failed.');
      } else if (msg.includes('invite')) {
        setError('That invite code is invalid or has already been used.');
      } else if (msg.includes('password')) {
        setError('Password must be at least 6 characters.');
      } else if (msg.includes('already registered') || msg.includes('already exists')) {
        setError('An account with that email already exists.');
      } else {
        setError('Something went wrong creating your account. Please try again.');
      }
      return;
    }

    // Look up the cooperative ID the database trigger just generated, purely
    // to show it on the confirmation screen — it isn't needed to log in.
    if (data?.user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('cooperative_id')
        .eq('id', data.user.id)
        .single();
      setCooperativeId(profile?.cooperative_id ?? null);
    }

    setLoading(false);
    setRegistered(true);
  }

  if (registered) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cooperative/10">
          <Check className="h-6 w-6 text-cooperative" strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">You're registered</h1>
        <p className="mt-2 font-body text-sm text-ink-muted">
          Sign in any time with the email and password you just chose.
        </p>

        {cooperativeId && (
          <div className="mt-6 rounded-sm border border-rule bg-parchment px-4 py-3">
            <p className="font-body text-xs uppercase tracking-wider text-ink-muted">
              Your Cooperative ID
            </p>
            <p className="mt-1 font-mono text-lg tracking-wide text-ink">{cooperativeId}</p>
          </div>
        )}

        <p className="mt-6 font-body text-sm text-ink-muted">
          An admin still needs to verify your details against the cooperative's records before
          your dashboard unlocks.
        </p>

        <Button
          variant="primary"
          className="mt-6 w-full py-3"
          onClick={() => {
            router.refresh();
            router.push('/pending');
          }}
        >
          Continue to waiting room
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-ink">Join the cooperative</h1>
      <p className="mt-1 font-body text-sm text-ink-muted">
        You'll need the invite code your admin gave you offline.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" suppressHydrationWarning>
        <Input
          id="fullName"
          label="Full name"
          placeholder="Adaeze Nwosu"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        
        {/* UPDATED: Email Input with Typo Warning */}
        <div>
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
          />
          {emailTypoWarning && (
            <p className="mt-1 font-body text-xs font-medium text-brick">
              ⚠️ {emailTypoWarning}
            </p>
          )}
        </div>

        {/* NEW: Confirm Email Input */}
        <Input
          id="confirmEmail"
          label="Confirm email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          error={fieldErrors.confirmEmail}
          required
        />

        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <Input
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          minLength={6}
          required
        />
        <Input
          id="inviteCode"
          label="Invite code"
          placeholder="COOP-8392"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />

        {error && (
          <p role="alert" className="rounded-sm bg-brick/10 px-3 py-2 font-body text-sm text-brick">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" loading={loading} className="w-full py-3">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-ink-muted">
        Already a member?{' '}
        <Link href="/login" className="font-medium text-cooperative hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}