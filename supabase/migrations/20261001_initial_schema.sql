create type public.app_role as enum ('web_owner', 'shop_owner', 'staff');
create type public.approval_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  name text not null,
  slug text not null unique,
  description text not null,
  long_description text,
  price numeric(10, 2),
  sku text unique,
  inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),
  show_inventory_public boolean not null default false,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  art_class text not null default 'art-cover',
  art_icon text not null default '□',
  product_code text,
  specs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.repairs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  device_name text not null,
  model text,
  serial_number text,
  received_at timestamptz not null default now(),
  problem_reported text not null,
  initial_condition text,
  current_condition text not null,
  resolution_action text not null,
  required_part text,
  part_status text,
  status text not null check (status in (
    'RECEIVED', 'CHECKING', 'WAITING FOR APPROVAL', 'APPROVED', 'REPAIRING',
    'PART / ACCESSORY REQUIRED', 'PART / ACCESSORY PURCHASED', 'READY',
    'DELIVERED / COLLECTED', 'CANNOT REPAIR', 'RETURNED', 'CANCELLED'
  )),
  estimated_completion date,
  customer_note text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.repair_status_history (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repairs(id) on delete cascade,
  old_status text,
  new_status text not null,
  condition_note text,
  action_note text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action_type text not null,
  submitted_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  status public.approval_status not null default 'pending',
  old_data jsonb,
  new_data jsonb not null,
  comment text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  subject text not null,
  message text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger repairs_set_updated_at before update on public.repairs
for each row execute function public.set_updated_at();

create or replace function public.create_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger auth_user_profile after insert on auth.users
for each row execute function public.create_profile();

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.is_approver()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('web_owner', 'shop_owner')
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.repairs enable row level security;
alter table public.repair_status_history enable row level security;
alter table public.approval_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table public.enquiries enable row level security;

create policy "public reads active categories" on public.categories
for select using (is_active = true);
create policy "admins manage categories" on public.categories
for all using (public.is_active_admin()) with check (public.is_active_admin());

create policy "public reads active products" on public.products
for select using (is_active = true);
create policy "admins manage products" on public.products
for all using (public.is_active_admin()) with check (public.is_active_admin());

create policy "admins read profiles" on public.profiles
for select using (public.is_active_admin());
create policy "owners manage profiles" on public.profiles
for all using (public.is_approver()) with check (public.is_approver());

create policy "admins manage repairs" on public.repairs
for all using (public.is_active_admin()) with check (public.is_active_admin());
create policy "admins manage repair history" on public.repair_status_history
for all using (public.is_active_admin()) with check (public.is_active_admin());
create policy "admins read approvals" on public.approval_requests
for select using (public.is_active_admin());
create policy "staff create own approvals" on public.approval_requests
for insert with check (submitted_by = auth.uid() and public.is_active_admin());
create policy "approvers update approvals" on public.approval_requests
for update using (public.is_approver()) with check (public.is_approver());
create policy "admins create audit logs" on public.audit_logs
for insert with check (public.is_active_admin());
create policy "approvers read audit logs" on public.audit_logs
for select using (public.is_approver());
create policy "public submits enquiries" on public.enquiries
for insert with check (char_length(customer_name) between 1 and 120 and char_length(customer_phone) between 7 and 30);
create policy "admins read enquiries" on public.enquiries
for select using (public.is_active_admin());

create or replace function public.public_repair_status(p_job_number text)
returns table (
  job_number text,
  item text,
  received_at timestamptz,
  problem_reported text,
  status text,
  current_condition text,
  resolution_action text,
  estimated_completion date
)
language sql
security definer set search_path = public
as $$
  select
    r.job_number,
    trim(concat_ws(' ', r.device_name, r.model)) as item,
    r.received_at,
    r.problem_reported,
    r.status,
    r.current_condition,
    r.resolution_action,
    r.estimated_completion
  from public.repairs r
  where upper(r.job_number) = upper(trim(p_job_number));
$$;

grant execute on function public.public_repair_status(text) to anon, authenticated;

insert into public.categories (name, slug, sort_order) values
  ('Mobile Covers', 'covers', 1),
  ('Tempered Glass', 'tempered', 2),
  ('Audio', 'audio', 3),
  ('Spare Parts', 'spare-parts', 4),
  ('Laptop Accessories', 'laptop', 5),
  ('Repair Services', 'services', 6)
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, description, long_description, price, sku,
  inventory_quantity, low_stock_threshold, show_inventory_public, is_featured,
  art_class, art_icon, product_code, specs
)
select c.id, p.name, p.slug, p.description, p.long_description, p.price, p.sku,
  p.inventory_quantity, p.low_stock_threshold, p.show_inventory_public, p.is_featured,
  p.art_class, p.art_icon, p.product_code, p.specs
