-- ============================================================
--  ALWA SALES SaaS — Multi-tenant schema (Supabase / Postgres)
--  Run this once in Supabase: SQL Editor > New query > paste > Run
-- ============================================================

-- ---------- TENANTS ----------
create table if not exists public.shops (
  id              uuid primary key default gen_random_uuid(),
  name            text not null default 'My Shop',
  address         text default '',
  pin             text default '',
  gstin           text default '',
  state           text default '',
  phone           text default '',
  invoice_prefix  text not null default 'INV-',
  next_invoice_no int  not null default 1,
  logo_url        text,
  upi_qr_url      text,
  upi_id          text default '',
  created_at      timestamptz default now()
);

-- ---------- USER -> SHOP MAPPING ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  email      text,
  role       text not null default 'owner',
  created_at timestamptz default now()
);

-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  name       text not null,
  hsn        text default '',
  unit       text default 'pcs',
  price      numeric not null default 0,
  gst        numeric not null default 0,
  stock      numeric not null default 0,
  low        numeric not null default 5,
  cost       numeric not null default 0,
  created_at timestamptz default now()
);
create index if not exists products_shop_idx on public.products(shop_id);

-- ---------- CUSTOMERS ----------
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  name       text not null,
  phone      text default '',
  gstin      text default '',
  state      text default '',
  address    text default '',
  created_at timestamptz default now()
);
create index if not exists customers_shop_idx on public.customers(shop_id);

-- ---------- INVOICES ----------
create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops(id) on delete cascade,
  no               text not null,
  date             date not null default current_date,
  customer_id      uuid references public.customers(id) on delete set null,
  customer_name    text default 'Walk-in Customer',
  customer_gstin   text default '',
  customer_state   text default '',
  customer_phone   text default '',
  customer_address text default '',
  items            jsonb not null default '[]',
  inter_state      boolean default false,
  no_tax           boolean default false,
  taxable          numeric default 0,
  cgst             numeric default 0,
  sgst             numeric default 0,
  igst             numeric default 0,
  round            numeric default 0,
  total            numeric default 0,
  pay_mode         text default 'Cash',
  paid             numeric default 0,
  payments         jsonb not null default '[]',
  created_at       timestamptz default now()
);
create index if not exists invoices_shop_idx on public.invoices(shop_id);
create index if not exists invoices_date_idx on public.invoices(shop_id, date);

-- ---------- PURCHASES (Stock In) ----------
create table if not exists public.purchases (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  date         date not null default current_date,
  product_id   uuid references public.products(id) on delete set null,
  product_name text default '',
  qty          numeric not null default 0,
  cost         numeric not null default 0,
  supplier     text default '',
  note         text default '',
  created_at   timestamptz default now()
);
create index if not exists purchases_shop_idx on public.purchases(shop_id);

-- ============================================================
--  HELPER: current user's shop id
-- ============================================================
create or replace function public.auth_shop_id()
returns uuid language sql stable security definer set search_path = public as $$
  select shop_id from public.profiles where id = auth.uid()
$$;

-- ============================================================
--  SIGNUP TRIGGER: new user -> new shop + profile
--  shop_name / state are read from the signup metadata.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_shop uuid;
begin
  insert into public.shops (name, state)
  values (
    coalesce(nullif(new.raw_user_meta_data->>'shop_name',''), 'My Shop'),
    coalesce(new.raw_user_meta_data->>'state','')
  )
  returning id into new_shop;

  insert into public.profiles (id, shop_id, email)
  values (new.id, new_shop, new.email);

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  RPC: create_invoice — atomic numbering + stock decrement
-- ============================================================
create or replace function public.create_invoice(
  p_date date,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_gstin text,
  p_customer_state text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb,
  p_inter_state boolean,
  p_no_tax boolean,
  p_taxable numeric,
  p_cgst numeric,
  p_sgst numeric,
  p_igst numeric,
  p_round numeric,
  p_total numeric,
  p_pay_mode text,
  p_paid numeric,
  p_payments jsonb
) returns public.invoices
language plpgsql security definer set search_path = public as $$
declare
  v_shop   uuid := public.auth_shop_id();
  v_prefix text;
  v_no     int;
  v_inv    public.invoices;
  it       jsonb;
begin
  if v_shop is null then raise exception 'No shop for current user'; end if;

  -- lock the shop row so two sales cannot grab the same number
  select invoice_prefix, next_invoice_no
    into v_prefix, v_no
    from public.shops where id = v_shop for update;

  -- decrement stock for each line
  for it in select * from jsonb_array_elements(p_items) loop
    update public.products
      set stock = stock - coalesce((it->>'qty')::numeric, 0)
      where id = (it->>'productId')::uuid and shop_id = v_shop;
  end loop;

  insert into public.invoices (
    shop_id, no, date, customer_id, customer_name, customer_gstin,
    customer_state, customer_phone, customer_address, items, inter_state,
    no_tax, taxable, cgst, sgst, igst, round, total, pay_mode, paid, payments
  ) values (
    v_shop, v_prefix || lpad(v_no::text, 4, '0'), p_date, p_customer_id, p_customer_name,
    p_customer_gstin, p_customer_state, p_customer_phone, p_customer_address, p_items,
    p_inter_state, p_no_tax, p_taxable, p_cgst, p_sgst, p_igst, p_round, p_total,
    p_pay_mode, p_paid, p_payments
  ) returning * into v_inv;

  update public.shops set next_invoice_no = next_invoice_no + 1 where id = v_shop;

  return v_inv;
