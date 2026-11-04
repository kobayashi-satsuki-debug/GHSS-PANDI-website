-- =============================================================
-- G H S S PANDI — starter content
-- Run after 03-rpc.sql. Safe to re-run.
-- =============================================================

insert into public.class_rooms (id, name) values
  ('8 A','Class 8 A'), ('8 B','Class 8 B'),
  ('9 A','Class 9 A'), ('9 B','Class 9 B'),
  ('10 A','Class 10 A'), ('10 B','Class 10 B'),
  ('Plus One Science','Plus One Science'),
  ('Plus One Humanities','Plus One Humanities'),
  ('Plus Two Science','Plus Two Science'),
  ('Plus Two Humanities','Plus Two Humanities')
on conflict (id) do nothing;

insert into public.notices (title_en, title_ml, body_en, body_ml, category, is_pinned, is_published, author_name, created_at)
select * from (values
 ('Half-yearly examination timetable published',
  'അർദ്ധവാർഷിക പരീക്ഷാ സമയക്രമം പ്രസിദ്ധീകരിച്ചു',
  'The timetable for the half-yearly examinations (Classes 8–12) is available at the school office and in the student portal.',
  'എട്ട് മുതൽ പന്ത്രണ്ട് വരെയുള്ള ക്ലാസുകളുടെ അർദ്ധവാർഷിക പരീക്ഷാ സമയക്രമം സ്കൂൾ ഓഫീസിലും വിദ്യാർത്ഥി പോർട്ടലിലും ലഭ്യമാണ്.',
  'exam', true, true, 'School Office', now() - interval '1 day'),
 ('Admissions open for Class 8 and Plus One',
  'എട്ടാം ക്ലാസ്, പ്ലസ് വൺ പ്രവേശനം ആരംഭിച്ചു',
  'Applications for the 2026–27 academic year are open. Submit the online enquiry form or visit the office between 9:30 am and 3:30 pm.',
  '2026–27 അധ്യയനവർഷത്തേക്കുള്ള അപേക്ഷകൾ സ്വീകരിക്കുന്നു. ഓൺലൈൻ ഫോം പൂരിപ്പിക്കുകയോ രാവിലെ 9:30 മുതൽ വൈകുന്നേരം 3:30 വരെ ഓഫീസ് സന്ദർശിക്കുകയോ ചെയ്യുക.',
  'admission', true, true, 'School Office', now() - interval '4 days'),
 ('Annual sports meet on 22 November',
  'വാർഷിക കായികമേള നവംബർ 22 ന്',
  'The annual sports meet will be held on the school ground. Parents are cordially invited. Events start at 9 am.',
  'വാർഷിക കായികമേള സ്കൂൾ മൈതാനത്ത് നടക്കും. രക്ഷിതാക്കളെ സ്വാഗതം ചെയ്യുന്നു. രാവിലെ 9 മണിക്ക് ആരംഭിക്കും.',
  'event', false, true, 'Sunitha Varma', now() - interval '7 days'),
 ('Scholarship applications — last date 30 November',
  'സ്കോളർഷിപ്പ് അപേക്ഷ — അവസാന തീയതി നവംബർ 30',
  'Eligible students of Classes 9–12 may apply for the state merit scholarship through the class teacher.',
  '9–12 ക്ലാസുകളിലെ യോഗ്യരായ വിദ്യാർത്ഥികൾ ക്ലാസ് അധ്യാപകൻ മുഖേന സ്കോളർഷിപ്പിന് അപേക്ഷിക്കുക.',
  'general', false, true, 'School Office', now() - interval '12 days'),
 ('PTA meeting — 8 November, 10 am',
  'പി.ടി.എ യോഗം — നവംബർ 8, രാവിലെ 10',
  'All parents are requested to attend the PTA meeting in the school auditorium.',
  'എല്ലാ രക്ഷിതാക്കളും സ്കൂൾ ഓഡിറ്റോറിയത്തിൽ നടക്കുന്ന പി.ടി.എ യോഗത്തിൽ പങ്കെടുക്കണം.',
  'event', false, true, 'Sunitha Varma', now() - interval '20 days')
) as v
where not exists (select 1 from public.notices);

insert into public.gallery_items (title_en, title_ml, category, src) values
 ('School main block and courtyard','സ്കൂൾ പ്രധാന കെട്ടിടവും മുറ്റവും','campus','assets/gallery/campus-01.svg'),
 ('Science laboratory','സയൻസ് ലബോറട്ടറി','campus','assets/gallery/lab-01.svg'),
 ('Library reading hall','ലൈബ്രറി വായനശാല','campus','assets/gallery/library-01.svg'),
 ('Annual sports meet','വാർഷിക കായികമേള','sports','assets/gallery/sports-01.svg'),
 ('Arts festival stage performance','കലോത്സവ വേദി','arts','assets/gallery/arts-01.svg'),
 ('Independence Day parade','സ്വാതന്ത്ര്യദിന പരേഡ്','events','assets/gallery/events-01.svg'),
 ('Classroom learning','ക്ലാസ് മുറി പഠനം','campus','assets/gallery/class-01.svg'),
 ('NSS community service','എൻ.എസ്.എസ് സേവനം','events','assets/gallery/nss-01.svg'),
 ('Science exhibition','ശാസ്ത്ര പ്രദർശനം','events','assets/gallery/science-01.svg'),
 ('Basketball court','ബാസ്കറ്റ്ബോൾ കോർട്ട്','sports','assets/gallery/sports-02.svg')
