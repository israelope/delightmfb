import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import MemberNav from '@/components/features/MemberNav';
import MemberTopbar from '@/components/features/MemberTopbar';
import SessionManager from '@/components/features/SessionManager';

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
      <SessionManager />
      <MemberNav userId={user.id} fullName={profile?.full_name} cooperativeId={profile?.cooperative_id} />
      <div className="flex-1">
        <MemberTopbar userId={user.id} fullName={profile?.full_name} />
        <main className="px-6 pb-8 md:pb-10 pt-[72px] md:pt-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}