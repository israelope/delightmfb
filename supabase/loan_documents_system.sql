-- ============================================================
-- LOAN DOCUMENTS SYSTEM
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================


-- ------------------------------------------------------------
-- 1. Private storage bucket for admin-uploaded templates
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('loan-forms', 'loan-forms', false)
on conflict (id) do nothing;

-- If this insert fails, create the bucket manually in
-- Dashboard > Storage > New bucket > name: "loan-forms" > Public: OFF
-- then re-run only the policies below.


-- Storage policies for the loan-forms bucket
-- Members (any authenticated user) can download templates.
-- Only admins can upload/replace/delete them.

drop policy if exists "Loan form templates are readable by authenticated users"
  on storage.objects;
create policy "Loan form templates are readable by authenticated users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'loan-forms');

drop policy if exists "Admins can upload loan form templates"
  on storage.objects;
create policy "Admins can upload loan form templates"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'loan-forms' and is_admin());

drop policy if exists "Admins can update loan form templates"
  on storage.objects;
create policy "Admins can update loan form templates"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'loan-forms' and is_admin());

drop policy if exists "Admins can delete loan form templates"
  on storage.objects;
create policy "Admins can delete loan form templates"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'loan-forms' and is_admin());


-- ------------------------------------------------------------
-- 2. loan_templates table
-- One active row per document type:
--   'application' = blank loan application form
--   'bond'        = blank loan bond (receipt acknowledgment)
-- ------------------------------------------------------------
create table if not exists public.loan_templates (
  id bigint generated always as identity primary key,
  type text not null unique
    check (type in ('application', 'bond')),
  file_path text not null,
  file_name text not null,
  file_size integer not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.loan_templates enable row level security;

-- Any logged-in user (member or admin) can read the active templates
-- so members can download them.
drop policy if exists "Members can read loan templates"
  on public.loan_templates;
create policy "Members can read loan templates"
  on public.loan_templates for select
  to authenticated
  using (true);

-- Only admins can create/replace/delete templates
drop policy if exists "Admins can manage loan templates"
  on public.loan_templates;
create policy "Admins can manage loan templates"
  on public.loan_templates for all
  to authenticated
  using (is_admin())
  with check (is_admin());


-- ------------------------------------------------------------
-- 3. Distinguish document types on loan_documents
-- 'application' = pre-request signed form (existing rows)
-- 'bond'        = post-disbursement signed loan bond (new)
-- ------------------------------------------------------------
alter table public.loan_documents
  add column if not exists document_type text not null default 'application'
  check (document_type in ('application', 'bond'));

comment on column public.loan_documents.document_type is
  'application = pre-request loan form; bond = post-disbursement receipt acknowledgment';


-- ------------------------------------------------------------
-- 4. DELETE policies on loan_documents
--
-- Members:
--   - CAN delete their own PRE-REQUEST application form only
--     (loan_id IS NULL) so they can replace a mistake before
--     submitting a loan request.
--   - CANNOT delete a bond once submitted. Once uploaded, the
--     bond is locked on the member side.
--
-- Admins:
--   - CAN delete any loan document, including bonds, so they
--     can reject a bond and let the member re-upload a fresh one.
-- ------------------------------------------------------------
drop policy if exists "Members can delete own pre-request application"
  on public.loan_documents;
create policy "Members can delete own pre-request application"
  on public.loan_documents for delete
  to authenticated
  using (
    auth.uid() = user_id
    and document_type = 'application'
    and loan_id is null
  );

drop policy if exists "Admins can delete loan documents"
  on public.loan_documents;
create policy "Admins can delete loan documents"
  on public.loan_documents for delete
  to authenticated
  using (is_admin());


-- ------------------------------------------------------------
-- 5. Helpful indexes
-- ------------------------------------------------------------
create index if not exists idx_loan_documents_loan_type
  on public.loan_documents (loan_id, document_type);

create index if not exists idx_loan_documents_user_type
  on public.loan_documents (user_id, document_type);


-- ============================================================
-- DONE. Expected result:
--   - bucket "loan-forms" (private)
--   - table "loan_templates" with 2 RLS policies
--   - loan_documents.document_type column (default 'application')
--   - DELETE policies: member = own pre-request application only;
--     admin = any document (for bond rejection)
--   - 2 indexes
-- ============================================================
