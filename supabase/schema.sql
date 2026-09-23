create extension if not exists pgcrypto;
create table if not exists public.admin_users (email text primary key check(email=lower(email)),display_name text not null,created_at timestamptz not null default now());
create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(),order_number text unique not null,
 status text not null default 'Awaiting confirmation' check(status in('Awaiting confirmation','Confirmed','In progress','Completed','Cancelled')),
 customer_name text not null,phone text not null,email text not null,address text not null,
 vehicle_make text not null,vehicle_model text not null,vehicle_year text,registration text,
 vehicle_size text not null,condition_level text not null,condition_flags text[] not null default '{}',condition_notes text,
 package_id text not null,addons text[] not null default '{}',preferred_date date not null,preferred_time text not null,payment_method text not null,
 estimated_total numeric(10,2),final_total numeric(10,2),private_notes text,review_url text,review_sent_at timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.admin_users enable row level security; alter table public.bookings enable row level security;
revoke all on public.bookings from anon; grant select,update on public.bookings to authenticated; grant select on public.admin_users to authenticated;
create policy "Admins identify themselves" on public.admin_users for select to authenticated using(email=lower(auth.jwt()->>'email'));
create policy "Approved admins read bookings" on public.bookings for select to authenticated using(exists(select 1 from public.admin_users a where a.email=lower(auth.jwt()->>'email')));
create policy "Approved admins update bookings" on public.bookings for update to authenticated using(exists(select 1 from public.admin_users a where a.email=lower(auth.jwt()->>'email'))) with check(exists(select 1 from public.admin_users a where a.email=lower(auth.jwt()->>'email')));
create or replace function public.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at before update on public.bookings for each row execute function public.set_updated_at();
insert into public.admin_users(email,display_name) values ('aadarshadhikari3@gmail.com','Aadarsh'),('simashah55555@gmail.com','Sima') on conflict(email) do update set display_name=excluded.display_name;

create or replace function public.submit_booking(payload jsonb)
returns table(id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if coalesce(trim(payload->>'order_number'),'') = ''
     or coalesce(trim(payload->>'customer_name'),'') = ''
     or coalesce(trim(payload->>'phone'),'') = ''
     or coalesce(trim(payload->>'email'),'') = ''
     or coalesce(trim(payload->>'address'),'') = ''
     or coalesce(trim(payload->>'vehicle_make'),'') = ''
     or coalesce(trim(payload->>'vehicle_model'),'') = ''
     or coalesce(trim(payload->>'vehicle_size'),'') = ''
     or coalesce(trim(payload->>'condition_level'),'') = ''
     or coalesce(trim(payload->>'package_id'),'') = ''
     or coalesce(trim(payload->>'preferred_date'),'') = ''
     or coalesce(trim(payload->>'preferred_time'),'') = ''
     or coalesce(trim(payload->>'payment_method'),'') = '' then
    raise exception 'Missing required booking details';
  end if;

  insert into public.bookings (
    order_number, status, customer_name, phone, email, address,
    vehicle_make, vehicle_model, vehicle_year, registration, vehicle_size,
    condition_level, condition_flags, condition_notes, package_id, addons,
    preferred_date, preferred_time, payment_method, estimated_total, review_url
  ) values (
    left(trim(payload->>'order_number'), 50), 'Awaiting confirmation',
    left(trim(payload->>'customer_name'), 150), left(trim(payload->>'phone'), 50),
    left(trim(payload->>'email'), 254), left(trim(payload->>'address'), 500),
    left(trim(payload->>'vehicle_make'), 100), left(trim(payload->>'vehicle_model'), 100),
    nullif(left(trim(payload->>'vehicle_year'), 20), ''), nullif(left(trim(payload->>'registration'), 30), ''),
    left(trim(payload->>'vehicle_size'), 100), left(trim(payload->>'condition_level'), 100),
    coalesce(array(select left(value, 100) from jsonb_array_elements_text(coalesce(payload->'condition_flags','[]'::jsonb))), array[]::text[]),
    nullif(left(trim(payload->>'condition_notes'), 500), ''), left(trim(payload->>'package_id'), 100),
    coalesce(array(select left(value, 100) from jsonb_array_elements_text(coalesce(payload->'addons','[]'::jsonb))), array[]::text[]),
    (payload->>'preferred_date')::date, left(trim(payload->>'preferred_time'), 100),
    left(trim(payload->>'payment_method'), 100), nullif(payload->>'estimated_total','')::numeric,
    nullif(left(trim(payload->>'review_url'), 500), '')
  ) returning bookings.id into new_id;

  return query select b.id, b.order_number from public.bookings b where b.id = new_id;
end;
$$;
revoke all on function public.submit_booking(jsonb) from public;
grant execute on function public.submit_booking(jsonb) to anon, authenticated;
