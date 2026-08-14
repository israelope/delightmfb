import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'admin' || callerProfile?.status !== 'active') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await request.json();
  const {
    userId,
    principal,
    interestRate,
    totalRepayable,
    dueDate,
    disbursedAt,
    createdAt,
    amountRepaid,
  } = body;

  if (!userId || !principal || !totalRepayable || !dueDate || !disbursedAt || !createdAt) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  const { data: loan, error: rpcError } = await serviceClient
    .rpc('admin_create_loan', {
      p_admin_id: user.id,
      p_user_id: userId,
      p_principal: principal,
      p_interest_rate: interestRate ?? 0,
      p_total_repayable: totalRepayable,
      p_disbursed_at: disbursedAt,
      p_due_date: dueDate,
    })
    .single();

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  if (amountRepaid && amountRepaid > 0) {
    const { error: repayError } = await serviceClient.from('loan_repayments').insert({
      loan_id: loan.id,
      amount: amountRepaid,
      date: disbursedAt,
      logged_by: user.id,
    });

    if (repayError) {
      return NextResponse.json(
        { error: 'Loan created but could not log repayment: ' + repayError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, loanId: loan.id });
}
