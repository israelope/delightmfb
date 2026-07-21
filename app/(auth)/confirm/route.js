import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/reset-password';

  if (token_hash && type) {
    const supabase = await createClient();
    
    // Verify the magic link
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    
    if (!error) {
      // If successful, redirect them to the new password page
      redirect(next);
    }
  }

  // If the link is expired or invalid, send them back
  redirect('/forgot-password?error=invalid-link');
}