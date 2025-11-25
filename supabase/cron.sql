-- Enable the pg_cron extension
create extension if not exists pg_cron;

-- Schedule the check-alerts function to run every day at 9:00 AM UTC
select cron.schedule(
  'check-alerts-daily', -- unique name for the job
  '0 9 * * *',          -- cron syntax (min hour day month day-of-week)
  $$
    select
      net.http_post(
          url:='https://wlmqjqnulragbmkqhxrp.supabase.co/functions/v1/check-alerts',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbXFqcW51bHJhZ2Jta3FoeHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNDQ5ODMsImV4cCI6MjA3OTYyMDk4M30.BluO8IBt2bqq_Wwayik_FyOnK4AZLU0DDqXp4QuWKUk"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
  $$
);

-- To un-schedule:
-- select cron.unschedule('check-alerts-daily');
