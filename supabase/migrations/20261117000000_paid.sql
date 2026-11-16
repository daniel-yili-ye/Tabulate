-- Marking people as paid.
--
-- Each person on a tab can be marked as having paid their share. The owner can
-- always do this. Whether anyone else holding the share link can is up to the
-- owner, per tab, and is allowed unless they turn it off.

alter table public.tab_participants
  add column paid boolean not null default false;

alter table public.tabs
  add column allow_guest_paid boolean not null default true;

-- Mark one person on a tab as paid or not. The only way to do so without
-- owning the tab, which is why it checks the tab's setting itself. Returns
-- false when the tab or person does not exist or the caller may not change it.
create function public.set_participant_paid(
  p_slug text,
  p_participant_id uuid,
  p_paid boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tab_id uuid;
begin
  select t.id into v_tab_id
  from public.tabs t
  where t.slug = p_slug
    and (t.allow_guest_paid or t.owner_id = (select auth.uid()));

  if v_tab_id is null then
    return false;
  end if;

  update public.tab_participants
  set paid = p_paid
  where id = p_participant_id and tab_id = v_tab_id;

  return found;
end;
$$;

revoke execute on function public.set_participant_paid(text, uuid, boolean) from public;
grant execute on function public.set_participant_paid(text, uuid, boolean) to anon, authenticated;

create or replace function public.get_shared_tab(p_slug text)
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
    'currency', t.currency,
    'settleCurrency', t.settle_currency,
    'settleTotalCents', t.settle_total_cents,
    'taxCents', t.tax_cents,
    'tipCents', t.tip_cents,
    'discountCents', t.discount_cents,
    'receiptImagePath', t.receipt_image_path,
    'paymentMessage', t.payment_message,
    'allowGuestPaid', t.allow_guest_paid,
    'participants', coalesce((
      select jsonb_agg(jsonb_build_object('id', tp.id, 'name', tp.name, 'paid', tp.paid)
        order by tp.position
      )
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
  where t.slug = p_slug;
$$;

create or replace function public.save_tab(p_slug text, p_create boolean, p_tab jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tab_id uuid;
  v_currency text := coalesce(p_tab ->> 'currency', 'USD');
  v_allow_guest_paid boolean := coalesce((p_tab ->> 'allowGuestPaid')::boolean, true);
  v_paid uuid[] := '{}';
begin
  if p_create then
    insert into public.tabs (
      slug, business_name, receipt_date, currency, tax_cents, tip_cents, discount_cents,
      receipt_image_path, payment_message, allow_guest_paid
    )
    values (
      p_slug,
      p_tab ->> 'businessName',
      (p_tab ->> 'date')::date,
      v_currency,
      (p_tab ->> 'taxCents')::integer,
      (p_tab ->> 'tipCents')::integer,
      (p_tab ->> 'discountCents')::integer,
      p_tab ->> 'receiptImagePath',
      coalesce(p_tab ->> 'paymentMessage', ''),
      v_allow_guest_paid
    )
    returning id into v_tab_id;
  else
    -- The amount charged in another currency is set from the tab page and is
    -- kept across edits, unless the tab itself moves to that currency.
    update public.tabs
    set
      business_name = p_tab ->> 'businessName',
      receipt_date = (p_tab ->> 'date')::date,
      currency = v_currency,
      settle_total_cents = case when settle_currency = v_currency then null else settle_total_cents end,
      settle_currency = nullif(settle_currency, v_currency),
      tax_cents = (p_tab ->> 'taxCents')::integer,
      tip_cents = (p_tab ->> 'tipCents')::integer,
      discount_cents = (p_tab ->> 'discountCents')::integer,
      receipt_image_path = p_tab ->> 'receiptImagePath',
      payment_message = coalesce(p_tab ->> 'paymentMessage', ''),
      allow_guest_paid = v_allow_guest_paid
    where slug = p_slug
    returning id into v_tab_id;

    if v_tab_id is null then
      raise exception 'Tab not found' using errcode = 'P0002';
    end if;

    -- Participants are replaced below, so remember who had already paid.
    select coalesce(array_agg(tp.id), '{}') into v_paid
    from public.tab_participants tp
    where tp.tab_id = v_tab_id and tp.paid;

    -- Shares go with their items and participants through the cascades.
    delete from public.tab_items where tab_id = v_tab_id;
    delete from public.tab_participants where tab_id = v_tab_id;
  end if;

  insert into public.tab_participants (id, tab_id, position, name, paid)
  select
    (p.value ->> 'id')::uuid,
    v_tab_id,
    p.ordinality - 1,
    p.value ->> 'name',
    (p.value ->> 'id')::uuid = any (v_paid)
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
