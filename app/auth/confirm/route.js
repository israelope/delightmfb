import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/reset-password';

  if (code) {
    const supabase = await createClient();
    
    // Use exchangeCodeForSession instead of verifyOtp
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      redirect(next);
    }
  }

  // If the link is invalid or expired, send them back to try again
  redirect('/forgot-password?error=invalid-link');
}