Delight MCS — Cooperative Ledger & Membership Platform

A digital ledger and light CRM for **Delight Thrift & Credit Cooperative
Society**, replacing paper passbooks and manual bookkeeping with a
transparent, admin-verified record of every member's savings, loans, and
goal-based contributions.

This is **not** a payment platform. No money moves through the app —
contributions and repayments happen offline (cash, bank transfer, etc.)
and an admin logs them here so every member can see an always-current,
trustworthy record of their own standing.

---

## Table of Contents.

- [What This App Does](#what-this-app-does)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [How Membership Works](#how-membership-works)
- [Member-Facing Features](#member-facing-features)
- [Admin-Facing Features](#admin-facing-features)
- [Enhanced Features](#enhanced-features)
- [Security Model](#security-model)
- [Database Schema](#database-schema)
- [Key Database Functions](#key-database-functions)
- [API Routes](#api-routes)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment Notes](#deployment-notes)
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

## Design System

The app uses a custom design system inspired by physical cooperative
passbooks and ledgers:

**Fonts:**
| Font | Usage |
|---|---|
| Fraunces | Display headings, stat numbers, the cooperative name |
| IBM Plex Sans | Body text, form labels, navigation |
| IBM Plex Mono | Currency amounts, cooperative IDs, code snippets |

**Color Palette:**
| Token | Purpose |
|---|---|
| `parchment` | Background color — warm off-white, like aged paper |
| `ink` | Primary text — deep dark brown/black |
| `cooperative` | Primary brand color — green used for buttons, active states, member UI |
| `brass` | Accent gold — used for the passbook stamp motif, premium elements |
| `brick` | Destructive/alert red — used for errors, suspensions, overdue badges |
| `rule` | Border color — subtle lines that mimic ledger ruling |

**Passbook Stamp Motif:**
The signature visual element is a custom SVG ink-stamp circle (`PassbookStamp`
component) that echoes the rubber stamp a cooperative officer presses into a
physical passbook. It appears in two states:
- **Live** — brass-colored, solid border, used for active/approved states
- **Waiting** — faded, dashed border, shown on the pending account screen

This motif bridges the digital experience with the physical passbook tradition
members already know.

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

## Enhanced Features

These features go beyond the basic member/admin workflow and add
significant depth to the platform:

### Session Management
- **15-minute idle timeout** with a 60-second warning modal. Tracks
  mouse movement, keyboard, scroll, touch, and click activity. Users can
  choose to stay logged in or sign out automatically.

### Registration Safeguards
- **Email typo detection** — catches common typos like `gamil.com`,
  `yaho.com`, `hotmal.com` in real-time and suggests the correct
  domain.
- **Email confirmation field** — both registration and forgot-password
  require typing the email twice to prevent typos.

### Goal-Based Savings
- **Custom goals** — members can create savings goals outside the 6
  predefined products (e.g., "Generator", "School Fees") with a custom
  name, target amount, and optional deadline.
- **Community goals** — cooperative-wide joint savings targets visible
  to all members, with individual contribution tracking and progress
  bars.
- **Goal cancellation with refund** — when a member cancels a product
  goal, the saved amount is automatically moved to their regular savings
  via the `cancel_product_goal` RPC.
- **Goal expiration sweep** — the `finalize_expired_goals` RPC can be
  called for a single user or all users to auto-expire overdue goals
  and refund balances.

### Receipt Split Allocation
A single uploaded receipt can be split across multiple targets in one
action: general savings (tagged to a specific month), loan repayment,
multiple product goals, and community goals. The admin validates that
the split totals match the receipt amount before applying.

### Batch Operations
- **"Fill all" contribution logging** — admin can type one amount and
  apply it to every unlogged member at once, instead of entering each
  one individually.

### Loan Enhancements
- **Top-up at 75%** — members can request a top-up loan alongside an
  existing one once that loan is at least 75% repaid.
- **Consecutive month tracking** — loan eligibility is based on
  consecutive months of contributions (not just total), enforced at the
  Postgres trigger level via the `get_loan_eligibility` RPC.

### Admin Safety Guards
- **Self-deletion blocked** — an admin cannot delete their own account
  (enforced both client-side and server-side).
- **Last admin protected** — the system blocks deletion of the last
  remaining admin account, preventing accidental lockout.

### Visual Design
- **Passbook stamp motif** — the `PassbookStamp` SVG component echoes
  the rubber stamp a cooperative officer presses into a physical
  passbook, bridging the digital experience with the paper tradition
  members already know.

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
| `receipt_allocations` | Proposed splits on receipts (savings, loan, goal, community) |
| `community_goals` | Cooperative-wide joint savings targets |
| `community_goal_contributions` | Individual contributions to community goals |
| `notifications` | In-app notifications, auto-generated by triggers |

A `loan_balances` view computes each loan's real outstanding balance
(principal + interest, minus repayments) so the frontend never has to
re-derive that math.

All of the SQL — table definitions, RLS policies, and trigger functions —
lives in the `supabase/` folder as a series of migration files, meant to
be run in order in the Supabase SQL Editor.

## Key Database Functions

Several Postgres functions (RPCs) power core business logic:

| Function | Purpose |
|---|---|
| `is_admin()` | Returns `true` if the current user has `role = 'admin'`. Used by RLS policies to gate admin-only access. |
| `get_loan_eligibility(user_id)` | Returns the user's consecutive contribution streak and whether they meet the eligibility threshold (3 or 6 months). |
| `finalize_expired_goals(target_user_id?)` | Sweeps product goals past their deadline, marks them expired, and refunds balances to regular savings. Can target a single user or all users. |
| `cancel_product_goal(goal_id)` | Cancels an active goal and refunds the saved amount to the member's regular savings via a trigger. |

**Key Trigger Behaviors:**
- **Profile field protection** — any attempt to change `role`, `status`, `email`, `cooperative_id`, or `loan_eligibility_months` by a non-admin is silently reverted.
- **Excess payment redirect** — if a repayment or goal payment exceeds what is owed, the surplus is automatically added to regular savings.
- **Notification generation** — contributions, repayments, loan status changes, and goal payments each fire a trigger that inserts a row into `notifications`.
- **Loan balance computation** — the `loan_balances` view recalculates outstanding balances (principal + interest − repayments) so the frontend always shows accurate numbers.

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

## API Routes

The app has a minimal API layer — most data flows directly between
Next.js and Supabase. The one exception is account deletion:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/delete-user` | POST | Admin only (service-role key) | Permanently deletes a member's auth account and all associated data. Re-verifies the caller is an active admin, blocks self-deletion, blocks deleting the last remaining admin. |

All other admin operations (approving members, logging contributions,
managing loans, etc.) happen through Supabase client-side calls protected
by RLS policies — no custom API routes needed.

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

## Deployment Notes

- **Supabase project:** Create a project at
  [supabase.com](https://supabase.com). The free tier is sufficient for
  small cooperatives.
- **Email provider:** In **Authentication → Providers → Email**, turn off
  "Confirm email" — the app uses admin approval instead of email
  verification.
- **SQL migrations:** Run every file in `supabase/` in the Supabase SQL
  Editor, in the order they were added. Each file documents its
  dependencies at the top.
- **Storage buckets:** The SQL migrations create two private storage
  buckets (`loan-documents` and `payment-receipts`). Do not make these
  public — access is controlled by storage policies.
- **First admin:** After deploying, register with a one-off invite code,
  then run this in the SQL Editor to make yourself an admin:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
  ```
- **Hosting:** Deploy the Next.js app to Vercel, Netlify, or any
  Node.js hosting. Set the three environment variables in your hosting
  dashboard.

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