from (
  values
    ('covers', 'Shockproof Mobile Cover', 'shockproof-mobile-cover', 'Protective case with a clean matte finish.', 'Impact-resistant mobile cover with raised edges for screen and camera protection. Matte anti-fingerprint finish available for all popular models.', 249.00, 'A2Z-CVR-001', 24, 6, true, false, 'art-cover', '▣', 'A2Z / 01', '[ ["Material", "TPU + polycarbonate"], ["Fit", "All popular models"], ["Finish", "Matte anti-fingerprint"] ]'::jsonb),
    ('tempered', '9H Tempered Glass', '9h-tempered-glass', 'Clear protection for everyday screen use.', '9H hardness tempered glass with oleophobic coating. Bubble-free installation with precise cut-outs for camera and sensors.', 149.00, 'A2Z-TPG-002', 58, 15, true, false, 'art-tempered', '◇', 'A2Z / 02', '[ ["Hardness", "9H"], ["Coating", "Oleophobic anti-smudge"], ["Thickness", "0.33 mm"] ]'::jsonb),
    ('audio', 'Wireless Earbuds', 'wireless-earbuds', 'Compact everyday audio with charging case.', 'True wireless earbuds with a lightweight charging case. Clear calls, touch controls and up to 18 hours of total playtime.', 1499.00, 'A2Z-AUD-003', 12, 5, true, true, 'art-earbuds', '◉', 'A2Z / 03', '[ ["Playtime", "Up to 18 hrs with case"], ["Charging", "USB-C"], ["Bluetooth", "5.3"] ]'::jsonb),
    ('audio', 'Over-Ear Headphones', 'over-ear-headphones', 'Comfort-focused headphones for work and travel.', 'Padded over-ear headphones with balanced sound for long sessions. Foldable design with an in-line microphone for calls.', 899.00, 'A2Z-AUD-004', 9, 4, true, true, 'art-headphones', '◡', 'A2Z / 04', '[ ["Type", "Over-ear wired"], ["Microphone", "In-line"], ["Design", "Foldable"] ]'::jsonb),
    ('spare-parts', 'Charging Port Parts', 'charging-port-parts', 'Replacement parts for supported mobile models.', 'Replacement charging ports, flex cables and connectors for supported mobile models. Bring your device in for fitting.', null, 'A2Z-SPR-005', 6, 3, false, false, 'art-parts', '＋', 'A2Z / 05', '[ ["Type", "Charging port / flex"], ["Fitting", "In-shop service"], ["Warranty", "As per part"] ]'::jsonb),
    ('laptop', 'Laptop Chargers', 'laptop-chargers', 'Compatible chargers for selected laptop models.', 'Reliable compatible chargers for selected laptop brands. Voltage and pin-type checked in store before sale.', 799.00, 'A2Z-LAP-006', 15, 5, true, false, 'art-laptop', '▱', 'A2Z / 06', '[ ["Power", "45W / 65W options"], ["Pin types", "Common models covered"], ["Check", "Tested in store"] ]'::jsonb),
    ('services', 'Mobile Repair', 'mobile-repair', 'Diagnosis, component replacement and repair support.', 'Screen, battery, charging port, camera and board-level repair support for supported mobile devices. Free check-up with repair estimate.', null, 'A2Z-SRV-007', null, null, false, false, 'art-repair', '⚒', 'A2Z / 07', '[ ["Devices", "All major brands"], ["Estimate", "Free with check-up"], ["Status tracking", "Job number provided"] ]'::jsonb),
    ('services', 'Laptop Repair', 'laptop-repair', 'Hardware and accessory troubleshooting for laptops.', 'Keyboard, battery, screen, charger-port and general troubleshooting for laptops. Parts sourced on request.', null, 'A2Z-SRV-008', null, null, false, false, 'art-laptop-repair', '⌘', 'A2Z / 08', '[ ["Devices", "All major brands"], ["Estimate", "Free with check-up"], ["Status tracking", "Job number provided"] ]'::jsonb)
) as p(category_slug, name, slug, description, long_description, price, sku, inventory_quantity, low_stock_threshold, show_inventory_public, is_featured, art_class, art_icon, product_code, specs)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

insert into public.repairs (
  job_number, customer_name, customer_phone, device_name, model, received_at,
  problem_reported, initial_condition, current_condition, resolution_action,
  status, estimated_completion
) values
  ('AZ10027', 'Demo Customer', '0000000000', 'Samsung Galaxy', 'A54', '2026-09-27 12:40:00+05:30', 'Charging issue', 'Device received for inspection.', 'Device opened for charging-port inspection.', 'Charging port is being checked/repaired.', 'REPAIRING', '2026-09-29'),
  ('AZ10021', 'Demo Customer', '0000000000', 'iPhone', '13', '2026-09-26 11:15:00+05:30', 'Broken screen', 'Screen visibly cracked.', 'Screen replaced and tested.', 'Device ready for collection. Please bring your job receipt.', 'READY', '2026-09-28'),
  ('AZ10023', 'Demo Customer', '0000000000', 'HP', 'Laptop', '2026-09-27 10:05:00+05:30', 'Not powering on', 'No power response at intake.', 'Under diagnosis. Board and battery being tested.', 'Running hardware checks to find the fault.', 'CHECKING', '2026-09-30')
on conflict (job_number) do nothing;
