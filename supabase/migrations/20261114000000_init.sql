-- Tabulate schema.
--
-- Money is stored as integer cents. Every table has row level security and is
-- writable only by the tab's owner. Shared links are read through
-- get_shared_tab(), the single public entry point.

-- Remove the pre-accounts tables if this runs against an old database.
drop table if exists public.tabs cascade;
drop table if exists public.bills cascade;
drop trigger if exists on_auth_user_created on auth.users;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create type public.split_type as enum ('equal', 'shares', 'percentage', 'custom');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  payment_message text not null default '' check (char_length(payment_message) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tabs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[A-Za-z0-9_-]{10,32}$'),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 1 and 120),
  receipt_date date not null,
  tax_cents integer not null default 0 check (tax_cents >= 0),
  tip_cents integer not null default 0 check (tip_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  receipt_image_path text check (char_length(receipt_image_path) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tabs_owner_id_created_at_idx on public.tabs (owner_id, created_at desc);

create table public.tab_participants (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid not null references public.tabs (id) on delete cascade,
  position smallint not null check (position >= 0),
  name text not null check (char_length(name) between 1 and 60),
  unique (tab_id, position),
  unique (id, tab_id)
);

create table public.tab_items (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid not null references public.tabs (id) on delete cascade,
  position smallint not null check (position >= 0),
  name text not null default '' check (char_length(name) <= 120),
  price_cents integer not null check (price_cents >= 0),
  split_type public.split_type not null default 'equal',
  unique (tab_id, position),
  unique (id, tab_id)
);

-- Who shares an item. `weight` is interpreted by the item's split_type:
-- equal = ignored, shares = number of shares, percentage = whole percent,
-- custom = exact cents. The composite foreign keys guarantee that the item and
-- the participant belong to the same tab.
create table public.item_shares (
  tab_id uuid not null,
  item_id uuid not null,
  participant_id uuid not null,
  weight integer not null default 1 check (weight >= 0),
  primary key (item_id, participant_id),
  foreign key (item_id, tab_id) references public.tab_items (id, tab_id) on delete cascade,
  foreign key (participant_id, tab_id) references public.tab_participants (id, tab_id) on delete cascade
);

create index item_shares_participant_id_idx on public.item_shares (participant_id, tab_id);
create index item_shares_tab_id_idx on public.item_shares (tab_id);

-- One row per receipt scan, used to rate limit the AI parsing endpoint.
create table public.receipt_scans (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index receipt_scans_user_id_created_at_idx on public.receipt_scans (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger tabs_set_updated_at
  before update on public.tabs
  for each row execute function public.set_updated_at();

-- Create a profile whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'name', ''),
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      60
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts that already exist.
insert into public.profiles (id, display_name)
select
  u.id,
  left(
    coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(u.email, ''), '@', 1)
    ),
    60
  )
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.tabs enable row level security;
alter table public.tab_participants enable row level security;
alter table public.tab_items enable row level security;
alter table public.item_shares enable row level security;
alter table public.receipt_scans enable row level security;

revoke all on public.profiles, public.tabs, public.tab_participants, public.tab_items,
  public.item_shares, public.receipt_scans from anon, authenticated;

grant select, update (display_name, payment_message) on public.profiles to authenticated;
grant select, insert, update, delete on public.tabs, public.tab_participants,
  public.tab_items, public.item_shares to authenticated;

create policy "Users read their own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Owners manage their tabs" on public.tabs
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create function public.owns_tab(p_tab_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tabs t
    where t.id = p_tab_id and t.owner_id = (select auth.uid())
  );
$$;

create policy "Owners manage their participants" on public.tab_participants
  for all to authenticated
  using (public.owns_tab(tab_id))
  with check (public.owns_tab(tab_id));

create policy "Owners manage their items" on public.tab_items
  for all to authenticated
  using (public.owns_tab(tab_id))
  with check (public.owns_tab(tab_id));

create policy "Owners manage their item shares" on public.item_shares
  for all to authenticated
  using (public.owns_tab(tab_id))
  with check (public.owns_tab(tab_id));

-- receipt_scans has no policies: it is only reachable through claim_receipt_scan().

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Public read of one tab by its unguessable slug. Returns null when not found.
create function public.get_shared_tab(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'slug', t.slug,
    'isOwner', t.owner_id = (select auth.uid()),
    'businessName', t.business_name,
    'date', t.receipt_date,
    'taxCents', t.tax_cents,
    'tipCents', t.tip_cents,
    'discountCents', t.discount_cents,
    'receiptImagePath', t.receipt_image_path,
    'owner', jsonb_build_object(
      'displayName', p.display_name,
      'paymentMessage', p.payment_message
    ),
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('id', tp.id, 'name', tp.name) order by tp.position)
      from public.tab_participants tp
      where tp.tab_id = t.id
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ti.id,
          'name', ti.name,
          'priceCents', ti.price_cents,
          'splitType', ti.split_type,
          'shares', coalesce((
            select jsonb_agg(
              jsonb_build_object('participantId', s.participant_id, 'weight', s.weight)
              order by sp.position
            )
            from public.item_shares s
            join public.tab_participants sp on sp.id = s.participant_id
            where s.item_id = ti.id
          ), '[]'::jsonb)
        )
        order by ti.position
      )
      from public.tab_items ti
      where ti.tab_id = t.id
    ), '[]'::jsonb)
  )
  from public.tabs t
  join public.profiles p on p.id = t.owner_id
  where t.slug = p_slug;
