-- Each tab carries its own payment note. The note in a user's settings is only
-- the starting text for new tabs, so changing it later leaves old tabs alone.

alter table public.tabs
  add column payment_message text not null default ''
    check (char_length(payment_message) <= 300);

update public.tabs t
set payment_message = p.payment_message
from public.profiles p
where p.id = t.owner_id;

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
begin
  if p_create then
    insert into public.tabs (
      slug, business_name, receipt_date, tax_cents, tip_cents, discount_cents,
      receipt_image_path, payment_message
    )
    values (
      p_slug,
      p_tab ->> 'businessName',
      (p_tab ->> 'date')::date,
      (p_tab ->> 'taxCents')::integer,
      (p_tab ->> 'tipCents')::integer,
      (p_tab ->> 'discountCents')::integer,
      p_tab ->> 'receiptImagePath',
      coalesce(p_tab ->> 'paymentMessage', '')
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
