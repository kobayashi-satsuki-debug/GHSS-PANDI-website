-- =============================================================
-- G H S S PANDI — role helpers and Row Level Security
-- Run after 01-schema.sql.
-- =============================================================

-- ---------- helper functions (security definer: no recursion) ----------
create or replace function public.my_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and role in ('teacher','admin') and status = 'active')
     and (public.is_admin() or public.teacher_is_approved());
$$;

create or replace function public.my_teacher_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.teachers where profile_id = auth.uid() and status = 'approved';
$$;

create or replace function public.my_student_row()
returns public.students language sql stable security definer set search_path = public as $$
  select * from public.students where profile_id = auth.uid();
$$;

create or replace function public.teaches_class(p_class text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_teachers ct
    join public.teachers t on t.id = ct.teacher_id
    where ct.class_id = p_class and t.profile_id = auth.uid() and t.status = 'approved'
  );
$$;

create or replace function public.my_parent_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.parents where profile_id = auth.uid();
$$;

create or replace function public.is_verified_parent_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_student_links l
    join public.parents pa on pa.id = l.parent_id
    where l.student_id = p_student and pa.profile_id = auth.uid() and l.status = 'approved'
  );
$$;

create or replace function public.can_view_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s where s.id = p_student and s.profile_id = auth.uid())
      or public.is_verified_parent_of(p_student)
      or public.is_admin()
      or exists (select 1 from public.students s
                 where s.id = p_student and public.teaches_class(s.class));
$$;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles              enable row level security;
alter table public.students              enable row level security;
alter table public.teachers              enable row level security;
alter table public.parents               enable row level security;
alter table public.parent_student_links  enable row level security;
alter table public.class_rooms           enable row level security;
alter table public.class_teachers        enable row level security;
alter table public.notices               enable row level security;
alter table public.results               enable row level security;
alter table public.chat_messages         enable row level security;
alter table public.chat_reports          enable row level security;
alter table public.moderation_log        enable row level security;
alter table public.gallery_items         enable row level security;
alter table public.achievements          enable row level security;
alter table public.admission_enquiries   enable row level security;

-- ---------- profiles ----------
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid() or public.is_admin() or public.is_staff());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- ---------- students ----------
drop policy if exists students_read on public.students;
create policy students_read on public.students for select
  using (profile_id = auth.uid()
         or public.is_admin()
         or public.teaches_class(class)
         or public.is_verified_parent_of(id));

drop policy if exists students_admin_write on public.students;
create policy students_admin_write on public.students for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- teachers ----------
drop policy if exists teachers_read on public.teachers;
create policy teachers_read on public.teachers for select
  using (profile_id = auth.uid() or public.is_admin() or status = 'approved');

drop policy if exists teachers_admin_write on public.teachers;
create policy teachers_admin_write on public.teachers for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- parents ----------
drop policy if exists parents_read on public.parents;
create policy parents_read on public.parents for select
  using (profile_id = auth.uid() or public.is_admin());

drop policy if exists parents_self_update on public.parents;
create policy parents_self_update on public.parents for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists parents_admin_write on public.parents;
create policy parents_admin_write on public.parents for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- parent links ----------
drop policy if exists links_read on public.parent_student_links;
create policy links_read on public.parent_student_links for select
  using (parent_id = public.my_parent_id() or public.is_admin());

drop policy if exists links_admin_write on public.parent_student_links;
create policy links_admin_write on public.parent_student_links for all
  using (public.is_admin()) with check (public.is_admin());
-- parents create links only through the link_child() RPC

-- ---------- classes ----------
drop policy if exists classes_read on public.class_rooms;
create policy classes_read on public.class_rooms for select
  using (auth.uid() is not null);

drop policy if exists classes_admin_write on public.class_rooms;
create policy classes_admin_write on public.class_rooms for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists class_teachers_read on public.class_teachers;
create policy class_teachers_read on public.class_teachers for select
  using (auth.uid() is not null);

drop policy if exists class_teachers_admin_write on public.class_teachers;
create policy class_teachers_admin_write on public.class_teachers for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- notices ----------
drop policy if exists notices_public_read on public.notices;
create policy notices_public_read on public.notices for select
  using (is_published = true or public.is_staff());

drop policy if exists notices_staff_write on public.notices;
create policy notices_staff_write on public.notices for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------- results: never public ----------
drop policy if exists results_read on public.results;
create policy results_read on public.results for select
  using (
    public.is_admin()
    or public.teaches_class(class)
    or exists (select 1 from public.students s where s.id = student_id and s.profile_id = auth.uid())
    or (student_id is not null and public.is_verified_parent_of(student_id))
  );

drop policy if exists results_staff_write on public.results;
create policy results_staff_write on public.results for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------- chat ----------
drop policy if exists chat_read on public.chat_messages;
create policy chat_read on public.chat_messages for select
  using (
    public.is_admin()
    or public.teaches_class(room)
    or (public.my_role() = 'student' and exists (
          select 1 from public.students s where s.profile_id = auth.uid() and s.class = room))
  );

drop policy if exists chat_insert on public.chat_messages;
create policy chat_insert on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and (public.is_admin()
         or public.teaches_class(room)
         or (public.my_role() = 'student' and exists (
               select 1 from public.students s where s.profile_id = auth.uid() and s.class = room)))
  );
-- no generic update/delete: hiding and moderation happen through RPCs

drop policy if exists reports_read on public.chat_reports;
create policy reports_read on public.chat_reports for select
  using (public.is_staff() or reporter_id = auth.uid());

drop policy if exists reports_insert on public.chat_reports;
create policy reports_insert on public.chat_reports for insert
  with check (reporter_id = auth.uid());

drop policy if exists reports_staff_update on public.chat_reports;
create policy reports_staff_update on public.chat_reports for update
  using (public.is_staff()) with check (public.is_staff());

-- ---------- moderation log ----------
drop policy if exists modlog_read on public.moderation_log;
create policy modlog_read on public.moderation_log for select using (public.is_staff());

drop policy if exists modlog_insert on public.moderation_log;
create policy modlog_insert on public.moderation_log for insert with check (public.is_staff());

-- ---------- public content ----------
drop policy if exists gallery_public_read on public.gallery_items;
create policy gallery_public_read on public.gallery_items for select using (true);

drop policy if exists gallery_staff_write on public.gallery_items;
create policy gallery_staff_write on public.gallery_items for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists achievements_public_read on public.achievements;
create policy achievements_public_read on public.achievements for select using (true);

drop policy if exists achievements_staff_write on public.achievements;
create policy achievements_staff_write on public.achievements for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------- admission enquiries ----------
drop policy if exists enquiries_insert on public.admission_enquiries;
create policy enquiries_insert on public.admission_enquiries for insert with check (true);

drop policy if exists enquiries_admin_read on public.admission_enquiries;
create policy enquiries_admin_read on public.admission_enquiries for select using (public.is_admin());

drop policy if exists enquiries_admin_update on public.admission_enquiries;
create policy enquiries_admin_update on public.admission_enquiries for update
  using (public.is_admin()) with check (public.is_admin());