$$;

-- Create or replace a tab and all of its rows in one transaction. Runs with the
-- caller's privileges, so row level security decides what they may touch.
create function public.save_tab(p_slug text, p_create boolean, p_tab jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tab_id uuid;
begin
  if p_create then
    insert into public.tabs (
      slug, business_name, receipt_date, tax_cents, tip_cents, discount_cents, receipt_image_path
    )
    values (
      p_slug,
      p_tab ->> 'businessName',
      (p_tab ->> 'date')::date,
      (p_tab ->> 'taxCents')::integer,
      (p_tab ->> 'tipCents')::integer,
      (p_tab ->> 'discountCents')::integer,
      p_tab ->> 'receiptImagePath'
    )
    returning id into v_tab_id;
  else
    update public.tabs
    set
      business_name = p_tab ->> 'businessName',
      receipt_date = (p_tab ->> 'date')::date,
      tax_cents = (p_tab ->> 'taxCents')::integer,
      tip_cents = (p_tab ->> 'tipCents')::integer,
      discount_cents = (p_tab ->> 'discountCents')::integer,
      receipt_image_path = p_tab ->> 'receiptImagePath'
    where slug = p_slug
    returning id into v_tab_id;

    if v_tab_id is null then
      raise exception 'Tab not found' using errcode = 'P0002';
    end if;

    -- Shares go with their items and participants through the cascades.
    delete from public.tab_items where tab_id = v_tab_id;
    delete from public.tab_participants where tab_id = v_tab_id;
  end if;

  insert into public.tab_participants (id, tab_id, position, name)
  select (p.value ->> 'id')::uuid, v_tab_id, p.ordinality - 1, p.value ->> 'name'
  from jsonb_array_elements(p_tab -> 'participants') with ordinality as p (value, ordinality);

  insert into public.tab_items (id, tab_id, position, name, price_cents, split_type)
  select
    (i.value ->> 'id')::uuid,
    v_tab_id,
    i.ordinality - 1,
    coalesce(i.value ->> 'name', ''),
    (i.value ->> 'priceCents')::integer,
    (i.value ->> 'splitType')::public.split_type
  from jsonb_array_elements(p_tab -> 'items') with ordinality as i (value, ordinality);

  insert into public.item_shares (tab_id, item_id, participant_id, weight)
  select
    v_tab_id,
    (i.value ->> 'id')::uuid,
    (s.value ->> 'participantId')::uuid,
    (s.value ->> 'weight')::integer
  from jsonb_array_elements(p_tab -> 'items') as i (value)
  cross join lateral jsonb_array_elements(i.value -> 'shares') as s (value);

  return p_slug;
end;
$$;

-- Records a receipt scan for the caller and reports whether they are still
-- under the limit (20 scans per rolling hour).
create function public.claim_receipt_scan()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_recent integer;
begin
  if v_user_id is null then
    return false;
  end if;

  delete from public.receipt_scans
  where user_id = v_user_id and created_at < now() - interval '1 day';

  select count(*) into v_recent
  from public.receipt_scans
  where user_id = v_user_id and created_at > now() - interval '1 hour';

  if v_recent >= 20 then
    return false;
  end if;

  insert into public.receipt_scans (user_id) values (v_user_id);
  return true;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.owns_tab(uuid) from public, anon;
revoke execute on function public.get_shared_tab(text) from public;
revoke execute on function public.save_tab(text, boolean, jsonb) from public, anon;
revoke execute on function public.claim_receipt_scan() from public, anon;

grant execute on function public.owns_tab(uuid) to authenticated;
grant execute on function public.get_shared_tab(text) to anon, authenticated;
grant execute on function public.save_tab(text, boolean, jsonb) to authenticated;
grant execute on function public.claim_receipt_scan() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

-- Receipt photos live at <user id>/<random uuid>.<ext>. The bucket is public so
-- that anyone holding a share link can load the image, but only the owner can
-- list, upload to or delete from their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners read their receipts" on storage.objects;
drop policy if exists "Owners upload their receipts" on storage.objects;
drop policy if exists "Owners delete their receipts" on storage.objects;

create policy "Owners read their receipts" on storage.objects
  for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners upload their receipts" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners delete their receipts" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