on conflict do nothing;

insert into public.achievements
 (title_en, title_ml, description_en, description_ml, student_name, class_name, category, level, event_date, icon)
select * from (values
 ('State Level Science Fair — First Prize','സംസ്ഥാന ശാസ്ത്രമേള — ഒന്നാം സ്ഥാനം',
  'Working model on low-cost rainwater harvesting won first prize at the Kasaragod district science fair and represented the district at state level.',
  'കുറഞ്ഞ ചെലവിലുള്ള മഴവെള്ള സംഭരണ മാതൃക കാസർകോട് ജില്ലാ ശാസ്ത്രമേളയിൽ ഒന്നാം സ്ഥാനം നേടി സംസ്ഥാനതലത്തിൽ പ്രതിനിധീകരിച്ചു.',
  'Anjali S. Nair','10 A','science','State', current_date - 40, '🔬'),
 ('District Youth Festival — Classical Music','ജില്ലാ യുവജനോത്സവം — സംഗീതം',
  'First place in Carnatic vocal music at the Kasaragod district youth festival.',
  'കാസർകോട് ജില്ലാ യുവജനോത്സവത്തിൽ കർണ്ണാടക സംഗീതത്തിൽ ഒന്നാം സ്ഥാനം.',
  'Fathima Beevi','10 A','arts','District', current_date - 65, '🎵'),
 ('State Athletics Meet — 800 m Silver','സംസ്ഥാന അത്ലറ്റിക്സ് — 800 മീ വെള്ളി',
  'Silver medal in the under-17 boys 800 m at the Kerala State School Athletics Meet.',
  'കേരള സ്കൂൾ അത്ലറ്റിക്സ് മീറ്റിൽ അണ്ടർ-17 ആൺകുട്ടികളുടെ 800 മീറ്ററിൽ വെള്ളി മെഡൽ.',
  'Rahul P. Kumar','10 A','sports','State', current_date - 30, '🏅'),
 ('Full A+ in SSLC Examination','എസ്.എസ്.എൽ.സി പരീക്ഷയിൽ ഫുൾ എ+',
  'Twenty-eight students secured full A+ grades in the SSLC examination, a school record.',
  'എസ്.എസ്.എൽ.സി പരീക്ഷയിൽ ഇരുപത്തിയെട്ട് വിദ്യാർത്ഥികൾ ഫുൾ എ+ നേടി — സ്കൂൾ റെക്കോർഡ്.',
  '28 students, Class of 2026','SSLC 2026','academic','State', current_date - 140, '🎓'),
 ('Kerala School Kalolsavam — Group Dance','കേരള സ്കൂൾ കലോത്സവം — ഗ്രൂപ്പ് ഡാൻസ്',
  'Our group dance team secured third place at the state school kalolsavam.',
  'സംസ്ഥാന സ്കൂൾ കലോത്സവത്തിൽ ഗ്രൂപ്പ് ഡാൻസിൽ മൂന്നാം സ്ഥാനം.',
  'School Dance Troupe','Classes 8–12','arts','State', current_date - 95, '💃'),
 ('NSS Best Unit Award','എൻ.എസ്.എസ് മികച്ച യൂണിറ്റ്',
  'Recognised for the community health and cleanliness drive in Pandi panchayat.',
  'പാണ്ടി പഞ്ചായത്തിലെ ആരോഗ്യ-ശുചിത്വ യജ്ഞത്തിന് അംഗീകാരം.',
  'NSS Unit, GHSS Pandi','Plus One & Plus Two','service','District', current_date - 75, '🤝')
) as v
where not exists (select 1 from public.achievements);

-- -------------------------------------------------------------
-- Making the office account an administrator
-- 1. Create the account normally on register.html (it becomes a teacher/student).
-- 2. Run this in the SQL editor:
--      select public.make_admin('principal@ghsspandi.in');
-- -------------------------------------------------------------
create or replace function public.make_admin(p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.profiles where lower(email) = lower(p_email);
  if v_id is null then return 'No account with that email. Create it with register.html first.'; end if;
  update public.profiles set role = 'admin', status = 'active' where id = v_id;
  delete from public.teachers where profile_id = v_id;
  delete from public.students where profile_id = v_id;
  return 'Administrator ready: ' || p_email;
end $$;

revoke all on function public.make_admin(text) from anon, authenticated;
