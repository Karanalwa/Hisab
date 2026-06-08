# Hisab — Cloud POS & GST Invoicing (multi-tenant)

**Hisab** is a multi-tenant cloud point-of-sale and GST invoicing app for shops — a full rewrite of the original single-file Alwa Sales POS as a **Next.js 15** app backed by **Supabase** (Postgres + Auth + Storage) and deployable to **Vercel**. Every shop signs up, gets its own isolated data, and nothing is hardcoded — shop name, GSTIN, state, logo, UPI, invoice numbering and all records live in the database.

## Features

- Multi-tenant: each shop signs up and only ever sees its own data (enforced by Postgres Row Level Security).
- Email/password auth (Supabase Auth).
- Dashboard, Billing/POS, Invoices, Dues & Payments, Products & Stock, Stock In (purchases), Customers, Reports, Settings.
- Correct Indian GST: CGST/SGST for in-state, IGST for inter-state, no-tax bills, round-off, amount-in-words.
- Atomic invoice numbering + stock decrement (Postgres function — no race conditions across devices).
- Printable / Save-as-PDF tax invoice with logo and UPI QR.
- Logo & UPI QR uploads stored in Supabase Storage.

## Tech stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Supabase · Vercel.

---

## Setup (about 15 minutes)

### 1. Create a Supabase project
1. Go to https://supabase.com → New project (free tier is fine). Pick a region close to you.
2. Wait for it to finish provisioning.

### 2. Create the database
1. In Supabase open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   This creates all tables, the signup trigger, RLS policies, the invoice/payment functions, and the `shop-assets` storage bucket.

### 3. (Optional) turn off email confirmation for quick testing
Supabase **Authentication → Providers → Email** → disable "Confirm email" if you want to log in immediately after signup. (Leave it on for production.)

### 4. Get your API keys
Supabase **Project Settings → API**. Copy:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Run locally
```bash
cp .env.example .env.local      # then paste your two keys in
npm install
npm run dev                      # http://localhost:3000
```
Sign up with a shop name + state, then start billing.

---

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On https://vercel.com → **Add New → Project** → import the repo.
3. In **Environment Variables** add the same two keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Done.

> Tip: Vercel also has a one-click **Supabase integration** (Project → Integrations) that injects these env vars for you.

---

## How multi-tenancy works

- Each signup creates a row in `shops` and a `profiles` row linking the auth user to that shop (via the `on_auth_user_created` trigger).
- Every data table has a `shop_id`. RLS policies allow a row only when `shop_id = auth_shop_id()`, where `auth_shop_id()` looks up the current user's shop. A user physically cannot read or write another shop's rows, even with a leaked anon key.
- Invoice numbers are per-shop and generated inside the `create_invoice` Postgres function, which locks the shop row so two simultaneous sales can never collide.

## Project structure

```
src/
  app/
    login, signup            # auth pages
    (app)/                   # authenticated shell (sidebar + topbar)
      dashboard, billing, invoices, dues,
      products, purchases, customers, reports, settings
    invoices/[id]/print      # printable invoice (no sidebar)
  actions/                   # server actions (CRUD + RPC calls)
  lib/
    gst.ts                   # GST math, money/date helpers, number-to-words
    supabase/                # browser + server clients, session middleware
    shop.ts, types.ts, states.ts
supabase/schema.sql          # run once in Supabase
```

## Migrating your old data (optional)

Your previous app stored data in `Alwa-Sales-Data/*.json`. To bring it in: sign up to create your shop, then insert the rows (with your new `shop_id`) via the Supabase SQL editor or a short script using the service-role key. Ask and this can be scripted for you.

## Notes / limits

- Supabase free tier pauses a project after ~7 days of inactivity (auto-resumes on next request). A shop billing daily never triggers this.
- Auth here is one login per shop (owner). Multiple staff logins/roles can be added on top of the existing `profiles.role` column.
