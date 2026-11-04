-- =============================================================
-- G H S S PANDI — server-side operations (RPC)
-- Every privileged action runs inside the database where the
-- caller's role is checked against auth.uid().
-- Run after 02-security.sql.
-- =============================================================

-- ---------- internal audit helper ----------
create or replace function public.log_moderation(p_action text, p_target text, p_details text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_id uuid := auth.uid();
begin
  select full_name into v_name from public.profiles where id = v_id;
  insert into public.moderation_log (actor_id, actor_name, action, target, details)
  values (v_id, coalesce(v_name,'system'), p_action, coalesce(p_target,''), coalesce(p_details,''));
end $$;

-- ---------- session bootstrap for the browser ----------
create or replace function public.get_my_profile()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_profile public.profiles%rowtype;
  v_student public.students%rowtype;
  v_teacher public.teachers%rowtype;
  v_classes jsonb := '[]'::jsonb;
  v_children jsonb := '[]'::jsonb;
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.id is null then return null; end if;

  if v_profile.role = 'student' then
    select * into v_student from public.students where profile_id = v_profile.id;
  elsif v_profile.role = 'teacher' then
    select * into v_teacher from public.teachers where profile_id = v_profile.id;
    select coalesce(jsonb_agg(ct.class_id), '[]'::jsonb) into v_classes
      from public.class_teachers ct where ct.teacher_id = v_teacher.id;
  elsif v_profile.role = 'parent' then
    select coalesce(jsonb_agg(jsonb_build_object(
             'link', jsonb_build_object('id', l.id, 'status', l.status, 'relationship', l.relationship),
             'student', jsonb_build_object('id', s.id, 'full_name', s.full_name, 'class', s.class, 'roll_no', s.roll_no)
           )), '[]'::jsonb) into v_children
      from public.parent_student_links l
      join public.parents pa on pa.id = l.parent_id
      join public.students s on s.id = l.student_id
      where pa.profile_id = v_profile.id;
  end if;

  return jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'student', to_jsonb(v_student),
    'teacher', to_jsonb(v_teacher),
    'classes', v_classes,
    'children', v_children
  );
end $$;

