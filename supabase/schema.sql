-- Create the job_alerts table
create table public.job_alerts (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  email text not null,
  role text not null,
  country text not null,
  frequency text not null default 'daily'::text,
  is_active boolean not null default true,
  last_alerted_at timestamp with time zone null,
  constraint job_alerts_pkey primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.job_alerts enable row level security;

-- Create a policy to allow anyone to insert (since we don't have auth yet)
-- In a real app, you might want to restrict this or use a service key
create policy "Enable insert for all users" on "public"."job_alerts"
as permissive for insert
to public
with check (true);

-- Create a policy to allow the service role (Edge Function) to read/update
create policy "Enable read access for service role" on "public"."job_alerts"
as permissive for select
to service_role
using (true);

create policy "Enable update access for service role" on "public"."job_alerts"
as permissive for update
to service_role
using (true);
