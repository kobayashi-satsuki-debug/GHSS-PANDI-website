/* =========================================================
   SUPABASE BACKEND — real accounts, database and RLS.
   All privileged operations go through SECURITY DEFINER RPCs
   defined in supabase/*.sql; the browser never holds a
   service-role key and never decides a role by itself.
   ========================================================= */
(function () {
  let sb = null;
  let cachedProfile = null;

  function client() {
    if (!sb) sb = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return sb;
  }

  function row(d) { return d; }

  async function profile(session) {
    const s = session || (await client().auth.getSession()).data.session;
    if (!s) { cachedProfile = null; return null; }
    const { data, error } = await client().rpc('get_my_profile');
    if (error) throw error;
    cachedProfile = data && data.profile ? data : null;
    return cachedProfile;
  }

  // Only hand Supabase a redirect that its allow-list can match: the school
  // domain or a local preview host. Anything else makes sign-up fail with
  // "Invalid redirect URL" before the confirmation email is ever sent.
  function redirectUrl(path) {
    try {
      if (location.protocol !== 'http:' && location.protocol !== 'https:') return null;
      const host = location.hostname;
      const domain = (window.SCHOOL_CONFIG && window.SCHOOL_CONFIG.domain) || '';
      // github.io covers the Pages preview, which lives in a subfolder
      const allowed = host === 'localhost' || host === '127.0.0.1' ||
        host === 'kobayashi-satsuki-debug.github.io' || host.endsWith('.github.io') ||
        (domain && (host === domain || host.endsWith('.' + domain)));
      if (!allowed) return null;
      return location.origin + location.pathname.replace(/[^/]*$/, '') + path;
    } catch (e) { return null; }
  }

  function fail(error) {
    const msg = (error && (error.message || error.error_description)) || 'err.generic';
    const e = new Error(msg);
    e.code = error && error.code;
    throw e;
  }

  function mapErr(key, error) {
    const e = new Error(key);
    e.code = error && error.code;
    e.raw = (error && error.message) || '';
    return e;
  }

  const Backend = {
    mode: 'supabase',

    async signUp({ email, password, role, full_name, phone, extra }) {
      const clean = (email || '').trim().toLowerCase();
      const e164 = window.OTP_CONFIG ? window.OTP_CONFIG.toE164(phone) : '';
      const bySms = !!(window.OTP_CONFIG && window.OTP_CONFIG.usesSms());
      const meta = { full_name, role, phone: phone || '', email: clean, extra: extra || {} };
      const options = { data: meta };
      const back = redirectUrl('login.html?confirmed=1');
      if (back) options.emailRedirectTo = back;
      const credentials = bySms
        ? { phone: e164, password, options }
        : { email: clean, password, options };
      const { data, error } = await client().auth.signUp(credentials);
      if (error) {
        const m = error.message || '';
        if (/redirect/i.test(m)) throw mapErr('err.redirect', error);
        if (/error sending|confirmation email|smtp/i.test(m)) throw mapErr('err.mailFailed', error);
        if (/phone.*(disabled|not enabled|provider)|sms.*(disabled|not enabled)/i.test(m)) throw mapErr('err.smsNotEnabled', error);
        if (/could not be sent|failed to send/i.test(m)) throw mapErr('err.smsFailed', error);
        if (/already registered|already exists|user already/i.test(m)) throw mapErr('auth.alreadyRegistered', error);
        if (/disabled/i.test(m) && /signup|sign up/i.test(m)) throw mapErr('err.signupDisabled', error);
        fail(error);
      }
      // With email confirmation on, Supabase answers an existing address with a
      // stub user that has no identities. No code is sent, so say so instead of
      // dropping the person on a code screen that can never succeed.
      if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw mapErr('auth.alreadyRegistered', {});
      }
      return {
        requiresApproval: role === 'teacher',
        needsOtp: !data.session,
        verified: !!data.session,
        channel: bySms ? 'sms' : 'email',
        identity: bySms ? e164 : clean,
        email: clean,
        phone: bySms ? e164 : ''
      };
    },

    async verifySignupOtp(identifier, token) {
      const raw = String(identifier || '').trim();
      const byEmail = raw.includes('@');
      const { data, error } = await client().auth.verifyOtp({
        ...(byEmail
          ? { email: raw.toLowerCase(), type: 'signup' }
          : { phone: window.OTP_CONFIG.toE164(raw), type: 'sms' }),
        token: String(token || '').trim()
      });
      if (error) {
        const m = (error.message || '');
        const c = String(error.code || '');
        if (c === 'otp_expired' || /expired/i.test(m)) throw mapErr('auth.otpExpired', error);
        if (c === 'otp_disabled') throw mapErr('err.signupDisabled', error);
        if (/invalid|incorrect/i.test(m)) throw mapErr('auth.otpWrong', error);
        if (/rate|too many/i.test(m)) throw mapErr('auth.otpWait', error);
        fail(error);
      }
      if (data && data.user) {
        const meta = data.user.user_metadata || {};
        localStorage.setItem('ghss_last_signup_role', meta.role || 'student');
      }
      return { verified: true, requiresApproval: (localStorage.getItem('ghss_last_signup_role') === 'teacher') };
    },

    async resendSignupOtp(identifier) {
      const raw = String(identifier || '').trim();
      const byEmail = raw.includes('@');
      const { error } = await client().auth.resend(byEmail
        ? { type: 'signup', email: raw.toLowerCase() }
        : { type: 'sms', phone: window.OTP_CONFIG.toE164(raw) });
      if (error) {
        if (/rate|too many|seconds/i.test(error.message || '')) throw new Error('auth.otpWait');
        fail(error);
      }
      return { sent: true };
    },

    async signIn(identifier, password) {
      const raw = String(identifier || '').trim();
      const byEmail = raw.includes('@');
      const { error } = await client().auth.signInWithPassword(byEmail
        ? { email: raw.toLowerCase(), password }
        : { phone: window.OTP_CONFIG.toE164(raw), password });
      if (error) {
        if (/email not confirmed|phone not confirmed/i.test(error.message || '')) throw mapErr('auth.notConfirmed', error);
        const e = new Error('err.invalidlogin');
        e.detail = error.message;
        throw e;
      }
      const p = await profile();
      if (!p) throw new Error('err.session');
      if (p.profile.status === 'pending') {
        await client().auth.signOut();
        cachedProfile = null;
        throw new Error(p.profile.role === 'teacher' ? 'auth.pendingTeacher' : 'auth.pendingStudent');
      }
      if (p.profile.status === 'disabled') {
        await client().auth.signOut();
        cachedProfile = null;
        throw new Error('auth.disabled');
      }
      return p;
    },

    /* ---------- PDF notes / resources ---------- */
    async resources(filter) {
      let q = client().from('resources').select('*').order('created_at', { ascending: false });
      if (filter && filter.class) q = q.eq('class', filter.class);
      if (filter && filter.subject) q = q.ilike('subject', '%' + String(filter.subject).trim() + '%');
      const { data, error } = await q;
      if (error) fail(error);
      return data || [];
    },

    async uploadResource({ file, class: cls, subject, title, description }) {
      const safe = String(file.name || 'notes.pdf').replace(/[^A-Za-z0-9._-]/g, '_').slice(-80);
      const folder = String(cls || 'general').replace(/\s+/g, '-').toLowerCase();
      const path = folder + '/' + Date.now() + '-' + safe;
      const up = await client().storage.from('resources')
        .upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (up.error) fail(up.error);
      const { data, error } = await client().from('resources').insert({
        class: cls, subject: subject, title: title,
        description: description || '',
        storage_path: path, file_name: file.name, file_size: file.size, mime: 'application/pdf'
      }).select().single();
      if (error) {
        await client().storage.from('resources').remove([path]);
        fail(error);
      }
      return data;
    },

    async deleteResource(id) {
      const { data, error } = await client().from('resources').select('storage_path').eq('id', id).single();
      if (error) fail(error);
      const del = await client().from('resources').delete().eq('id', id);
      if (del.error) fail(del.error);
      if (data && data.storage_path) await client().storage.from('resources').remove([data.storage_path]);
      return true;
    },

    /* short-lived signed link: the bucket itself stays private */
    async resourceUrl(row) {
      const { data, error } = await client().storage.from('resources')
        .createSignedUrl(row.storage_path, 600);
      if (error) fail(error);
      return data.signedUrl;
    },

    async signOut() {
      await client().auth.signOut();
      cachedProfile = null;
    },

    async session() {
      const { data } = await client().auth.getSession();
      if (!data.session) return null;
      try {
        const p = await profile(data.session);
        if (!p) return null;
        if (p.profile.status !== 'active') return null;
        return p;
      } catch (e) {
        return null;
      }
    },

    /* Password recovery by emailed code, no link. The email template must
       send {{ .Token }} (see docs/EMAIL-TEMPLATES.md). */
    async requestResetOtp(email) {
      const { error } = await client().auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) fail(error);
      return true;
    },

    async verifyResetOtp(email, token) {
      const { error } = await client().auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: String(token || '').trim(),
        type: 'recovery'
      });
      if (error) {
        const m = error.message || '';
        if (/expired/i.test(m)) throw new Error('auth.otpExpired');
        if (/invalid|incorrect|token/i.test(m)) throw new Error('auth.otpWrong');
        if (/rate|too many/i.test(m)) throw new Error('auth.otpWait');
        fail(error);
      }
      return true;
    },

    async updatePassword(pw) {
      if (!pw || pw.length < 8) throw new Error('err.passwordShort');
      const { error } = await client().auth.updateUser({ password: pw });
      if (error) fail(error);
      return true;
    },

    async onAuthChange(cb) {
      return client().auth.onAuthStateChange(function (event, session) {
        if (event === 'PASSWORD_RECOVERY') { cb('recovery', session); return; }
        cb(event, session);
      });
    },

    // ---- notices ----
    async notices({ all } = {}) {
      let q = client().from('notices').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      if (!all) q = q.eq('is_published', true);
      const { data, error } = await q;
      if (error) fail(error);
      return (data || []).map(n => ({ ...n, author: n.author_name }));
    },
    async saveNotice(data, id) {
      const payload = {
        title_en: data.title_en, title_ml: data.title_ml, body_en: data.body_en, body_ml: data.body_ml,
        category: data.category, is_published: data.is_published, is_pinned: data.is_pinned
      };
      const res = id
        ? await client().from('notices').update(payload).eq('id', id)
        : await client().from('notices').insert(payload);
      if (res.error) fail(res.error);
      return true;
    },
    async deleteNotice(id) {
      const { error } = await client().from('notices').delete().eq('id', id);
      if (error) fail(error);
      return true;
    },

    // ---- results ----
    async resultsForLookup(className, rollNo) {
      const { data, error } = await client().rpc('get_results_by_roll', { p_class: className, p_roll: String(rollNo) });
      if (error) fail(error);
      return (data || []).map(r => ({ ...r, exam: r.exam_name }));
    },
    async resultsForStudent(studentId) {
      const { data, error } = await client().from('results').select('*').eq('student_id', studentId)
        .order('exam_name').order('subject');
      if (error) fail(error);
      return (data || []).map(r => ({ ...r, exam: r.exam_name }));
    },
    // ---- AI study buddy ----
    async aiProfile() {
      const me = await profile();
      if (!me || !me.student) throw new Error('err.noperm');
      return { nickname: me.student.ai_nickname || '', name: (me.profile && me.profile.full_name) || '' };
    },

    async setAiNickname(name) {
      const { data, error } = await client().rpc('set_ai_nickname', { p_name: name });
      if (error) fail(error);
      if (cachedProfile && cachedProfile.student) cachedProfile.student.ai_nickname = data;
      return data;
    },

    async aiHistory() {
      const { data, error } = await client().rpc('ai_history', { p_limit: 40 });
      if (error) fail(error);
      return (data || []).slice().reverse();
    },

    async aiSave(role, content) {
      const { data, error } = await client().rpc('log_ai_message', { p_role: role, p_content: content });
      if (error) fail(error);
      return { id: data, role: role, content: content, created_at: new Date().toISOString() };
    },

    async publishResults(rows) {
      const { error } = await client().rpc('publish_results', { p_rows: rows });
      if (error) fail(error);
      return true;
    },
    async deleteResult(id) {
      const { error } = await client().from('results').delete().eq('id', id);
      if (error) fail(error);
      return true;
    },

    // ---- chat ----
    async rooms() {
      const { data, error } = await client().from('class_rooms').select('id, name');
      if (error) fail(error);
      return data || [];
    },
    async messages(room) {
      const { data, error } = await client().from('chat_messages').select('*')
        .eq('room', room).order('created_at', { ascending: true }).limit(300);
      if (error) fail(error);
      return data || [];
    },
    async sendMessage(room, body) {
      const me = cachedProfile;
      const { error } = await client().from('chat_messages').insert({
        room, body: body.trim().slice(0, 500)
      });
      if (error) fail(error);
      return true;
    },
    async hideMessage(id, hidden) {
      const { error } = await client().rpc('hide_message', { p_message: id, p_hidden: !!hidden });
      if (error) fail(error);
      return true;
    },
    async reportMessage(id, reason) {
      const { error } = await client().from('chat_reports').insert({ message_id: id, reason: reason || 'Reported by user' });
      if (error) fail(error);
      return true;
    },
    async reports() {
      const { data, error } = await client().from('chat_reports')
        .select('*, chat_messages(body, room, sender_name, sender_role, created_at, hidden)')
        .order('created_at', { ascending: false });
      if (error) fail(error);
      return (data || []).map(r => ({ ...r, message: r.chat_messages ? { ...r.chat_messages, body: r.chat_messages.body } : null }));
    },
    async resolveReport(id, status, hide) {
      const { error } = await client().rpc('resolve_report', {
        p_report: id,
        p_status: status === 'dismissed' ? 'dismissed' : 'resolved',
        p_hide: !!hide
      });
      if (error) fail(error);
      return true;
    },
    async moderationLog() {
      const { data, error } = await client().from('moderation_log').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) fail(error);
      return data || [];
    },
    subscribe(room, cb) {
      const ch = client().channel('room:' + room)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: 'room=eq.' + room }, cb)
        .subscribe();
      return () => { client().removeChannel(ch); };
    },

    // ---- admin ----
    async pendingTeachers() {
      const { data, error } = await client().from('teachers')
        .select('*, profiles!inner(email, phone, created_at, status)')
        .eq('status', 'pending').order('created_at', { ascending: false });
      if (error) fail(error);
      return (data || []).map(t => ({ ...t, email: t.profiles.email, phone: t.profiles.phone, created_at: t.profiles.created_at }));
    },
    async allTeachers() {
      const { data, error } = await client().from('teachers')
        .select('*, profiles!inner(email, phone, status)');
      if (error) fail(error);
      return (data || []).map(t => ({ ...t, email: t.profiles.email, phone: t.profiles.phone, account_status: t.profiles.status }));
    },
    async decideTeacher(id, approve) {
      const { error } = await client().rpc('decide_teacher', { p_teacher: id, p_approve: !!approve });
      if (error) fail(error);
      return true;
    },
    async students() {
      const { data, error } = await client().from('students')
        .select('*, profiles!inner(email, status)').order('class').order('roll_no');
      if (error) fail(error);
      return (data || []).map(s => ({ ...s, email: s.profiles.email, account_status: s.profiles.status }));
    },
    async parentRequests() {
      const { data, error } = await client().from('parent_student_links')
        .select('*, parents(full_name, phone, profiles!inner(email)), students(full_name, class, roll_no)')
        .order('created_at', { ascending: false });
      if (error) fail(error);
      return (data || []).map(l => ({
        ...l,
        parent_name: l.parents ? l.parents.full_name : '',
        parent_email: l.parents && l.parents.profiles ? l.parents.profiles.email : '',
        parent_phone: l.parents ? l.parents.phone : '',
        student_name: l.students ? l.students.full_name : '',
        student_class: l.students ? l.students.class : '',
        student_roll: l.students ? l.students.roll_no : ''
      }));
    },
    async linkChild({ student_id, relationship }) {
      const { error } = await client().rpc('link_child', { p_student: student_id, p_relationship: relationship });
      if (error) fail(error);
      return true;
    },
    async findStudentForLink(className, rollNo) {
      const { data, error } = await client().rpc('find_student_for_link', { p_class: className, p_roll: String(rollNo) });
      if (error) fail(error);
      return (data && data[0]) || null;
    },
    async decideParentLink(id, approve) {
      const { error } = await client().rpc('decide_parent_link', { p_link: id, p_approve: !!approve });
      if (error) fail(error);
      return true;
    },
    async setAccountStatus(profileId, status) {
      const { error } = await client().rpc('set_account_status', { p_profile: profileId, p_status: status });
      if (error) fail(error);
      return true;
    },
    async classes() {
      const { data, error } = await client().from('class_rooms').select('*, class_teachers(teacher_id)').order('id');
      if (error) fail(error);
      return (data || []).map(c => ({ id: c.id, name: c.name, teacher_ids: (c.class_teachers || []).map(t => t.teacher_id) }));
    },
    async assignTeacher(classId, teacherId, add) {
      const { error } = await client().rpc('assign_teacher', { p_class: classId, p_teacher: teacherId, p_add: !!add });
      if (error) fail(error);
      return true;
    },
    async addClass(name) {
      const { error } = await client().rpc('add_class', { p_name: name });
      if (error) fail(error);
      return true;
    },

    // ---- content ----
    async achievements() {
      const { data, error } = await client().from('achievements').select('*').order('event_date', { ascending: false });
      if (error) fail(error);
      return data || [];
    },
    async gallery() {
      const { data, error } = await client().from('gallery_items').select('*').order('created_at', { ascending: false });
      if (error) fail(error);
      return data || [];
    },
    async addGalleryItem(data) {
      const { error } = await client().from('gallery_items').insert(data);
      if (error) fail(error);
      return true;
    },
    async addAchievement(data) {
      const { error } = await client().from('achievements').insert(data);
      if (error) fail(error);
      return true;
    },
    async teachersPublic() {
      const { data, error } = await client().rpc('get_public_teachers');
      if (error) fail(error);
      return data || [];
    },
    async submitEnquiry(data) {
      const { error } = await client().rpc('submit_admission_enquiry', { p_data: data });
      if (error) fail(error);
      return true;
    },
    async enquiries() {
      const { data, error } = await client().from('admission_enquiries')
        .select('*').order('created_at', { ascending: false });
      if (error) fail(error);
      return data || [];
    }
  };

  window.SupabaseBackend = Backend;
})();
