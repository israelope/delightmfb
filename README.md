# Delight MFB — Milestone 1

This matches what you've actually got installed: **Next.js 16** (middleware
is now called `proxy.js`), **Tailwind v4** (CSS-based config, no
`tailwind.config.js`), and **React 19**.

Follow these in order. Don't skip ahead — each step depends on the one before it.

## Step 1 — Install the one missing package

Your `package.json` has `@supabase/supabase-js` but not `@supabase/ssr`,
which is what lets Supabase read/write the login session via cookies in
Next's Server Components and `proxy.js`. In your project folder:

```bash
npm install @supabase/ssr
```

That's the only new package needed for Milestone 1.

## Step 2 — Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project. Wait for it to finish provisioning (~2 min).
2. **Settings → API** → copy the **Project URL** and the **anon public key**. You'll need both in Step 3.
3. **Authentication → Providers → Email** → turn **OFF** "Confirm email".
   This is important: members never give a real email address (explained in
   Step 6), so if email confirmation is on, nobody will ever be able to log in.
4. **SQL Editor** → paste in the entire contents of `supabase/schema.sql`
   from this folder → Run. This creates all four tables, security policies,
   and the trigger that validates invite codes.

## Step 3 — Add your environment variables

In your project's root folder, create a file called `.env.local` (copy
`.env.local.example` from this folder if that's easier) with:

```
NEXT_PUBLIC_SUPABASE_URL=paste-your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
```

## Step 4 — Copy these files into your project

Your `create-next-app` scaffold already has an `app/` folder with its own
`page.js`, `layout.js`, and `globals.css` — **overwrite those** with the
ones in this folder. Everything else here is new, so just copy the folders
in as-is:

```
your-project/
├── app/
│   ├── globals.css          ← overwrite
│   ├── layout.jsx           ← overwrite (delete the old layout.js)
│   ├── page.jsx             ← overwrite (delete the old page.js)
│   ├── (auth)/               ← new folder
│   ├── pending/               ← new folder
│   ├── admin/                 ← new folder
│   └── member/                 ← new folder
├── components/                ← new folder
├── lib/                       ← new folder
├── supabase/                  ← new folder (just the .sql file, doesn't run itself)
├── proxy.js                   ← new file, goes in the project ROOT (next to package.json)
├── next.config.mjs            ← overwrite your existing one
├── postcss.config.mjs         ← overwrite your existing one
└── jsconfig.json              ← only add if you don't already have one
```

If your old `page.js`/`layout.js` were `.js` and mine are `.jsx`, delete the
`.js` ones so there's no conflict (Next.js will error if both exist).

## Step 5 — Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. You should see the landing page.

## Step 6 — Create your first admin account

There's no separate admin signup — you bootstrap it manually, once. In the
Supabase **SQL Editor**:

```sql
insert into public.invite_codes (code) values ('COOP-FOUNDER');
```

Then in the running app, go to `/register` and sign up with your own name,
email, and password, using `COOP-FOUNDER` as the invite code. When it
succeeds you'll be shown a Cooperative ID (e.g. `COOP-84210`) — that's just
a reference number, not needed for login. Copy it, then back in the SQL
Editor:

```sql
update public.profiles
set role = 'admin', status = 'active'
where cooperative_id = 'COOP-84210'; -- use the ID you were actually shown
```

Now sign in at `/login` with the email and password you just registered —
you should land on `/admin/dashboard`.

## How login works

Members register with full name, email, password, confirm password, and an
invite code, and sign in afterward with just email + password — a normal
login, so nobody gets locked out over a misspelled name. Email confirmation
stays OFF (Step 2.3) since the spec avoids paid verification services; the
invite code plus manual admin approval is what actually gates access. Each
member is still assigned a Cooperative ID as a reference/account number
(shown once at registration, and always visible on their dashboard) — it's
just not used to log in.

## If something breaks

- **"Module not found: @supabase/ssr"** → you skipped Step 1.
- **Login says invalid credentials right after registering** → check Step 2.3
  (email confirmation must be OFF).
- **"relation profiles does not exist"** → the SQL in Step 2.4 didn't run —
  open the SQL Editor's output panel for the actual error and re-run it.
- **Redirect loop between pages** → double check `proxy.js` is in your
  project's *root* folder, not inside `app/`.

## What's next

`/admin/dashboard` and `/member/dashboard` are placeholders right now — say
the word when you want Milestone 2 (invite code generator + member approval
queue) and I'll build it against this same setup.

