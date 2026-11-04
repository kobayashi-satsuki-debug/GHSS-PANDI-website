/* =========================================================
   G H S S PANDI — professional security hardening
   Run AFTER 01-schema.sql … 05-fix-students-unique.sql.
   Safe to run more than once.
   ========================================================= */

-- ---------- 1. rate limiting -------------------------------------------
create table if not exists public.rate_limits (
  bucket       text primary key,
  hits         int not null default 0,
  window_start timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.take_rate_limit(p_bucket text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hits int; v_start timestamptz;
begin
  if p_bucket is null or p_bucket = '' then return false; end if;

  insert into public.rate_limits (bucket, hits, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update
    set hits = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                    then 1 else public.rate_limits.hits + 1 end,
        window_start = case when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
                    then now() else public.rate_limits.window_start end
  returning hits, window_start into v_hits, v_start;

  delete from public.rate_limits where window_start < now() - interval '1 day';
  return v_hits <= p_limit;
end $$;

revoke all on function public.take_rate_limit(text, int, int) from anon, authenticated, public;

-- ---------- 2. security log --------------------------------------------
create table if not exists public.security_log (
  id         bigserial primary key,
  actor_id   uuid,
  actor_role text,
  action     text not null,
  target     text,
  details    text,
  created_at timestamptz not null default now()
);

create index if not exists security_log_created_idx on public.security_log (created_at desc);

alter table public.security_log enable row level security;
revoke all on public.security_log from anon, authenticated;

drop policy if exists security_log_admin_read on public.security_log;
create policy security_log_admin_read on public.security_log
  for select to authenticated using (public.is_admin());

grant select on public.security_log to authenticated;

create or replace function public.log_security(p_action text, p_target text, p_details text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_role text;
begin
  select role::text into v_role from public.profiles where id = auth.uid();
  insert into public.security_log (actor_id, actor_role, action, target, details)
  values (auth.uid(), v_role, left(p_action, 60), left(p_target, 200), left(coalesce(p_details, ''), 500));
end $$;

revoke all on function public.log_security(text, text, text) from anon, authenticated, public;

-- ---------- 3. stop privilege escalation on profiles --------------------
create or replace function public.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;                       -- service role / database owner
  end if;

  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'role_change_denied' using errcode = '42501';
    end if;
    perform public.log_security('role_change', new.id::text, old.role::text || ' -> ' || new.role::text);
  end if;

  if new.status is distinct from old.status then
    if not public.is_staff() then
      raise exception 'status_change_denied' using errcode = '42501';
    end if;
    perform public.log_security('status_change', new.id::text, old.status::text || ' -> ' || new.status::text);
  end if;

  return new;
end $$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- ---------- 4. rate limited public enquiry form ------------------------
create or replace function public.submit_admission_enquiry(p_data jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_phone text := regexp_replace(coalesce(p_data->>'phone',''), '[^0-9]', '', 'g');
begin
  if length(trim(coalesce(p_data->>'student_name',''))) < 2
     or length(trim(coalesce(p_data->>'parent_name',''))) < 2
     or length(trim(coalesce(p_data->>'student_name',''))) > 80
     or length(trim(coalesce(p_data->>'parent_name',''))) > 80
     or v_phone !~ '^[0-9]{10}$'
     or length(coalesce(p_data->>'message','')) > 1000
     or length(coalesce(p_data->>'email','')) > 120 then
    raise exception 'invalid_input';
  end if;

  if not public.take_rate_limit('enquiry:' || v_phone, 3, 3600)
     or not public.take_rate_limit('enquiry:all', 200, 86400) then
    raise exception 'rate_limited' using errcode = '42901';
  end if;

  insert into public.admission_enquiries
    (student_name, parent_name, phone, email, class, message)
  values (trim(p_data->>'student_name'), trim(p_data->>'parent_name'), v_phone,
          left(coalesce(p_data->>'email',''), 120), left(coalesce(p_data->>'class',''), 40),
          left(coalesce(p_data->>'message',''), 1000))
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.submit_admission_enquiry(jsonb) from public, anon, authenticated;
grant execute on function public.submit_admission_enquiry(jsonb) to anon, authenticated;

-- ---------- 5. rate limited chat reports -------------------------------
create or replace function public.report_message(p_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authorized' using errcode = '42501'; end if;

  if not public.take_rate_limit('report:' || auth.uid()::text, 10, 3600) then
    raise exception 'rate_limited' using errcode = '42901';
  end if;

  insert into public.chat_reports (message_id, reporter_id, reason)
  values (p_id, auth.uid(), left(coalesce(p_reason,''), 300))
  on conflict (message_id, reporter_id) do update set reason = excluded.reason, status = 'open'
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.report_message(uuid, text) from public, anon, authenticated;
grant execute on function public.report_message(uuid, text) to authenticated;

-- ---------- 6. server-side only helpers --------------------------------
revoke all on function public.log_moderation(text, text, text) from anon, authenticated, public;

-- ---------- 7. future functions start locked down ----------------------
alter default privileges in schema public revoke execute on functions from anon, authenticated;
alter default privileges in schema public revoke select, insert, update, delete on tables from anon;
