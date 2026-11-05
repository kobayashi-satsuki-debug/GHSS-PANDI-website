/* =========================================================
   DEMO BACKEND — browser-only store used when Supabase keys
   are not yet configured. Mirrors the Supabase API surface so
   the same pages work before and after going live.
   Never treat this as security: rules are enforced in SQL.
   ========================================================= */
(function () {
  const KEY = 'ghss_demo_db_v1';
  const SESSION_KEY = 'ghss_demo_session';
  const listeners = new Set();

  const uid = () => 'x' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const now = () => new Date().toISOString();
  const DEMO_PASSWORD = 'pandi2026';

  async function hash(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ghss:' + str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function iso(daysAgo, hour) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour || 10, 15, 0, 0);
    return d.toISOString();
  }

  function seed() {
    const t1 = uid(), t2 = uid(), t3 = uid();
    const s1 = uid(), s2 = uid(), s3 = uid(), s4 = uid();
    const p1 = uid();
    return {
      profiles: [
        { id: 'admin-1', email: 'principal@ghsspandi.in', full_name: 'Dr. K. Ramesh Kumar', role: 'admin', phone: '9446553567', status: 'active', created_at: iso(400) },
        { id: t1, email: 'teacher@ghsspandi.in', full_name: 'Sunitha Varma', role: 'teacher', phone: '9847012345', status: 'active', created_at: iso(320) },
        { id: t2, email: 'pending.teacher@ghsspandi.in', full_name: 'Anoop K. Menon', role: 'teacher', phone: '9847054321', status: 'pending', created_at: iso(2) },
        { id: t3, email: 'maths.teacher@ghsspandi.in', full_name: 'Joshy Mathew', role: 'teacher', phone: '9946112233', status: 'active', created_at: iso(300) },
        { id: s1, email: 'student@ghsspandi.in', full_name: 'Anjali S. Nair', role: 'student', phone: '9744556677', status: 'active', created_at: iso(200) },
        { id: s2, email: 'rahul.student@ghsspandi.in', full_name: 'Rahul P. Kumar', role: 'student', phone: '9744556678', status: 'active', created_at: iso(200) },
        { id: s3, email: 'fathima.student@ghsspandi.in', full_name: 'Fathima Beevi', role: 'student', phone: '9744556679', status: 'active', created_at: iso(190) },
        { id: s4, email: 'arjun.student@ghsspandi.in', full_name: 'Arjun Das', role: 'student', phone: '9744556680', status: 'pending', created_at: iso(1) },
        { id: p1, email: 'parent@ghsspandi.in', full_name: 'Sreedevi Nair', role: 'parent', phone: '9447551122', status: 'active', created_at: iso(150) }
      ],
      students: [
        { id: s1, profile_id: s1, full_name: 'Anjali S. Nair', class: '10 A', roll_no: '101', admission_no: '2018345', status: 'active' },
        { id: s2, profile_id: s2, full_name: 'Rahul P. Kumar', class: '10 A', roll_no: '102', admission_no: '2018346', status: 'active' },
        { id: s3, profile_id: s3, full_name: 'Fathima Beevi', class: '10 A', roll_no: '103', admission_no: '2018347', status: 'active' },
        { id: s4, profile_id: s4, full_name: 'Arjun Das', class: '10 B', roll_no: '118', admission_no: '2018348', status: 'pending' }
      ],
      teachers: [
        { id: t1, profile_id: t1, full_name: 'Sunitha Varma', employee_no: 'GHSS-1024', subject: 'English', designation: 'HSA English', status: 'approved', classes: ['10 A'] },
        { id: t3, profile_id: t3, full_name: 'Joshy Mathew', employee_no: 'GHSS-1011', subject: 'Mathematics', designation: 'HSA Maths', status: 'approved', classes: ['10 A', '10 B'] },
        { id: t2, profile_id: t2, full_name: 'Anoop K. Menon', employee_no: 'GHSS-1099', subject: 'Science', designation: 'HSA Science', status: 'pending', classes: [] }
      ],
      parents: [
        { id: p1, profile_id: p1, full_name: 'Sreedevi Nair', phone: '9447551122' }
      ],
      links: [
        { id: uid(), parent_id: p1, student_id: s1, relationship: 'Mother', status: 'approved', verified_by: 'admin-1', verified_at: iso(120), created_at: iso(148) }
      ],
      classes: [
        { id: '10 A', name: 'Class 10 A', teacher_ids: [t1, t3] },
        { id: '10 B', name: 'Class 10 B', teacher_ids: [t3] },
        { id: '9 A', name: 'Class 9 A', teacher_ids: [] }
      ],
      notices: [
        { id: uid(), title_en: 'Half-yearly examination timetable published', title_ml: 'അർദ്ധവാർഷിക പരീക്ഷാ സമയക്രമം പ്രസിദ്ധീകരിച്ചു', body_en: 'The timetable for the half-yearly examinations (Classes 8–12) is now available at the school office and in the student portal.', body_ml: 'എട്ട് മുതൽ പന്ത്രണ്ട് വരെയുള്ള ക്ലാസുകളുടെ അർദ്ധവാർഷിക പരീക്ഷാ സമയക്രമം സ്കൂൾ ഓഫീസിലും വിദ്യാർത്ഥി പോർട്ടലിലും ലഭ്യമാണ്.', category: 'exam', is_published: true, is_pinned: true, author: 'Dr. K. Ramesh Kumar', created_at: iso(1, 9) },
        { id: uid(), title_en: 'Admissions open for Class 8 and Plus One', title_ml: 'എട്ടാം ക്ലാസ്, പ്ലസ് വൺ പ്രവേശനം ആരംഭിച്ചു', body_en: 'Applications for the 2026–27 academic year are open. Submit the online enquiry form or visit the office between 9:30 am and 3:30 pm.', body_ml: '2026–27 അധ്യയനവർഷത്തേക്കുള്ള അപേക്ഷകൾ സ്വീകരിക്കുന്നു. ഓൺലൈൻ ഫോം പൂരിപ്പിക്കുകയോ രാവിലെ 9:30 മുതൽ വൈകുന്നേരം 3:30 വരെ ഓഫീസ് സന്ദർശിക്കുകയോ ചെയ്യുക.', category: 'admission', is_published: true, is_pinned: true, author: 'Dr. K. Ramesh Kumar', created_at: iso(4, 11) },
        { id: uid(), title_en: 'Annual sports meet on 22 November', title_ml: 'വാർഷിക കായികമേള നവംബർ 22 ന്', body_en: 'The annual sports meet will be held on the school ground. Parents are cordially invited. Events start at 9 am.', body_ml: 'വാർഷിക കായികമേള സ്കൂൾ മൈതാനത്ത് നടക്കും. രക്ഷിതാക്കളെ സ്വാഗതം ചെയ്യുന്നു. രാവിലെ 9 മണിക്ക് ആരംഭിക്കും.', category: 'event', is_published: true, is_pinned: false, author: 'Sunitha Varma', created_at: iso(7, 14) },
        { id: uid(), title_en: 'Scholarship applications — last date 30 November', title_ml: 'സ്കോളർഷിപ്പ് അപേക്ഷ — അവസാന തീയതി നവംബർ 30', body_en: 'Eligible students of Classes 9–12 may apply for the state merit scholarship through the class teacher.', body_ml: '9–12 ക്ലാസുകളിലെ യോഗ്യരായ വിദ്യാർത്ഥികൾ ക്ലാസ് അധ്യാപകൻ മുഖേന സ്കോളർഷിപ്പിന് അപേക്ഷിക്കുക.', category: 'general', is_published: true, is_pinned: false, author: 'Dr. K. Ramesh Kumar', created_at: iso(12, 10) },
        { id: uid(), title_en: 'PTA meeting — 8 November, 10 am', title_ml: 'പി.ടി.എ യോഗം — നവംബർ 8, രാവിലെ 10', body_en: 'All parents are requested to attend the PTA meeting in the school auditorium.', body_ml: 'എല്ലാ രക്ഷിതാക്കളും സ്കൂൾ ഓഡിറ്റോറിയത്തിൽ നടക്കുന്ന പി.ടി.എ യോഗത്തിൽ പങ്കെടുക്കണം.', category: 'event', is_published: true, is_pinned: false, author: 'Sunitha Varma', created_at: iso(20, 15) }
      ],
      results: [
        { id: uid(), student_id: s1, class: '10 A', roll_no: '101', exam: 'First Terminal Examination 2026', subject: 'English', marks: 88, max_marks: 100, grade: 'A', published_at: iso(6), published_by: 'Sunitha Varma' },
        { id: uid(), student_id: s1, class: '10 A', roll_no: '101', exam: 'First Terminal Examination 2026', subject: 'Mathematics', marks: 95, max_marks: 100, grade: 'A+', published_at: iso(6), published_by: 'Joshy Mathew' },
        { id: uid(), student_id: s1, class: '10 A', roll_no: '101', exam: 'First Terminal Examination 2026', subject: 'Science', marks: 91, max_marks: 100, grade: 'A+', published_at: iso(6), published_by: 'Sunitha Varma' },
        { id: uid(), student_id: s1, class: '10 A', roll_no: '101', exam: 'First Terminal Examination 2026', subject: 'Social Science', marks: 84, max_marks: 100, grade: 'A', published_at: iso(6), published_by: 'Sunitha Varma' },
        { id: uid(), student_id: s1, class: '10 A', roll_no: '101', exam: 'First Terminal Examination 2026', subject: 'Malayalam', marks: 78, max_marks: 100, grade: 'B+', published_at: iso(6), published_by: 'Sunitha Varma' },
        { id: uid(), student_id: s2, class: '10 A', roll_no: '102', exam: 'First Terminal Examination 2026', subject: 'English', marks: 72, max_marks: 100, grade: 'B+', published_at: iso(6), published_by: 'Sunitha Varma' },
        { id: uid(), student_id: s2, class: '10 A', roll_no: '102', exam: 'First Terminal Examination 2026', subject: 'Mathematics', marks: 66, max_marks: 100, grade: 'B', published_at: iso(6), published_by: 'Joshy Mathew' },
        { id: uid(), student_id: s2, class: '10 A', roll_no: '102', exam: 'First Terminal Examination 2026', subject: 'Science', marks: 74, max_marks: 100, grade: 'B+', published_at: iso(6), published_by: 'Sunitha Varma' },
        { id: uid(), student_id: s2, class: '10 A', roll_no: '102', exam: 'First Terminal Examination 2026', subject: 'Social Science', marks: 81, max_marks: 100, grade: 'A', published_at: iso(6), published_by: 'Sunitha Varma' },
        { id: uid(), student_id: s2, class: '10 A', roll_no: '102', exam: 'First Terminal Examination 2026', subject: 'Malayalam', marks: 69, max_marks: 100, grade: 'B', published_at: iso(6), published_by: 'Sunitha Varma' }
      ],
      chat: [
        { id: uid(), room: '10 A', sender_id: t1, sender_name: 'Sunitha Varma', sender_role: 'teacher', body: 'Good morning, class! Please bring your English workbooks tomorrow.', hidden: false, created_at: iso(2, 8) },
        { id: uid(), room: '10 A', sender_id: s1, sender_name: 'Anjali S. Nair', sender_role: 'student', body: 'Good morning ma\'am. Noted.', hidden: false, created_at: iso(2, 8) },
        { id: uid(), room: '10 A', sender_id: s2, sender_name: 'Rahul P. Kumar', sender_role: 'student', body: 'Will the maths revision class be at 3 pm?', hidden: false, created_at: iso(1, 16) },
        { id: uid(), room: '10 A', sender_id: t3, sender_name: 'Joshy Mathew', sender_role: 'teacher', body: 'Yes Rahul, revision starts at 3 pm in Room 12.', hidden: false, created_at: iso(1, 16) },
        { id: uid(), room: '10 A', sender_id: s3, sender_name: 'Fathima Beevi', sender_role: 'student', body: 'Thank you sir!', hidden: false, created_at: iso(0, 9) }
      ],
      reports: [],
      modlog: [],
      achievements: [
        { id: uid(), title_en: 'State Level Science Fair — First Prize', title_ml: 'സംസ്ഥാന ശാസ്ത്രമേള — ഒന്നാം സ്ഥാനം', student_name: 'Anjali S. Nair', class_name: '10 A', category: 'science', level: 'State', description_en: 'Working model on low-cost rainwater harvesting won first prize at the Kasaragod district science fair and represented the district at state level.', description_ml: 'കുറഞ്ഞ ചെലവിലുള്ള മഴവെള്ള സംഭരണ മാതൃക കാസർകോട് ജില്ലാ ശാസ്ത്രമേളയിൽ ഒന്നാം സ്ഥാനം നേടി സംസ്ഥാനതലത്തിൽ പ്രതിനിധീകരിച്ചു.', event_date: iso(40), icon: '🔬' },
        { id: uid(), title_en: 'District Youth Festival — Classical Music', title_ml: 'ജില്ലാ യുവജനോത്സവം — സംഗീതം', student_name: 'Fathima Beevi', class_name: '10 A', category: 'arts', level: 'District', description_en: 'First place in Carnatic vocal music at the Kasaragod district youth festival.', description_ml: 'കാസർകോട് ജില്ലാ യുവജനോത്സവത്തിൽ കർണ്ണാടക സംഗീതത്തിൽ ഒന്നാം സ്ഥാനം.', event_date: iso(65), icon: '🎵' },
        { id: uid(), title_en: 'State Athletics Meet — 800 m Silver', title_ml: 'സംസ്ഥാന അത്ലറ്റിക്സ് — 800 മീ വെള്ളി', student_name: 'Rahul P. Kumar', class_name: '10 A', category: 'sports', level: 'State', description_en: 'Silver medal in the under-17 boys 800 m at the Kerala State School Athletics Meet.', description_ml: 'കേരള സ്കൂൾ അത്ലറ്റിക്സ് മീറ്റിൽ അണ്ടർ-17 ആൺകുട്ടികളുടെ 800 മീറ്ററിൽ വെള്ളി മെഡൽ.', event_date: iso(30), icon: '🏅' },
        { id: uid(), title_en: 'Full A+ in SSLC Examination', title_ml: 'എസ്.എസ്.എൽ.സി പരീക്ഷയിൽ ഫുൾ എ+', student_name: '28 students, Class of 2026', class_name: 'SSLC 2026', category: 'academic', level: 'State', description_en: 'Twenty-eight students secured full A+ grades in the SSLC examination, a school record.', description_ml: 'എസ്.എസ്.എൽ.സി പരീക്ഷയിൽ ഇരുപത്തിയെട്ട് വിദ്യാർത്ഥികൾ ഫുൾ എ+ നേടി — സ്കൂൾ റെക്കോർഡ്.', event_date: iso(140), icon: '🎓' },
        { id: uid(), title_en: 'Kerala School Kalolsavam — Group Dance', title_ml: 'കേരള സ്കൂൾ കലോത്സവം — ഗ്രൂപ്പ് ഡാൻസ്', student_name: 'School Dance Troupe', class_name: 'Classes 8–12', category: 'arts', level: 'State', description_en: 'Our group dance team secured third place at the state school kalolsavam.', description_ml: 'സംസ്ഥാന സ്കൂൾ കലോത്സവത്തിൽ ഗ്രൂപ്പ് ഡാൻസിൽ മൂന്നാം സ്ഥാനം.', event_date: iso(95), icon: '💃' },
        { id: uid(), title_en: 'NSS Best Unit Award', title_ml: 'എൻ.എസ്.എസ് മികച്ച യൂണിറ്റ്', student_name: 'NSS Unit, GHSS Pandi', class_name: 'Plus One & Plus Two', category: 'service', level: 'District', description_en: 'Recognised for the community health and cleanliness drive in Pandi panchayat.', description_ml: 'പാണ്ടി പഞ്ചായത്തിലെ ആരോഗ്യ-ശുചിത്വ യജ്ഞത്തിന് അംഗീകാരം.', event_date: iso(75), icon: '🤝' }
      ],
      gallery: [
        { id: uid(), title_en: 'School main block and courtyard', title_ml: 'സ്കൂൾ പ്രധാന കെട്ടിടവും മുറ്റവും', category: 'campus', src: 'assets/gallery/campus-01.svg' },
        { id: uid(), title_en: 'Science laboratory', title_ml: 'സയൻസ് ലബോറട്ടറി', category: 'campus', src: 'assets/gallery/lab-01.svg' },
        { id: uid(), title_en: 'Library reading hall', title_ml: 'ലൈബ്രറി വായനശാല', category: 'campus', src: 'assets/gallery/library-01.svg' },
        { id: uid(), title_en: 'Annual sports meet', title_ml: 'വാർഷിക കായികമേള', category: 'sports', src: 'assets/gallery/sports-01.svg' },
        { id: uid(), title_en: 'Arts festival stage performance', title_ml: 'കലോത്സവ വേദി', category: 'arts', src: 'assets/gallery/arts-01.svg' },
        { id: uid(), title_en: 'Independence Day parade', title_ml: 'സ്വാതന്ത്ര്യദിന പരേഡ്', category: 'events', src: 'assets/gallery/events-01.svg' },
        { id: uid(), title_en: 'Classroom learning', title_ml: 'ക്ലാസ് മുറി പഠനം', category: 'campus', src: 'assets/gallery/class-01.svg' },
        { id: uid(), title_en: 'NSS community service', title_ml: 'എൻ.എസ്.എസ് സേവനം', category: 'events', src: 'assets/gallery/nss-01.svg' },
        { id: uid(), title_en: 'Science exhibition', title_ml: 'ശാസ്ത്ര പ്രദർശനം', category: 'events', src: 'assets/gallery/science-01.svg' },
        { id: uid(), title_en: 'Basketball court', title_ml: 'ബാസ്കറ്റ്ബോൾ കോർട്ട്', category: 'sports', src: 'assets/gallery/sports-02.svg' }
      ],
      moderation_reports: null,
      ai_messages: []
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const db = JSON.parse(raw);
        if (db && db.profiles) { if (!Array.isArray(db.ai_messages)) db.ai_messages = []; return db; }
      }
    } catch (e) {}
    return null;
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
    emit();
  }
  function emit() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }

  let db = load();
  if (!db) { db = seed(); save(db); }

  function sessionId() { try { return localStorage.getItem(SESSION_KEY); } catch (e) { return null; } }
  function setSession(id) { try { if (id) localStorage.setItem(SESSION_KEY, id); else localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  const OTP_TTL = 10 * 60 * 1000;
  const OTP_MAX_TRIES = 5;
  const OTP_RESEND_GAP = 60 * 1000;
  const otpCode = () => String(Math.floor(100000 + Math.random() * 900000));
  function pruneOtps() {
    const t = Date.now();
    db.pending_signups = (db.pending_signups || []).filter(p => p.expires_at > t);
  }

  function profileById(id) { return db.profiles.find(p => p.id === id) || null; }
  function requireRole(roles, id) {
    const p = profileById(id || sessionId());
    if (!p) throw new Error('err.session');
    if (p.status !== 'active') throw new Error('auth.disabled');
    if (roles && roles.indexOf(p.role) === -1) throw new Error('err.noperm');
    return p;
  }
  function teacherOf(profileId) { return db.teachers.find(t => t.profile_id === profileId) || null; }


  async function createAccount(rec) {
    const { email, role, full_name, phone, extra } = rec;
    if (db.profiles.some(p => p.email === email)) throw new Error('err.emailTaken');
    const isTeacher = role === 'teacher';
    const isStudent = role === 'student';
    const profile = {
      id: uid(), email, full_name, role, phone: phone || '',
      status: isTeacher ? 'pending' : 'active',
      created_at: now(), password_hash: rec.password_hash, email_verified: true
    };
    db.profiles.push(profile);
    if (isStudent) {
      db.students.push({
        id: uid(), profile_id: profile.id, full_name,
        class: (extra && extra.class) || '', roll_no: (extra && extra.roll_no) || '',
        admission_no: (extra && extra.admission_no) || '', status: 'pending'
      });
    }
    if (isTeacher) {
      db.teachers.push({
        id: uid(), profile_id: profile.id, full_name, employee_no: (extra && extra.employee_no) || '',
        subject: (extra && extra.subject) || '', designation: 'HSA', status: 'pending', classes: []
      });
    }
    if (role === 'parent') {
      db.parents.push({ id: uid(), profile_id: profile.id, full_name, phone: phone || '' });
    }
    save(db);
    return { requiresApproval: isTeacher, verified: true };
  }

  const Backend = {
    mode: 'demo',
    async signUp({ email, password, role, full_name, phone, extra }) {
      email = (email || '').trim().toLowerCase();
      if (!email || !password) throw new Error('err.required');
      if (password.length < 8) throw new Error('err.passwordShort');
      if (db.profiles.some(p => p.email === email)) throw new Error('err.emailTaken');
      pruneOtps();
      db.pending_signups = (db.pending_signups || []).filter(p => p.email !== email);
      const rec = {
        email, role, full_name, phone: phone || '', extra: extra || {},
        password_hash: await hash(password),
        code: otpCode(), tries: 0,
        sent_at: Date.now(), expires_at: Date.now() + OTP_TTL
      };
      db.pending_signups.push(rec);
      save(db);
      return { needsOtp: true, email, devCode: rec.code };
    },

    async verifySignupOtp(email, token) {
      email = (email || '').trim().toLowerCase();
      pruneOtps();
      const rec = (db.pending_signups || []).find(p => p.email === email);
      if (!rec) throw new Error('auth.otpExpired');
      if (rec.tries >= OTP_MAX_TRIES) {
        db.pending_signups = db.pending_signups.filter(p => p !== rec);
        save(db);
        throw new Error('auth.otpLocked');
      }
      if (String(token || '').trim() !== rec.code) {
        rec.tries += 1;
        save(db);
        throw new Error('auth.otpWrong');
      }
      db.pending_signups = db.pending_signups.filter(p => p !== rec);
      return createAccount(rec);
    },

    async resendSignupOtp(email) {
      email = (email || '').trim().toLowerCase();
      pruneOtps();
      const rec = (db.pending_signups || []).find(p => p.email === email);
      if (!rec) throw new Error('auth.otpExpired');
      if (Date.now() - rec.sent_at < OTP_RESEND_GAP) throw new Error('auth.otpWait');
      rec.code = otpCode();
      rec.tries = 0;
      rec.sent_at = Date.now();
      rec.expires_at = Date.now() + OTP_TTL;
      save(db);
      return { devCode: rec.code };
    },

    async signIn(email, password) {
      email = (email || '').trim().toLowerCase();
      const p = db.profiles.find(x => x.email === email);
      if (!p) throw new Error('err.invalidlogin');
      if (!p.password_hash) {
        if (password !== DEMO_PASSWORD) throw new Error('err.invalidlogin');
        p.password_hash = await hash(password);
        save(db);
      }
      const h = await hash(password || '');
      if (p.password_hash !== h) throw new Error('err.invalidlogin');
      if (p.status === 'pending') throw new Error(p.role === 'teacher' ? 'auth.pendingTeacher' : 'auth.pendingStudent');
      if (p.status === 'disabled') throw new Error('auth.disabled');
      setSession(p.id);
      return p;
    },

    /* ---------- PDF notes / resources ---------- */
    async resources(filter) {
      const db = load();
      let rows = (db.resources || []).slice();
      if (filter && filter.class) rows = rows.filter(r => r.class === filter.class);
      if (filter && filter.subject) {
        const q = String(filter.subject).trim().toLowerCase();
        rows = rows.filter(r => r.subject.toLowerCase().indexOf(q) !== -1);
      }
      return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },

    async uploadResource({ file, class: cls, subject, title, description }) {
      const me = requireRole(['teacher', 'admin'], sessionId());
      if (!file) throw new Error('err.required');
      if (!/\.pdf$/i.test(file.name || '') && file.type !== 'application/pdf') throw new Error('res.notpdf');
      if (file.size > 20 * 1024 * 1024) throw new Error('res.toobig');
      const text = String(title || '').trim();
      if (text.length < 2) throw new Error('err.required');
      const data = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result || ''));
        fr.onerror = () => reject(new Error('res.readfail'));
        fr.readAsDataURL(file);
      });
      const db = load();
      db.resources = db.resources || [];
      const row = {
        id: uid(),
        class: String(cls || '').trim(),
        subject: String(subject || '').trim(),
        title: text.slice(0, 120),
        description: String(description || '').slice(0, 500),
        storage_path: 'demo/' + uid() + '-' + file.name,
        file_name: file.name,
        file_size: file.size,
        mime: 'application/pdf',
        uploaded_by: me.id,
        uploader_name: me.full_name,
        is_published: true,
        created_at: now(),
        data: data
      };
      if (!row.class || !row.subject) throw new Error('err.required');
      db.resources.push(row);
      save(db);
      return row;
    },

    async deleteResource(id) {
      const me = requireRole(['teacher', 'admin'], sessionId());
      const db = load();
      db.resources = db.resources || [];
      const i = db.resources.findIndex(r => r.id === id);
      if (i === -1) throw new Error('not_found');
      if (me.role !== 'admin' && db.resources[i].uploaded_by !== me.id) throw new Error('err.noperm');
      db.resources.splice(i, 1);
      save(db);
      return true;
    },

    async resourceUrl(row) {
      if (!row || !row.data) throw new Error('not_found');
      return row.data;
    },

    async signOut() { setSession(null); },

    async session() {
      const id = sessionId();
      if (!id) return null;
      const p = profileById(id);
      if (!p || p.status !== 'active') { setSession(null); return null; }
      let extra = {};
      if (p.role === 'student') {
        const s = db.students.find(x => x.profile_id === p.id);
        extra.student = s || null;
      }
      if (p.role === 'teacher') {
        const t = teacherOf(p.id);
        extra.teacher = t || null;
        extra.classes = t ? t.classes : [];
      }
      if (p.role === 'parent') {
        const links = db.links.filter(l => l.parent_id === (db.parents.find(x => x.profile_id === p.id) || {}).id);
        extra.children = links.map(l => ({ link: l, student: db.students.find(s => s.id === l.student_id) }));
      }
      return { profile: p, ...extra };
    },

    async resetPassword(email) {
      return true;
    },

    async updatePassword(pw) {
      const p = requireRole(null, sessionId());
      if ((pw || '').length < 8) throw new Error('err.passwordShort');
      p.password_hash = await hash(pw);
      save(db);
      return true;
    },

    // ---- notices ----
    async notices({ all } = {}) {
      let list = db.notices.slice();
      if (!all) list = list.filter(n => n.is_published);
      return list.sort((a, b) => (b.is_pinned - a.is_pinned) || (new Date(b.created_at) - new Date(a.created_at)));
    },
    async saveNotice(data, id) {
      requireRole(['teacher', 'admin'], sessionId());
      if (id) {
        const n = db.notices.find(x => x.id === id);
        Object.assign(n, data);
      } else {
        db.notices.push({ id: uid(), created_at: now(), is_published: true, is_pinned: false, ...data });
      }
      save(db); return true;
    },
    async deleteNotice(id) {
      requireRole(['teacher', 'admin'], sessionId());
      db.notices = db.notices.filter(n => n.id !== id);
      save(db); return true;
    },

    // ---- results ----
    async resultsForLookup(className, rollNo) {
      // mirror the SQL rule: only the student, a verified parent, or staff
      const me = requireRole(null, sessionId());
      const student = db.students.find(s => s.class === className && String(s.roll_no) === String(rollNo));
      if (!student) return [];
      let allowed = me.role === 'admin' || student.profile_id === me.id;
      if (me.role === 'teacher') {
        const t = teacherOf(me.id);
        allowed = !!(t && t.classes.indexOf(student.class) !== -1);
      }
      if (me.role === 'parent') {
        const parent = db.parents.find(x => x.profile_id === me.id);
        allowed = !!(parent && db.links.some(l => l.parent_id === parent.id && l.student_id === student.id && l.status === 'approved'));
      }
      if (!allowed) throw new Error('err.noperm');
      return db.results.filter(r => r.class === className && String(r.roll_no) === String(rollNo))
        .sort((a, b) => a.subject.localeCompare(b.subject));
    },
    async resultsForStudent(studentId) {
      return db.results.filter(r => r.student_id === studentId)
        .sort((a, b) => a.subject.localeCompare(b.subject));
    },
    // ---- AI study buddy ----
    async aiProfile() {
      const me = requireRole(['student'], sessionId());
      const s = db.students.find(x => x.profile_id === me.id);
      if (!s) throw new Error('err.noperm');
      return { nickname: s.ai_nickname || '', name: me.full_name || '' };
    },

    async setAiNickname(name) {
      const me = requireRole(['student'], sessionId());
      const s = db.students.find(x => x.profile_id === me.id);
      if (!s) throw new Error('err.noperm');
      const v = String(name || '').trim();
      if (v.length < 2) throw new Error('nickname_short');
      if (v.length > 24) throw new Error('nickname_long');
      if (/[<>{}\[\]|\\/@#$%^&*+=~`]/.test(v)) throw new Error('nickname_chars');
      s.ai_nickname = v;
      save(db);
      return v;
    },

    async aiHistory() {
      const me = requireRole(['student'], sessionId());
      const s = db.students.find(x => x.profile_id === me.id);
      if (!s) return [];
      return db.ai_messages.filter(m => m.student_id === s.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 40).reverse();
    },

    async aiSave(role, content) {
      const me = requireRole(['student'], sessionId());
      const s = db.students.find(x => x.profile_id === me.id);
      if (!s) throw new Error('err.noperm');
      const text = String(content || '').trim();
      if (!text) throw new Error('err.required');
      const row = { id: uid(), student_id: s.id, role, content: text.slice(0, 2000), created_at: new Date().toISOString() };
      db.ai_messages.push(row);
      save(db);
      return row;
    },

    async publishResults(rows) {
      const me = requireRole(['teacher', 'admin'], sessionId());
      rows.forEach(r => {
        if (!r.class || !r.roll_no || !r.subject) throw new Error('err.required');
        const student = db.students.find(s => s.class === r.class && String(s.roll_no) === String(r.roll_no));
        db.results.push({
          id: uid(), student_id: student ? student.id : null, class: r.class, roll_no: String(r.roll_no),
          exam: r.exam, subject: r.subject, marks: r.marks, max_marks: r.max_marks || 100,
          grade: r.grade || gradeFor(r.marks, r.max_marks || 100),
          published_at: now(), published_by: me.full_name
        });
      });
      save(db); return true;
    },
    async deleteResult(id) {
      requireRole(['teacher', 'admin'], sessionId());
      db.results = db.results.filter(r => r.id !== id);
      save(db); return true;
    },

    // ---- chat ----
    async rooms() {
      const p = requireRole(['student', 'teacher', 'admin'], sessionId());
      if (p.role === 'admin') return db.classes.map(c => ({ id: c.id, name: c.name }));
      if (p.role === 'teacher') {
        const t = teacherOf(p.id);
        return db.classes.filter(c => t && t.classes.indexOf(c.id) !== -1).map(c => ({ id: c.id, name: c.name }));
      }
      const s = db.students.find(x => x.profile_id === p.id);
      return s ? db.classes.filter(c => c.id === s.class).map(c => ({ id: c.id, name: c.name })) : [];
    },
    async messages(room) {
      requireRole(['student', 'teacher', 'admin'], sessionId());
      return db.chat.filter(m => m.room === room)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    },
    async sendMessage(room, body) {
      const p = requireRole(['student', 'teacher', 'admin'], sessionId());
      body = (body || '').trim();
      if (!body) throw new Error('err.required');
      if (body.length > 500) body = body.slice(0, 500);
      db.chat.push({
        id: uid(), room, sender_id: p.id, sender_name: p.full_name,
        sender_role: p.role, body, hidden: false, created_at: now()
      });
      save(db); return true;
    },
    async hideMessage(id, hidden) {
      const p = requireRole(['teacher', 'admin'], sessionId());
      const m = db.chat.find(x => x.id === id);
      if (!m) return false;
      m.hidden = hidden;
      db.modlog.push({ id: uid(), actor: p.full_name, action: hidden ? 'hide_message' : 'restore_message', target: id, details: 'Room ' + m.room + ': ' + m.body.slice(0, 60), created_at: now() });
      db.reports.filter(r => r.message_id === id).forEach(r => { r.status = 'resolved'; r.reviewed_by = p.full_name; r.reviewed_at = now(); });
      save(db); return true;
    },
    async reportMessage(id, reason) {
      const p = requireRole(['student', 'teacher', 'admin'], sessionId());
      const m = db.chat.find(x => x.id === id);
      if (!m) return false;
      if (db.reports.some(r => r.message_id === id && r.reported_by === p.id && r.status === 'open')) return true;
      db.reports.push({
        id: uid(), message_id: id, room: m.room, reported_by: p.id, reporter_name: p.full_name,
        reason: reason || 'Reported by user', status: 'open', created_at: now()
      });
      save(db); return true;
    },
    async reports() {
      requireRole(['teacher', 'admin'], sessionId());
      return db.reports.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(r => {
        const m = db.chat.find(x => x.id === r.message_id);
        return { ...r, message: m || null };
      });
    },
    async resolveReport(id, status, hide) {
      const p = requireRole(['teacher', 'admin'], sessionId());
      const r = db.reports.find(x => x.id === id);
      if (!r) throw new Error('err.notfound');
      r.status = status === 'dismissed' ? 'dismissed' : 'resolved';
      r.reviewed_by = p.full_name;
      r.reviewed_at = now();
      if (hide) {
        const m = db.chat.find(x => x.id === r.message_id);
        if (m) m.hidden = true;
      }
      db.modlog.push({ id: uid(), actor: p.full_name, action: 'resolve_report', target: id, details: r.status + (hide ? ' + hidden' : ''), created_at: now() });
      save(db); return true;
    },
    async moderationLog() {
      requireRole(['teacher', 'admin'], sessionId());
      return db.modlog.slice().reverse();
    },
    subscribe(room, cb) {
      if (typeof room === 'function') { cb = room; }
      const fn = () => cb();
      listeners.add(fn);
      const timer = setInterval(cb, 2500);
      return () => { listeners.delete(fn); clearInterval(timer); };
    },

    // ---- admin ----
    async pendingTeachers() {
      requireRole(['admin'], sessionId());
      return db.teachers.filter(t => t.status === 'pending').map(t => {
        const p = profileById(t.profile_id) || {};
        return { ...t, email: p.email, phone: p.phone, created_at: p.created_at };
      });
    },
    async allTeachers() {
      requireRole(['admin'], sessionId());
      return db.teachers.map(t => {
        const p = profileById(t.profile_id) || {};
        return { ...t, email: p.email, phone: p.phone, account_status: p.status };
      });
    },
    async decideTeacher(teacherId, approve) {
      const me = requireRole(['admin'], sessionId());
      const t = db.teachers.find(x => x.id === teacherId);
      if (!t) return false;
      t.status = approve ? 'approved' : 'rejected';
      const p = profileById(t.profile_id);
      if (p) p.status = approve ? 'active' : 'disabled';
      db.modlog.push({ id: uid(), actor: me.full_name, action: approve ? 'approve_teacher' : 'reject_teacher', target: t.full_name, details: t.subject || '', created_at: now() });
      save(db); return true;
    },
    async students() {
      requireRole(['teacher', 'admin'], sessionId());
      return db.students.map(s => {
        const p = profileById(s.profile_id) || {};
        return { ...s, email: p.email, account_status: p.status };
      });
    },
    async parentRequests() {
      requireRole(['admin'], sessionId());
      return db.links.map(l => {
        const pp = db.parents.find(x => x.id === l.parent_id) || {};
        const prof = profileById(pp.profile_id) || {};
        const st = db.students.find(s => s.id === l.student_id) || {};
        return {
          ...l, parent_name: pp.full_name, parent_email: prof.email, parent_phone: pp.phone,
          student_name: st.full_name, student_class: st.class, student_roll: st.roll_no
        };
      });
    },
    async linkChild({ student_id, relationship }) {
      const p = requireRole(['parent'], sessionId());
      const parent = db.parents.find(x => x.profile_id === p.id);
      if (!parent) throw new Error('err.generic');
      if (db.links.some(l => l.parent_id === parent.id && l.student_id === student_id)) throw new Error('Already requested.');
      db.links.push({ id: uid(), parent_id: parent.id, student_id, relationship, status: 'pending', created_at: now() });
      save(db); return true;
    },
    async findStudentForLink(className, rollNo) {
      const s = db.students.find(x => x.class === className && String(x.roll_no) === String(rollNo));
      return s || null;
    },
    async decideParentLink(linkId, approve) {
      const me = requireRole(['admin'], sessionId());
      const l = db.links.find(x => x.id === linkId);
      if (!l) return false;
      l.status = approve ? 'approved' : 'rejected';
      l.verified_by = me.full_name; l.verified_at = now();
      db.modlog.push({ id: uid(), actor: me.full_name, action: approve ? 'approve_parent_link' : 'reject_parent_link', target: linkId, details: l.relationship, created_at: now() });
      save(db); return true;
    },
    async setAccountStatus(profileId, status) {
      requireRole(['admin'], sessionId());
      const p = profileById(profileId);
      if (!p) return false;
      p.status = status;
      save(db); return true;
    },
    async classes() {
      requireRole(['teacher', 'admin'], sessionId());
      return db.classes;
    },
    async assignTeacher(classId, teacherId, add) {
      requireRole(['admin'], sessionId());
      const c = db.classes.find(x => x.id === classId);
      const t = db.teachers.find(x => x.id === teacherId);
      if (!c || !t) return false;
      if (add) {
        if (c.teacher_ids.indexOf(teacherId) === -1) c.teacher_ids.push(teacherId);
        if (t.classes.indexOf(classId) === -1) t.classes.push(classId);
      } else {
        c.teacher_ids = c.teacher_ids.filter(x => x !== teacherId);
        t.classes = t.classes.filter(x => x !== classId);
      }
      save(db); return true;
    },
    async addClass(name) {
      requireRole(['admin'], sessionId());
      const id = name.trim();
      if (!id) throw new Error('err.required');
      if (db.classes.some(c => c.id.toLowerCase() === id.toLowerCase())) throw new Error('Class already exists.');
      db.classes.push({ id, name: 'Class ' + id, teacher_ids: [] });
      save(db); return true;
    },

    // ---- content ----
    async achievements() { return db.achievements.slice().sort((a, b) => new Date(b.event_date) - new Date(a.event_date)); },
    async gallery() { return db.gallery.slice(); },
    async addGalleryItem(data) {
      requireRole(['teacher', 'admin'], sessionId());
      db.gallery.unshift({ id: uid(), ...data });
      save(db); return true;
    },
    async addAchievement(data) {
      requireRole(['teacher', 'admin'], sessionId());
      db.achievements.unshift({ id: uid(), event_date: now(), icon: '🏆', ...data });
      save(db); return true;
    },
    async submitEnquiry(data) {
      if (!data || String(data.student_name || '').trim().length < 2) throw new Error('err.required');
      if (!/^[0-9]{10}$/.test(String(data.phone || ''))) throw new Error('err.phone');
      db.enquiries = db.enquiries || [];
      db.enquiries.push({ id: uid(), status: 'new', created_at: now(), ...data });
      save(db); return true;
    },
    async enquiries() {
      requireRole(['admin'], sessionId());
      return (db.enquiries || []).slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    async teachersPublic() {
      return db.teachers.filter(t => t.status === 'approved').map(t => ({
        full_name: t.full_name, subject: t.subject, designation: t.designation, classes: t.classes
      }));
    }
  };

  function gradeFor(marks, max) {
    const pct = (marks / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'E';
  }

  window.DemoBackend = Backend;
  window.gradeFor = window.gradeFor || gradeFor;
})();