-- ---------- results: class + roll lookup with an access check ----------
create or replace function public.get_results_by_roll(p_class text, p_roll text)
returns table (
  id uuid, student_id uuid, class text, roll_no text, exam_name text, subject text,
  marks numeric, max_marks numeric, grade text, published_at timestamptz,
  student_name text, published_by_name text
)
language plpgsql stable security definer set search_path = public as $$
declare v_student public.students%rowtype;
begin
  select * into v_student from public.students
   where students.class = p_class and students.roll_no = p_roll limit 1;

  if v_student.id is null then
    return; -- no such student: return nothing rather than leaking existence
  end if;

  if not (
       v_student.profile_id = auth.uid()
       or public.is_verified_parent_of(v_student.id)
       or public.teaches_class(v_student.class)
       or public.is_admin()
     ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  return query
    select r.id, r.student_id, r.class, r.roll_no, r.exam_name, r.subject,
           r.marks, r.max_marks, r.grade, r.published_at, v_student.full_name, r.published_by_name
      from public.results r
     where r.class = p_class and r.roll_no = p_roll
     order by r.exam_name, r.subject;
end $$;

-- ---------- teacher result publishing ----------
create or replace function public.publish_results(p_rows jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  r jsonb;
  v_count int := 0;
  v_student_id uuid;
  v_name text;
  v_grade text;
  v_marks numeric;
  v_max numeric;
begin
  if not public.is_staff() then raise exception 'not_authorized' using errcode = '42501'; end if;
  select full_name into v_name from public.profiles where id = auth.uid();

  for r in select * from jsonb_array_elements(p_rows) loop
    if not (public.is_admin() or public.teaches_class(r->>'class')) then
      raise exception 'not_authorized_for_class' using errcode = '42501';
    end if;
    v_marks := coalesce((r->>'marks')::numeric, -1);
    v_max := coalesce((r->>'max_marks')::numeric, 100);
    if v_marks < 0 or v_marks > v_max then raise exception 'invalid_marks'; end if;

    select id into v_student_id from public.students
     where students.class = r->>'class' and students.roll_no = r->>'roll_no' limit 1;

    v_grade := coalesce(nullif(r->>'grade',''),
                        case when (v_marks / v_max) * 100 >= 90 then 'A+'
                             when (v_marks / v_max) * 100 >= 80 then 'A'
                             when (v_marks / v_max) * 100 >= 70 then 'B+'
                             when (v_marks / v_max) * 100 >= 60 then 'B'
                             when (v_marks / v_max) * 100 >= 50 then 'C'
                             when (v_marks / v_max) * 100 >= 40 then 'D'
                             else 'E' end);

    insert into public.results
      (student_id, class, roll_no, exam_name, subject, marks, max_marks, grade, published_by, published_by_name, published_at)
    values
      (v_student_id, r->>'class', r->>'roll_no', r->>'exam', r->>'subject', v_marks, v_max, v_grade,
       auth.uid(), coalesce(v_name,'Teacher'), now())
    on conflict (class, roll_no, exam_name, subject) do update
      set marks = excluded.marks, max_marks = excluded.max_marks, grade = excluded.grade,
          published_by = excluded.published_by, published_by_name = excluded.published_by_name,
          published_at = now(), student_id = coalesce(excluded.student_id, public.results.student_id);
    v_count := v_count + 1;
  end loop;

  perform public.log_moderation('publish_results', 'results', v_count || ' rows');
  return v_count;
end $$;

create or replace function public.delete_result(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_class text;
begin
  if not public.is_staff() then raise exception 'not_authorized' using errcode = '42501'; end if;
  select class into v_class from public.results where id = p_id;
  if v_class is null then return false; end if;
  if not (public.is_admin() or public.teaches_class(v_class)) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  delete from public.results where id = p_id;
  perform public.log_moderation('delete_result', p_id::text, v_class);
  return true;
end $$;

-- ---------- teacher approval ----------
create or replace function public.decide_teacher(p_teacher uuid, p_approve boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_name text;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;

  select profile_id, full_name into v_profile, v_name from public.teachers where id = p_teacher;
  if v_profile is null then return false; end if;

  if p_approve then
    update public.teachers set status = 'approved' where id = p_teacher;
    update public.profiles set status = 'active', updated_at = now() where id = v_profile;
  else
    update public.teachers set status = 'rejected' where id = p_teacher;
    update public.profiles set status = 'disabled', updated_at = now() where id = v_profile;
  end if;

  perform public.log_moderation(case when p_approve then 'approve_teacher' else 'reject_teacher' end,
                                p_teacher::text, v_name);
  return true;
end $$;

-- ---------- parent verification ----------
create or replace function public.link_child(p_student uuid, p_relationship text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_parent uuid := public.my_parent_id();
        v_id uuid;
begin
  if v_parent is null then raise exception 'not_a_parent' using errcode = '42501'; end if;
  if not exists (select 1 from public.students where id = p_student) then raise exception 'student_not_found'; end if;

  insert into public.parent_student_links (parent_id, student_id, relationship, status)
  values (v_parent, p_student, coalesce(nullif(p_relationship,''),'Guardian'), 'pending')
  on conflict (parent_id, student_id) do update set relationship = excluded.relationship
  returning id into v_id;

  perform public.log_moderation('request_parent_link', v_id::text, p_relationship);
  return v_id;
end $$;

create or replace function public.find_student_for_link(p_class text, p_roll text)
returns table (id uuid, full_name text, class text, roll_no text)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.my_parent_id() is null then raise exception 'not_a_parent' using errcode = '42501'; end if;
  return query select s.id, s.full_name, s.class, s.roll_no from public.students s
                where s.class = p_class and s.roll_no = p_roll limit 1;
end $$;

create or replace function public.decide_parent_link(p_link uuid, p_approve boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_info text;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;

  update public.parent_student_links
     set status = case when p_approve then 'approved' else 'rejected' end,
         verified_by = auth.uid(), verified_at = now()
   where id = p_link
   returning id into v_id;
  if v_id is null then return false; end if;

  perform public.log_moderation(case when p_approve then 'approve_parent_link' else 'reject_parent_link' end,
                                p_link::text, '');
  return true;
end $$;

-- ---------- account and class administration ----------
create or replace function public.set_account_status(p_profile uuid, p_status text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_status not in ('pending','active','disabled') then raise exception 'bad_status'; end if;
  if p_profile = auth.uid() then raise exception 'cannot_change_self'; end if;
  update public.profiles set status = p_status::public.account_status, updated_at = now() where id = p_profile;
  perform public.log_moderation('set_account_status', p_profile::text, p_status);
  return true;
end $$;

create or replace function public.assign_teacher(p_class text, p_teacher uuid, p_add boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_add then
    insert into public.class_teachers (class_id, teacher_id) values (p_class, p_teacher)
    on conflict do nothing;
  else
    delete from public.class_teachers where class_id = p_class and teacher_id = p_teacher;
  end if;
  perform public.log_moderation(case when p_add then 'assign_teacher' else 'unassign_teacher' end,
                                p_class, p_teacher::text);
  return true;
end $$;

create or replace function public.add_class(p_name text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'bad_class'; end if;
  insert into public.class_rooms (id, name) values (trim(p_name), 'Class ' || trim(p_name))
  on conflict (id) do nothing;
  perform public.log_moderation('add_class', p_name, '');
  return trim(p_name);
end $$;

-- ---------- chat moderation ----------
create or replace function public.hide_message(p_id uuid, p_hidden boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_room text;
begin
  if not public.is_staff() then raise exception 'not_authorized' using errcode = '42501'; end if;
  select room into v_room from public.chat_messages where id = p_id;
  if v_room is null then return false; end if;
  if not (public.is_admin() or public.teaches_class(v_room)) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  update public.chat_messages set hidden = p_hidden where id = p_id;
  perform public.log_moderation(case when p_hidden then 'hide_message' else 'unhide_message' end,
                                p_id::text, v_room);
  return true;
end $$;

create or replace function public.report_message(p_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authorized' using errcode = '42501'; end if;
  insert into public.chat_reports (message_id, reporter_id, reason)
  values (p_id, auth.uid(), left(coalesce(p_reason,''), 300))
  on conflict (message_id, reporter_id) do update set reason = excluded.reason, status = 'open'
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.resolve_report(p_report uuid, p_status text, p_hide boolean default false)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_msg uuid;
begin
  if not public.is_staff() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_status not in ('open','resolved','dismissed') then raise exception 'bad_status'; end if;

  select message_id into v_msg from public.chat_reports where id = p_report;
  if v_msg is null then return false; end if;
  if p_hide then perform public.hide_message(v_msg, true); end if;

  update public.chat_reports set status = p_status, resolved_by = auth.uid(), resolved_at = now()
   where id = p_report;
  perform public.log_moderation('resolve_report', p_report::text, p_status);
  return true;
end $$;

-- ---------- public teacher directory ----------
create or replace function public.get_public_teachers()
returns table (full_name text, subject text, designation text, classes text[])
language sql stable security definer set search_path = public as $$
  select t.full_name, t.subject, t.designation,
         coalesce(array_agg(ct.class_id) filter (where ct.class_id is not null), '{}') as classes
    from public.teachers t
    left join public.class_teachers ct on ct.teacher_id = t.id
   where t.status = 'approved'
   group by t.id, t.full_name, t.subject, t.designation
   order by t.designation, t.full_name;
$$;

-- ---------- admission enquiry (public, rate-limited by size checks) ----------
create or replace function public.submit_admission_enquiry(p_data jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if coalesce(length(p_data->>'student_name'),0) < 2
     or coalesce(length(p_data->>'parent_name'),0) < 2
     or coalesce(p_data->>'phone','') !~ '^[0-9]{10}$' then
    raise exception 'invalid_enquiry';
  end if;
  insert into public.admission_enquiries (student_name, parent_name, phone, email, class, message)
  values (left(p_data->>'student_name', 120), left(p_data->>'parent_name', 120),
          p_data->>'phone', left(coalesce(p_data->>'email',''), 160),
          left(p_data->>'class', 40), left(coalesce(p_data->>'message',''), 1000))
  returning id into v_id;
  return v_id;
end $$;

-- ---------- grants ----------
revoke all on function public.get_my_profile() from anon;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_results_by_roll(text, text) to authenticated;
grant execute on function public.publish_results(jsonb) to authenticated;
grant execute on function public.delete_result(uuid) to authenticated;
grant execute on function public.decide_teacher(uuid, boolean) to authenticated;
grant execute on function public.link_child(uuid, text) to authenticated;
grant execute on function public.find_student_for_link(text, text) to authenticated;
grant execute on function public.decide_parent_link(uuid, boolean) to authenticated;
grant execute on function public.set_account_status(uuid, text) to authenticated;
grant execute on function public.assign_teacher(text, uuid, boolean) to authenticated;
grant execute on function public.add_class(text) to authenticated;
grant execute on function public.hide_message(uuid, boolean) to authenticated;
grant execute on function public.report_message(uuid, text) to authenticated;
grant execute on function public.resolve_report(uuid, text, boolean) to authenticated;
grant execute on function public.get_public_teachers() to anon, authenticated;
grant execute on function public.submit_admission_enquiry(jsonb) to anon, authenticated;
