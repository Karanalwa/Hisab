-- ============================================================
--  MIGRATION: Credit Notes + Cash Register + Stock Adjustments
--  Run in Supabase SQL Editor
-- ============================================================

-- ---------- CREDIT NOTES (Sales Returns) ----------
create table if not exists public.credit_notes (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  invoice_id   uuid not null references public.invoices(id) on delete cascade,
  no           text not null,
  date         date not null default current_date,
  items        jsonb not null default '[]',
  total        numeric not null default 0,
  reason       text default '',
  note         text default '',
  created_at   timestamptz default now()
);
create index if not exists credit_notes_shop_idx on public.credit_notes(shop_id);
create index if not exists credit_notes_invoice_idx on public.credit_notes(invoice_id);
create index if not exists credit_notes_date_idx on public.credit_notes(shop_id, date);

alter table public.credit_notes enable row level security;
drop policy if exists credit_notes_rw on public.credit_notes;
create policy credit_notes_rw on public.credit_notes
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- ---------- CASH REGISTER ----------
create table if not exists public.cash_register (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  date         date not null default current_date,
  opening      numeric not null default 0,
  expenses     numeric not null default 0,
  closing      numeric not null default 0,
  notes        text default '',
  created_at   timestamptz default now(),
  unique(shop_id, date)
);
create index if not exists cash_register_shop_idx on public.cash_register(shop_id);
create index if not exists cash_register_date_idx on public.cash_register(shop_id, date);

alter table public.cash_register enable row level security;
drop policy if exists cash_register_rw on public.cash_register;
create policy cash_register_rw on public.cash_register
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- ---------- STOCK ADJUSTMENTS ----------
create table if not exists public.stock_adjustments (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  date         date not null default current_date,
  product_id   uuid references public.products(id) on delete set null,
  product_name text default '',
  qty_change   numeric not null default 0,
  reason       text not null default 'other',
  note         text default '',
  created_at   timestamptz default now()
);
create index if not exists stock_adjustments_shop_idx on public.stock_adjustments(shop_id);
create index if not exists stock_adjustments_date_idx on public.stock_adjustments(shop_id, date);

alter table public.stock_adjustments enable row level security;
drop policy if exists stock_adjustments_rw on public.stock_adjustments;
create policy stock_adjustments_rw on public.stock_adjustments
  for all using (shop_id = public.auth_shop_id())
  with check (shop_id = public.auth_shop_id());

-- ---------- RPC: create_credit_note ----------
create or replace function public.create_credit_note(
  p_invoice_id uuid,
  p_date date,
  p_items jsonb,
  p_total numeric,
  p_reason text,
  p_note text
) returns public.credit_notes
language plpgsql security definer set search_path = public as $$
declare
  v_shop   uuid := public.auth_shop_id();
  v_inv    public.invoices;
  v_prefix text;
  v_no     int;
  v_cn     public.credit_notes;
  it       jsonb;
begin
  if v_shop is null then raise exception 'No shop for current user'; end if;

  select * into v_inv from public.invoices where id = p_invoice_id and shop_id = v_shop;
  if not found then raise exception 'Invoice not found'; end if;

  -- restore stock for each returned inventory item (skip service/non-inventory lines)
  for it in select * from jsonb_array_elements(p_items) loop
    if (it->>'productId') is not null and (it->>'productId') <> '' then
      update public.products
        set stock = stock + coalesce((it->>'qty')::numeric, 0)
        where id = (it->>'productId')::uuid and shop_id = v_shop;
    end if;
  end loop;

  -- generate credit note number
  select invoice_prefix, next_invoice_no into v_prefix, v_no
    from public.shops where id = v_shop for update;

  insert into public.credit_notes (
    shop_id, invoice_id, no, date, items, total, reason, note
  ) values (
    v_shop, p_invoice_id, v_prefix || 'CN-' || lpad(v_no::text, 4, '0'),
    p_date, p_items, p_total, p_reason, p_note
  ) returning * into v_cn;

  return v_cn;
end $$;

grant execute on function public.create_credit_note(uuid,date,jsonb,numeric,text,text) to authenticated;

-- ---------- SHOP TERMS & SIGNATURE ----------
alter table public.shops add column if not exists terms text default '';
alter table public.shops add column if not exists signature_url text;
