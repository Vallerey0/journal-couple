-- Drop table if exists to ensure clean slate for schema update (since it's a new table)
drop table if exists payment_resync_logs;

create table if not exists payment_resync_logs (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references payment_intents(id) on delete cascade,
  order_id text not null,
  checked_at timestamptz not null default now(),
  midtrans_status text,
  midtrans_response_code text,
  triggered_rpc boolean not null default false,
  admin_user_id uuid null references auth.users(id) on delete set null,
  error_message text null,
  details jsonb null
);

-- Indexes for performance
create index if not exists idx_payment_resync_logs_intent_id on payment_resync_logs(intent_id);
create index if not exists idx_payment_resync_logs_checked_at on payment_resync_logs(checked_at desc);

-- Enable RLS
alter table payment_resync_logs enable row level security;

-- Create policy for admin only (assuming profiles table has role column)
create policy "admin only"
on payment_resync_logs
for all
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
