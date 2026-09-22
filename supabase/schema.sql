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