end $$;

-- ============================================================
--  RPC: add_payment — append a payment + bump paid amount
-- ============================================================
create or replace function public.add_payment(
  p_invoice_id uuid, p_amount numeric, p_mode text, p_date date
) returns public.invoices
language plpgsql security definer set search_path = public as $$
declare v_inv public.invoices; v_shop uuid := public.auth_shop_id();
begin
  update public.invoices
    set paid = paid + p_amount,
        payments = payments || jsonb_build_array(
          jsonb_build_object('date', p_date, 'amount', p_amount, 'mode', p_mode))
    where id = p_invoice_id and shop_id = v_shop
    returning * into v_inv;
  return v_inv;
end $$;

-- ============================================================
--  ROW LEVEL SECURITY  — every shop sees only its own rows
-- ============================================================
alter table public.shops     enable row level security;
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;
alter table public.customers enable row level security;
alter table public.invoices  enable row level security;
alter table public.purchases enable row level security;

-- shops: a user sees / edits only their own shop
drop policy if exists shops_rw on public.shops;
create policy shops_rw on public.shops
  for all using (id = public.auth_shop_id())
  with check (id = public.auth_shop_id());

-- profiles: a user sees only their own profile row
drop policy if exists profiles_rw on public.profiles;
create policy profiles_rw on public.profiles
  for all using (id = auth.uid())
  with check (id = auth.uid());

-- generic per-shop tables
drop policy if exists products_rw on public.products;
create policy products_rw on public.products
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

drop policy if exists customers_rw on public.customers;
create policy customers_rw on public.customers
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

drop policy if exists invoices_rw on public.invoices;
create policy invoices_rw on public.invoices
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

drop policy if exists purchases_rw on public.purchases;
create policy purchases_rw on public.purchases
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

grant execute on function public.create_invoice(date,uuid,text,text,text,text,text,jsonb,boolean,boolean,numeric,numeric,numeric,numeric,numeric,numeric,text,numeric,jsonb) to authenticated;
grant execute on function public.add_payment(uuid,numeric,text,date) to authenticated;
grant execute on function public.auth_shop_id() to authenticated;

-- ============================================================
--  STORAGE: bucket for shop logo / UPI QR (run once)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('shop-assets', 'shop-assets', true)
on conflict (id) do nothing;

drop policy if exists shop_assets_read on storage.objects;
create policy shop_assets_read on storage.objects
  for select using (bucket_id = 'shop-assets');

drop policy if exists shop_assets_write on storage.objects;
create policy shop_assets_write on storage.objects
  for insert to authenticated with check (bucket_id = 'shop-assets');

drop policy if exists shop_assets_update on storage.objects;
create policy shop_assets_update on storage.objects
  for update to authenticated using (bucket_id = 'shop-assets');

-- ============================================================
--  RPC: update_invoice — atomic edit (restore old stock, deduct new)
-- ============================================================
create or replace function public.update_invoice(
  p_id uuid,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_gstin text,
  p_customer_state text,
  p_customer_phone text,
  p_customer_address text,
  p_items jsonb,
  p_inter_state boolean,
  p_no_tax boolean,
  p_taxable numeric,
  p_cgst numeric,
  p_sgst numeric,
  p_igst numeric,
  p_round numeric,
  p_total numeric,
  p_pay_mode text,
  p_paid numeric,
  p_payments jsonb
) returns public.invoices
language plpgsql security definer set search_path = public as $$
declare
  v_shop uuid := public.auth_shop_id();
  v_inv  public.invoices;
  old_it jsonb;
  it     jsonb;
begin
  if v_shop is null then raise exception 'No shop for current user'; end if;

  select * into v_inv from public.invoices where id = p_id and shop_id = v_shop for update;
  if not found then raise exception 'Invoice not found'; end if;

  for old_it in select * from jsonb_array_elements(v_inv.items) loop
    update public.products
      set stock = stock + coalesce((old_it->>'qty')::numeric, 0)
      where id = (old_it->>'productId')::uuid and shop_id = v_shop;
  end loop;

  for it in select * from jsonb_array_elements(p_items) loop
    update public.products
      set stock = stock - coalesce((it->>'qty')::numeric, 0)
      where id = (it->>'productId')::uuid and shop_id = v_shop;
  end loop;

  update public.invoices set
    customer_id = p_customer_id, customer_name = p_customer_name, customer_gstin = p_customer_gstin,
    customer_state = p_customer_state, customer_phone = p_customer_phone, customer_address = p_customer_address,
    items = p_items, inter_state = p_inter_state, no_tax = p_no_tax,
    taxable = p_taxable, cgst = p_cgst, sgst = p_sgst, igst = p_igst, round = p_round, total = p_total,
    pay_mode = p_pay_mode, paid = p_paid, payments = p_payments
    where id = p_id and shop_id = v_shop
    returning * into v_inv;

  return v_inv;
end $$;

grant execute on function public.update_invoice(uuid,uuid,text,text,text,text,text,jsonb,boolean,boolean,numeric,numeric,numeric,numeric,numeric,numeric,text,numeric,jsonb) to authenticated;
