-- Currencies.
--
-- Every tab is in one currency, and its amounts are whole minor units of that
-- currency. A profile's currency is the fallback for new tabs when the receipt
-- scan cannot tell which currency a receipt is in.
--
-- A tab can also carry what the owner was actually charged for it in another
-- currency (a trip abroad, paid with a card from home), so that people can see
-- what they owe in the currency they will pay back in.

alter table public.profiles
  add column currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$');

grant update (currency) on public.profiles to authenticated;

alter table public.tabs
  add column currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  add column settle_currency text check (settle_currency ~ '^[A-Z]{3}$'),
  add column settle_total_cents integer check (settle_total_cents > 0),
  add constraint tabs_settle_pair_check
    check ((settle_currency is null) = (settle_total_cents is null)),
  add constraint tabs_settle_currency_differs_check
    check (settle_currency is distinct from currency);

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
begin
  if p_create then
    insert into public.tabs (
      slug, business_name, receipt_date, currency, tax_cents, tip_cents, discount_cents,
      receipt_image_path, payment_message
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
      coalesce(p_tab ->> 'paymentMessage', '')
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
      payment_message = coalesce(p_tab ->> 'paymentMessage', '')
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
