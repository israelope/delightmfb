Delight MFB — Cooperative Ledger & Membership Platform

A digital ledger and light CRM for **Delight Thrift & Credit Cooperative
Society**, replacing paper passbooks and manual bookkeeping with a
transparent, admin-verified record of every member's savings, loans, and
goal-based contributions.

This is **not** a payment platform. No money moves through the app —
contributions and repayments happen offline (cash, bank transfer, etc.)
and an admin logs them here so every member can see an always-current,
trustworthy record of their own standing.

---

## Table of Contents

- [What This App Does](#what-this-app-does)
- [Tech Stack](#tech-stack)
- [How Membership Works](#how-membership-works)
- [Member-Facing Features](#member-facing-features)
- [Admin-Facing Features](#admin-facing-features)
- [Security Model](#security-model)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Known Limitations & Possible Next Steps](#known-limitations--possible-next-steps)

---

## What This App Does

Delight MFB gives a cooperative society three things a spreadsheet and a
paper ledger can't:

1. **A single source of truth.** Every contribution, loan, and repayment
   is one row in one database — no reconciling three different
   notebooks.
2. **Self-service transparency for members.** A member can check their
   own savings balance, loan status, and progress toward a savings goal
   at any time, without calling or visiting the office.
3. **Controlled, human-verified membership.** Nobody gets into the
   system by signing up freely — every account is checked against the
   cooperative's real-world records by an admin before it's activated.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (no TypeScript) |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (Postgres, Auth, Storage, Row Level Security) |
| Charts | Recharts |
| Icons | lucide-react |
| Image compression | browser-image-compression |

There is no separate backend server — Supabase's Postgres functions,
triggers, and Row Level Security policies *are* the business logic layer.
Next.js talks to Supabase directly from Server Components and Client
Components, with one exception: account deletion, which needs Supabase's
service-role admin API and runs through a locked-down Next.js API route
(`/api/admin/delete-user`) instead.

## How Membership Works

There's no public sign-up. Membership is invite-only and every account
is manually verified:

1. An **admin generates a single-use invite code** from the admin panel.
2. A prospective member registers with their name, email, password, and
   that code.
3. Their account is created in a `pending` state — they can log in, but
   only see a waiting-room screen, nothing else.
4. An admin checks the new member against the cooperative's offline
   records and **approves** them, which unlocks their full dashboard.

No email/SMS verification service is used (kept at $0 cost) — the human
admin-approval step *is* the verification.

## Member-Facing Features

- **Dashboard** — savings/loan stat cards, a savings-growth chart (full
  year, with a "this year / past year" toggle), fund allocation donut,
  recent transactions, and a loan repayment summary.
- **Passbook** (`/member/passbook`) — full contribution history,
  searchable by month, paginated 10 at a time.
- **Loans** (`/member/loans`) — see borrowing limit (2x total savings),
  request a loan, see interest and total repayable up front, track
  real repayment progress. Loan requests require:
  - **6 consecutive months** of contributions (admin can lower this to
    3 per member),
  - a **signed loan-intent document** upload (PDF or image, compressed
    client-side).
  - A member can request a **top-up loan** alongside an existing one
    once that loan is at least **75% repaid**.
- **Products** (`/member/products`) — goal-based savings. A member can
  enroll in any of six products (Education, Home Appliances, Land,
  Christmas, Eid-Kabir, Kitchen Utensils) with their own target amount,
  and watch a progress bar and pie chart fill in as payments are applied.
- **Receipt upload** — a member can upload proof of payment (for general
  savings or for a specific product goal), which notifies every admin
  and appears in their review queue.
- **Notifications** — a bell with an unread badge; members are notified
  automatically when a contribution, repayment, loan status change, or
  goal payment is logged against their account.

## Admin-Facing Features

Reachable from a dedicated admin sidebar:

- **Overview** — cooperative-wide stat cards (members, savings, loans
  outstanding, pending requests), a monthly collections chart (savings /
  repayments / loans disbursed, full year with a past-year toggle), fund
  allocation donut, loan status breakdown, and pending-action shortcuts.
- **Members** — approve pending accounts, suspend/reactivate, promote a
  member to admin or demote an admin back to a member, search by
  name/email/cooperative ID, set a member's loan-eligibility window (3 or
  6 months), and permanently delete an account (with a typed
  confirmation and safeguards against deleting yourself or the last
  remaining admin).
- **Invite Codes** — generate codes, copy them, delete unused ones, or
  clear all used codes at once.
- **Contributions** — batch-log a month's contributions for many members
  at once, or search a single member to log/edit/delete individual
  entries across multiple months.
- **Loans** — approve/reject requests, set the interest rate and due
  date (adjustable at request or approval stage), disburse, log
  repayments, view a member's uploaded loan document, search/filter by
  status and date, and remove resolved (cleared/rejected) loans from
  history.
- **Product Savings** — set each product's default target amount, and
  log a payment directly against any member's goal — this is the path
  for payments reported offline (phone call, WhatsApp, in person) with
  no receipt involved.
- **Receipts** — review member-uploaded receipts, filter by status,
  search by member, and apply a single payment across savings, a loan
  repayment, and multiple product goals in one action.

## Security Model

- **Row Level Security (RLS)** is enabled on every table. A member can
  only ever read their own rows (or nothing, for admin-only tables); an
  `is_admin()` Postgres function gates admin-only access everywhere.
- **Sensitive fields are trigger-locked.** A member cannot change their
  own `role`, `status`, `email`, `cooperative_id`, or
  `loan_eligibility_months` — even via a direct API call — because a
  database trigger silently reverts those fields unless the actor is an
  admin.
- **Server-side business rules, not just UI checks.** Loan eligibility,
  the borrowing limit, the 75% top-up threshold, and the 6-consecutive-
  month requirement are all enforced inside Postgres triggers, not just
  hidden in the frontend — so they can't be bypassed by calling the API
  directly.
- **Money never silently disappears.** If a logged repayment or goal
  payment is larger than what's actually owed, the excess is
  automatically redirected into the member's regular savings via a
  database trigger, rather than being lost.
- **Account deletion uses the Supabase service-role key**, which is
  never exposed to the browser. It's read only inside
  `app/api/admin/delete-user/route.js`, which itself re-verifies the
  caller is an active admin before doing anything, blocks deleting your
  own account, and blocks deleting the last remaining admin.
- **Private storage buckets.** Loan documents and payment receipts live
  in non-public Supabase Storage buckets; access is governed entirely by
  RLS-equivalent storage policies (a member can only reach their own
  files; admins can reach all of them), and files are only ever served
  via short-lived signed URLs, never direct public links.

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | One row per user — name, cooperative ID, role, status, loan eligibility window |
| `invite_codes` | Single-use registration codes |
| `contributions` | Monthly savings entries |
| `loans` | Loan requests through their full lifecycle (requested → approved → disbursed → cleared/rejected) |
| `loan_repayments` | Ledger of amounts repaid against a loan |
| `loan_documents` | Signed loan-intent uploads, linked to the loan they were used for |
| `cooperative_settings` | Single-row table holding the default loan interest rate |
| `contribution_receipts` | Member-uploaded proof of payment (general or goal-tagged) |
| `product_types` | Catalog of the six savings products and their default targets |
| `member_product_goals` | A member's enrollment in a product, with their own target and running total |
| `product_goal_contributions` | Ledger of amounts applied toward a product goal |
| `notifications` | In-app notifications, auto-generated by triggers |

A `loan_balances` view computes each loan's real outstanding balance
(principal + interest, minus repayments) so the frontend never has to
re-derive that math.

All of the SQL — table definitions, RLS policies, and trigger functions —
lives in the `supabase/` folder as a series of migration files, meant to
be run in order in the Supabase SQL Editor.

## Project Structure

```
app/
  (auth)/            Login, register, forgot/reset password
  admin/              Admin dashboard, members, invite codes,
                       contributions, loans, product-goals, receipts
  member/             Member dashboard, passbook, loans, products
  about/ products/     Public marketing pages
  api/admin/           Service-role-only API routes
  auth/confirm/        Server-side password-reset token exchange
components/
  ui/                 Small reusable primitives (Button, Badge, ProgressBar, …)
  features/           Feature-specific widgets (one file per dashboard section)
lib/
  
  utils.js            Formatting helpers (currency, dates, relative time)
  fileUpload.js        Client-side image compression + upload validation
supabase/             SQL migrations, run in order against your project
proxy.js              Route protection: auth state, approval status, role
```

## Getting Started

1. Create a Supabase project.
2. In **Authentication → Providers → Email**, turn off "Confirm email"
   (members never receive a real confirmation email).
3. Run every file in `supabase/` in the Supabase SQL Editor, **in the
   order they were added** (each one documents what it depends on at the
   top of the file).
4. Copy `.env.local.example` to `.env.local` and fill in your Supabase
   project URL, anon key, and service role key (see below).
5. `npm install`, then `npm run dev`.
6. Bootstrap your first admin account by registering normally with a
   one-off invite code, then promoting yourself to admin directly in the
   Supabase SQL Editor (see comments in the base schema file).

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The first two are safe to expose to the browser (that's what
`NEXT_PUBLIC_` means). **`SUPABASE_SERVICE_ROLE_KEY` must never be
prefixed with `NEXT_PUBLIC_`** — it bypasses every security rule in the
database and must only ever be read server-side.

## Known Limitations & Possible Next Steps

- The SQL migrations are additive, incremental files rather than one
  clean schema — fine for an existing project, but a fresh deployment
  would benefit from eventually consolidating them into a single
  `schema.sql`.
- Loan interest is simple (principal × rate), not amortized or
  compounding.
- There's no automated reminder system yet for upcoming loan due dates
  or lapsed monthly contributions.
- Admin actions (approvals, disbursements, deletions) aren't currently
  logged to a separate audit table — history lives in the affected rows
  themselves (timestamps, status changes) rather than a dedicated audit
  log.

Thank you for reading everything 

