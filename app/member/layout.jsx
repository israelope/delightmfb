import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MemberNav from '@/components/features/MemberNav';

export default async function MemberLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, cooperative_id')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-parchment md:flex">
      <MemberNav fullName={profile?.full_name} cooperativeId={profile?.cooperative_id} />
      <main className="flex-1 px-6 py-8 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}