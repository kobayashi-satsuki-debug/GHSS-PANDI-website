-- 14-profile-edit.sql — let a signed-in person correct their own name and phone.
-- Safe to re-run. Run after 13-security-advance.sql.

-- Why a function instead of a direct update: 13 revokes table-wide UPDATE and
-- allows only full_name and phone on profiles, while students, teachers and
-- parents are read-only for users. A name lives in both the profile row and the
-- role row, so this keeps the two in step in one transaction. A user can only
-- ever touch their own rows: the id comes from auth.uid(), not the client.

create or replace function public.update_my_profile(p_full_name text, p_phone text default '')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text := btrim(coalesce(p_full_name, ''));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_role  public.app_role;
begin
  if v_uid is null then
    raise exception 'Please sign in first.' using errcode = '42501';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role is null then
    raise exception 'Your school account was not found. Ask the office for help.' using errcode = 'P0002';
  end if;

  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'Please write your full name (2 to 80 characters).' using errcode = '22023';
  end if;
  if v_phone <> '' and v_phone !~ '^[0-9]{10}$' then
    raise exception 'Enter a 10-digit mobile number, or leave the field empty.' using errcode = '22023';
  end if;

  update public.profiles
     set full_name = v_name,
         phone = v_phone,
         updated_at = now()
   where id = v_uid;

  update public.students set full_name = v_name where profile_id = v_uid;
  update public.teachers set full_name = v_name where profile_id = v_uid;
  update public.parents  set full_name = v_name, phone = v_phone where profile_id = v_uid;

  return jsonb_build_object('full_name', v_name, 'phone', v_phone, 'role', v_role);
end $$;

revoke all on function public.update_my_profile(text, text) from anon, public;
grant execute on function public.update_my_profile(text, text) to authenticated;

-- Report
select 'profile edit function present' as check_name,
       (select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'update_my_profile') as detail
union all
select 'executable by signed-in users',
       coalesce((select string_agg(p.proname, ', ')
                   from pg_proc p
                   join pg_namespace n on n.oid = p.pronamespace
                   join aclexplode(p.proacl) a on a.grantee = (select oid from pg_roles where rolname = 'authenticated')
                  where n.nspname = 'public' and p.proname = 'update_my_profile'), 'none');
