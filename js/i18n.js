/* =========================================================
   i18n — English / Malayalam / Kannada
   Static markup uses data-en / data-ml (or data-en-html /
   data-ml-html, data-en-ph / data-ml-ph for placeholders).
   Dynamic strings use I18NS.t('key').
   ========================================================= */
(function () {
  const DICT = {
    // ---- nav & common ----
    'nav.home': ['Home', 'ഹോം'],
    'nav.about': ['About', 'സ്കൂളിനെക്കുറിച്ച്'],
    'nav.admissions': ['Admissions', 'പ്രവേശനം'],
    'nav.academics': ['Academics', 'പഠനം'],
    'nav.gallery': ['Gallery', 'ചിത്രശാല'],
    'nav.achievements': ['Achievements', 'നേട്ടങ്ങൾ'],
    'nav.faculty': ['Faculty', 'അധ്യാപകർ'],
    'nav.notices': ['Notices', 'അറിയിപ്പുകൾ'],
    'nav.resources': ['Resources', 'പഠന സാമഗ്രികൾ'],
    'nav.results': ['Results', 'ഫലങ്ങൾ'],
    'nav.login': ['Login', 'ലോഗിൻ'],
    'nav.dashboard': ['Dashboard', 'ഡാഷ്ബോർഡ്'],
    'nav.logout': ['Log out', 'ലോഗ് ഔട്ട്'],
    'nav.register': ['Register', 'രജിസ്റ്റർ'],

    'lang.en': ['English', 'English'],
    'lang.ml': ['മലയാളം', 'മലയാളം'],

    // ---- auth ----
    'auth.student': ['Student', 'വിദ്യാർത്ഥി'],
    'auth.teacher': ['Teacher', 'അധ്യാപകൻ'],
    'auth.parent': ['Parent', 'രക്ഷിതാവ്'],
    'auth.login.title': ['Sign in to your account', 'നിങ്ങളുടെ അക്കൗണ്ടിൽ പ്രവേശിക്കുക'],
    'auth.login.sub': ['Students, teachers and parents sign in here.', 'വിദ്യാർത്ഥികൾ, അധ്യാപകർ, രക്ഷിതാക്കൾ ഇവിടെ പ്രവേശിക്കുക.'],
    'auth.email': ['Email address', 'ഇമെയിൽ വിലാസം'],
    'auth.password': ['Password', 'പാസ്‌വേഡ്'],
    'auth.signin': ['Sign in', 'പ്രവേശിക്കുക'],
    'auth.forgot': ['Forgot password?', 'പാസ്‌വേഡ് മറന്നോ?'],
    'auth.noaccount': ['New here? Create an account', 'പുതിയ ഉപയോക്താവാണോ? അക്കൗണ്ട് ഉണ്ടാക്കുക'],
    'auth.signedin': ['Signed in successfully', 'വിജയകരമായി പ്രവേശിച്ചു'],
    'auth.loggedout': ['You have been signed out.', 'നിങ്ങൾ പുറത്തുപോയി.'],
    'auth.pendingTeacher': ['Your teacher account is awaiting approval by the school administrator. You can sign in after approval.', 'നിങ്ങളുടെ അധ്യാപക അക്കൗണ്ട് സ്കൂൾ അഡ്മിനിസ്ട്രേറ്ററുടെ അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു. അംഗീകാരത്തിന് ശേഷം പ്രവേശിക്കാം.'],
    'auth.pendingStudent': ['Your student account is awaiting verification by the school.', 'നിങ്ങളുടെ വിദ്യാർത്ഥി അക്കൗണ്ട് സ്കൂളിന്റെ പരിശോധനയ്ക്കായി കാത്തിരിക്കുന്നു.'],
    'auth.disabled': ['This account has been disabled. Please contact the school office.', 'ഈ അക്കൗണ്ട് പ്രവർത്തനരഹിതമാക്കിയിരിക്കുന്നു. സ്കൂൾ ഓഫീസുമായി ബന്ധപ്പെടുക.'],
    'auth.noAccount': ['No account uses this email address. Ask the office to add you, or register first.', 'ഈ ഇമെയിലിൽ അക്കൗണ്ട് ഇല്ല. ഓഫീസിനെ അറിയിക്കുക അല്ലെങ്കിൽ ആദ്യം രജിസ്റ്റർ ചെയ്യുക.'],
    'auth.otpWrong': ['That code is not correct. Check the email and try again.', 'ആ കോഡ് ശരിയല്ല. ഇമെയിൽ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.'],
    'auth.otpExpired': ['That code has expired or was already used. Press Resend code.', 'കോഡിന്റെ സമയം കഴിഞ്ഞു അല്ലെങ്കിൽ ഇതിനകം ഉപയോഗിച്ചു. "കോഡ് വീണ്ടും അയയ്ക്കുക" അമർത്തുക.'],
    'auth.otpLocked': ['Too many wrong attempts. Please register again.', 'വളരെയധികം തെറ്റായ ശ്രമങ്ങൾ. വീണ്ടും രജിസ്റ്റർ ചെയ്യുക.'],
    'auth.otpWait': ['Please wait a minute before asking for another email.', 'അടുത്ത ഇമെയിൽ ആവശ്യപ്പെടുന്നതിന് മുമ്പ് ഒരു മിനിറ്റ് കാത്തിരിക്കുക.'],
    'auth.notConfirmed': ['This address is not confirmed yet. Open the message from GHSS Pandi and click the confirmation link, then sign in again. Nothing in your inbox? Check Spam, or open the Register page, enter the same email and send the message again.', 'ഈ ഇമെയിൽ ഇതുവരെ സ്ഥിരീകരിച്ചിട്ടില്ല. GHSS Pandi യിൽ നിന്നുള്ള മെയിൽ തുറന്ന് സ്ഥിരീകരണ ലിങ്ക് ക്ലിക്ക് ചെയ്ത ശേഷം വീണ്ടും പ്രവേശിക്കുക. Inbox-ൽ ഇല്ലെങ്കിൽ Spam പരിശോധിക്കുക, അല്ലെങ്കിൽ രജിസ്റ്റർ പേജിൽ അതേ ഇമെയിൽ നൽകി വീണ്ടും അയയ്ക്കുക.'],
    'auth.alreadyRegistered': ['This email already has an account. Sign in instead, or use Forgot password if you do not remember it.', 'ഈ ഇമെയിലിന് അക്കൗണ്ട് ഉണ്ട്. പ്രവേശിക്കുക, അല്ലെങ്കിൽ പാസ്‌വേഡ് മറന്നെങ്കിൽ "പാസ്‌വേഡ് മറന്നോ?" ഉപയോഗിക്കുക.'],
    'auth.linkExpired': ['That confirmation link has expired or was already used. Sign in with your password, or register again to get a fresh code.', 'സ്ഥിരീകരണ ലിങ്കിന്റെ സമയം കഴിഞ്ഞു അല്ലെങ്കിൽ ഇതിനകം ഉപയോഗിച്ചു. പാസ്‌വേഡ് ഉപയോഗിച്ച് പ്രവേശിക്കുക, അല്ലെങ്കിൽ പുതിയ കോഡിനായി വീണ്ടും രജിസ്റ്റർ ചെയ്യുക.'],
    'auth.confirmed': ['Your email address is confirmed. Sign in to continue.', 'നിങ്ങളുടെ ഇമെയിൽ സ്ഥിരീകരിച്ചു. തുടരാൻ പ്രവേശിക്കുക.'],
    'err.redirect': ['The address this site is opened from is not allowed for sign-up. Use the school website address, or ask the office to add this address in Supabase.', 'ഈ സൈറ്റ് തുറന്നിരിക്കുന്ന വിലാസം രജിസ്ട്രേഷന് അനുവദിച്ചിട്ടില്ല. സ്കൂൾ വെബ്സൈറ്റ് വിലാസം ഉപയോഗിക്കുക.'],
    'err.signupDisabled': ['New sign-ups are turned off for this project. Please contact the school office.', 'ഈ പ്രോജക്ടിൽ പുതിയ രജിസ്ട്രേഷൻ ഓഫ് ചെയ്തിരിക്കുന്നു. സ്കൂൾ ഓഫീസുമായി ബന്ധപ്പെടുക.'],

    // ---- register ----
    'reg.title': ['Create an account', 'അക്കൗണ്ട് ഉണ്ടാക്കുക'],
    'reg.sub': ['Register as a student, teacher or parent.', 'വിദ്യാർത്ഥി, അധ്യാപകൻ അല്ലെങ്കിൽ രക്ഷിതാവ് എന്ന നിലയിൽ രജിസ്റ്റർ ചെയ്യുക.'],
    'reg.fullname': ['Full name', 'പൂർണ്ണ നാമം'],
    'reg.phone': ['Mobile number', 'മൊബൈൽ നമ്പർ'],
    'reg.admissionNo': ['Admission number', 'അഡ്മിഷൻ നമ്പർ'],
    'reg.rollNo': ['Roll number', 'റോൾ നമ്പർ'],
    'reg.class': ['Class', 'ക്ലാസ്'],
    'reg.employeeNo': ['Staff ID / Employee number', 'സ്റ്റാഫ് ഐഡി'],
    'reg.subject': ['Subject', 'വിഷയം'],
    'reg.studentName': ['Student name', 'വിദ്യാർത്ഥിയുടെ പേര്'],
    'reg.studentClass': ['Student class', 'വിദ്യാർത്ഥിയുടെ ക്ലാസ്'],
    'reg.relationship': ['Relationship to student', 'വിദ്യാർത്ഥിയുമായുള്ള ബന്ധം'],
    'reg.create': ['Create account', 'അക്കൗണ്ട് ഉണ്ടാക്കുക'],
    'reg.have': ['Already have an account? Sign in', 'അക്കൗണ്ട് ഉണ്ടോ? പ്രവേശിക്കുക'],
    'reg.doneStudent': ['Account created. Please sign in — the school office will verify your admission details.', 'അക്കൗണ്ട് ഉണ്ടാക്കി. പ്രവേശിക്കുക — സ്കൂൾ ഓഫീസ് നിങ്ങളുടെ വിവരങ്ങൾ പരിശോധിക്കും.'],
    'reg.doneTeacher': ['Account created. A school administrator must approve your teacher account before you can sign in.', 'അക്കൗണ്ട് ഉണ്ടാക്കി. പ്രവേശിക്കുന്നതിന് മുൻപ് സ്കൂൾ അഡ്മിനിസ്ട്രേറ്റർ അംഗീകാരം നൽകണം.'],
    'reg.doneParent': ['Account created. Link your child and the school will verify your relationship.', 'അക്കൗണ്ട് ഉണ്ടാക്കി. കുട്ടിയെ ബന്ധിപ്പിക്കുക, സ്കൂൾ ബന്ധം പരിശോധിക്കും.'],
    'reg.teacherNote': ['Teacher accounts are verified by the school administration.', 'അധ്യാപക അക്കൗണ്ടുകൾ സ്കൂൾ ഭരണവിഭാഗം പരിശോധിച്ച് അംഗീകരിക്കുന്നു.'],
    'reg.parentNote': ['Parents register themselves; the school verifies your relationship to the student.', 'രക്ഷിതാക്കൾ സ്വയം രജിസ്റ്റർ ചെയ്യുന്നു; വിദ്യാർത്ഥിയുമായുള്ള ബന്ധം സ്കൂൾ പരിശോധിക്കുന്നു.'],

    // ---- password reset ----
    'pw.title': ['Reset your password', 'പാസ്‌വേഡ് പുനഃസജ്ജീകരിക്കുക'],
    'pw.send': ['Email me a code', 'കോഡ് ഇമെയിൽ ചെയ്യുക'],
    'pw.sent': ['If that email is registered, a 6-digit code has been sent. Enter it below.', 'ആ ഇമെയിൽ രജിസ്റ്റർ ചെയ്തിട്ടുണ്ടെങ്കിൽ 6 അക്ക കോഡ് അയച്ചിട്ടുണ്ട്. താഴെ നൽകുക.'],
    'pw.new': ['New password', 'പുതിയ പാസ്‌വേഡ്'],
    'pw.update': ['Update password', 'പാസ്‌വേഡ് അപ്‌ഡേറ്റ് ചെയ്യുക'],
    'pw.updated': ['Your password has been updated. Please sign in.', 'പാസ്‌വേഡ് അപ്‌ഡേറ്റ് ചെയ്തു. പ്രവേശിക്കുക.'],

    // ---- results ----
    'res.title': ['Exam results', 'പരീക്ഷാ ഫലങ്ങൾ'],
    'res.sub': ['View results with your class and roll number.', 'ക്ലാസും റോൾ നമ്പറും ഉപയോഗിച്ച് ഫലങ്ങൾ കാണുക.'],
    'res.view': ['View result', 'ഫലം കാണുക'],
    'res.class': ['Class', 'ക്ലാസ്'],
    'res.roll': ['Roll number', 'റോൾ നമ്പർ'],
    'res.exam': ['Examination', 'പരീക്ഷ'],
    'res.published': ['Published on', 'പ്രസിദ്ധീകരിച്ചത്'],
    'res.subject': ['Subject', 'വിഷയം'],
    'res.marks': ['Marks', 'മാർക്ക്'],
    'res.grade': ['Grade', 'ഗ്രേഡ്'],
    'res.total': ['Total', 'ആകെ'],
    'res.percentage': ['Percentage', 'ശതമാനം'],
    'res.notfound': ['No results found for that class and roll number.', 'ആ ക്ലാസിനും റോൾ നമ്പറിനും ഫലങ്ങൾ കണ്ടെത്തിയില്ല.'],
    'res.print': ['Print / Save as PDF', 'പ്രിന്റ് / PDF ആയി സേവ് ചെയ്യുക'],
    'res.publish': ['Publish results', 'ഫലങ്ങൾ പ്രസിദ്ധീകരിക്കുക'],
    'res.publishNote': ['Only teachers with published-results permission can use this page.', 'ഫല പ്രസിദ്ധീകരണ അനുമതിയുള്ള അധ്യാപകർക്ക് മാത്രം.'],
    'res.saved': ['Result published', 'ഫലം പ്രസിദ്ധീകരിച്ചു'],

    // ---- dashboard ----
    'dash.overview': ['Overview', 'അവലോകനം'],
    'dash.profile': ['My profile', 'എന്റെ പ്രൊഫൈൽ'],
    'dash.notices': ['Notices', 'അറിയിപ്പുകൾ'],
    'dash.chat': ['Class group chat', 'ക്ലാസ് ഗ്രൂപ്പ് ചാറ്റ്'],
    'dash.results': ['My results', 'എന്റെ ഫലങ്ങൾ'],
    'dash.publish': ['Publish results', 'ഫലം പ്രസിദ്ധീകരിക്കുക'],
    'dash.children': ['My children', 'എന്റെ കുട്ടികൾ'],
    'dash.students': ['Students', 'വിദ്യാർത്ഥികൾ'],
    'dash.teachers': ['Teachers', 'അധ്യാപകർ'],
    'dash.parents': ['Parent requests', 'രക്ഷിതാവ് അഭ്യർത്ഥനകൾ'],
    'dash.moderation': ['Chat moderation', 'ചാറ്റ് മോഡറേഷൻ'],
    'dash.registrations': ['Teacher approvals', 'അധ്യാപക അംഗീകാരം'],
    'dash.classes': ['Classes', 'ക്ലാസുകൾ'],
    'dash.content': ['Website content', 'വെബ്സൈറ്റ് ഉള്ളടക്കം'],
    'dash.history': ['Moderation history', 'മോഡറേഷൻ ചരിത്രം'],
    'dash.linkChild': ['Link a child', 'കുട്ടിയെ ബന്ധിപ്പിക്കുക'],

    // ---- statuses ----
    'st.pending': ['Pending', 'കാത്തിരിക്കുന്നു'],
    'st.approved': ['Approved', 'അംഗീകരിച്ചു'],
    'st.rejected': ['Rejected', 'നിരസിച്ചു'],
    'st.published': ['Published', 'പ്രസിദ്ധീകരിച്ചു'],
    'st.draft': ['Draft', 'ഡ്രാഫ്റ്റ്'],
    'st.hidden': ['Hidden', 'മറച്ചു'],
    'st.active': ['Active', 'സജീവം'],
    'st.disabled': ['Disabled', 'പ്രവർത്തനരഹിതം'],

    // ---- actions ----
    'act.approve': ['Approve', 'അംഗീകരിക്കുക'],
    'act.reject': ['Reject', 'നിരസിക്കുക'],
    'act.save': ['Save', 'സേവ് ചെയ്യുക'],
    'act.cancel': ['Cancel', 'റദ്ദാക്കുക'],
    'act.delete': ['Delete', 'ഇല്ലാതാക്കുക'],
    'act.edit': ['Edit', 'തിരുത്തുക'],
    'act.publish': ['Publish', 'പ്രസിദ്ധീകരിക്കുക'],
    'act.unpublish': ['Unpublish', 'പിൻവലിക്കുക'],
    'act.hide': ['Hide message', 'സന്ദേശം മറയ്ക്കുക'],
    'act.restore': ['Restore', 'പുനഃസ്ഥാപിക്കുക'],
    'act.report': ['Report', 'റിപ്പോർട്ട് ചെയ്യുക'],
    'act.send': ['Send', 'അയക്കുക'],
    'act.loading': ['Loading…', 'ലോഡ് ചെയ്യുന്നു…'],
    'act.saving': ['Saving…', 'സേവ് ചെയ്യുന്നു…'],

    // ---- chat ----
    'chat.title': ['Class group chat', 'ക്ലാസ് ഗ്രൂപ്പ് ചാറ്റ്'],
    'chat.placeholder': ['Write a message…', 'സന്ദേശം എഴുതുക…'],
    'chat.modNote': ['Messages are moderated by teachers. Abusive content is removed and reported.', 'അധ്യാപകർ സന്ദേശങ്ങൾ നിയന്ത്രിക്കുന്നു. അനുചിതമായ ഉള്ളടക്കം നീക്കം ചെയ്യും.'],
    'chat.reported': ['Message reported to teachers.', 'സന്ദേശം അധ്യാപകർക്ക് റിപ്പോർട്ട് ചെയ്തു.'],
    'chat.hidden': ['This message was removed by a teacher.', 'ഈ സന്ദേശം അധ്യാപകൻ നീക്കം ചെയ്തു.'],
    'chat.empty': ['No messages yet. Say hello!', 'സന്ദേശങ്ങൾ ഇല്ല. ഹായ് പറയൂ!'],
    'chat.locked': ['Group chat is available to verified students and teachers only.', 'സ്ഥിരീകരിച്ച വിദ്യാർത്ഥികൾക്കും അധ്യാപകർക്കും മാത്രം.'],
    'chat.noRooms': ['You have not been assigned to a class yet.', 'നിങ്ങൾക്ക് ഇതുവരെ ക്ലാസ് അനുവദിച്ചിട്ടില്ല.'],
    'chat.teachersLounge': ['Teachers’ lounge', 'അധ്യാപക ലോഞ്ച്'],

    // ---- errors ----
    'err.generic': ['Something went wrong. Please try again.', 'എന്തോ കുഴപ്പം സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.'],
    'err.invalidlogin': ['Incorrect email or password.', 'ഇമെയിലോ പാസ്‌വേഡോ തെറ്റാണ്.'],
    'err.required': ['Please fill in all required fields.', 'എല്ലാ ആവശ്യമായ വിവരങ്ങളും പൂരിപ്പിക്കുക.'],
    'err.email': ['Enter a valid email address.', 'ശരിയായ ഇമെയിൽ വിലാസം നൽകുക.'],
    'err.nameLength': ['Please write your full name (2 to 80 characters).', 'പൂർണ്ണ പേര് നൽകുക (2 മുതൽ 80 അക്ഷരം വരെ).'],
    'err.phone': ['Enter a valid 10-digit mobile number.', 'ശരിയായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.'],
    'err.passwordShort': ['Password must be at least 12 characters.', 'പാസ്‌വേഡ് കുറഞ്ഞത് 12 അക്ഷരങ്ങൾ വേണം.'],
    'err.passwordCommon': ['That password is too easy to guess. Use a phrase only you would know.', 'ഈ പാസ്‌വേഡ് എളുപ്പം ഊഹിക്കാം. നിങ്ങൾക്ക് മാത്രം അറിയാവുന്ന ഒരു വാക്യം ഉപയോഗിക്കുക.'],
    'err.passwordPlain': ['Add a capital letter, a number or a symbol to the password.', 'പാസ്‌വേഡിൽ ഒരു വലിയ അക്ഷരമോ അക്കമോ ചിഹ്നമോ ചേർക്കുക.'],
    'err.tooManyTries': ['Too many wrong attempts. Wait {n} minute(s) and try again.', 'വളരെയധികം തെറ്റായ ശ്രമങ്ങൾ. {n} മിനിറ്റ് കാത്തിരുന്ന് വീണ്ടും ശ്രമിക്കുക.'],
    'err.emailTaken': ['This email is already registered. Sign in or use another address.', 'ഈ ഇമെയിൽ ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്. ലോഗിൻ ചെയ്യുക അല്ലെങ്കിൽ മറ്റൊരു വിലാസം ഉപയോഗിക്കുക.'],
    'err.slowdown': ['Please wait a moment, then send again.', 'അൽപ്പസമയം കാത്തിരുന്ന് വീണ്ടും അയക്കുക.'],
    'err.mailFailed': ['The school mail server could not send the confirmation email, so this registration did not finish and no code arrived. Wait a few minutes and try again. If the same message appears, the office must fix Authentication → SMTP Settings; until then nobody can register with an email. If a later attempt says the address is already registered, open "Verify a new account" and press Resend code.', 'സ്കൂളിന്റെ മെയിൽ സെർവറിൽ നിന്ന് സ്ഥിരീകരണ ഇമെയിൽ അയയ്ക്കാനായില്ല. അതിനാൽ ഈ രജിസ്ട്രേഷൻ പൂർത്തിയായിട്ടില്ല, കോഡും ലഭിച്ചിട്ടില്ല. കുറച്ച് മിനിറ്റ് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക. അതേ സന്ദേശം വീണ്ടും വന്നാൽ ഓഫീസ് Authentication → SMTP Settings ശരിയാക്കണം; അതുവരെ ഇമെയിൽ ഉപയോഗിച്ച് രജിസ്റ്റർ ചെയ്യാൻ കഴിയില്ല. പിന്നീട് "ഇതിനകം രജിസ്റ്റർ ചെയ്തു" എന്ന് വന്നാൽ "അക്കൗണ്ട് സ്ഥിരീകരിക്കുക" തുറന്ന് കോഡ് വീണ്ടും അയയ്ക്കുക.'],
    'res.notpdf': ['Please choose a PDF file.', 'PDF ഫയൽ തിരഞ്ഞെടുക്കുക.'],
    'res.toobig': ['That file is bigger than 20 MB.', 'ഫയൽ 20 MB-ൽ കൂടുതലാണ്.'],
    'res.readfail': ['That file could not be read. Try another PDF.', 'ഫയൽ വായിക്കാനായില്ല. മറ്റൊരു PDF ശ്രമിക്കുക.'],
    'err.noperm': ['You do not have permission to do that.', 'അതിന് നിങ്ങൾക്ക് അനുമതിയില്ല.'],
    'err.session': ['Please sign in again.', 'വീണ്ടും പ്രവേശിക്കുക.'],
    'err.demo': ['Demo mode: data is stored only in this browser. Connect Supabase to go live.', 'ഡെമോ മോഡ്: ഡാറ്റ ഈ ബ്രൗസറിൽ മാത്രം. ലൈവ് ആകാൻ Supabase ബന്ധിപ്പിക്കുക.'],
    'err.setup': ['Supabase is not configured yet. Add your project URL and anon key in js/config.js.', 'Supabase ഇതുവരെ ക്രമീകരിച്ചിട്ടില്ല. js/config.js ൽ വിവരങ്ങൾ ചേർക്കുക.'],

    // ---- misc ----
    'misc.demoBanner': ['Preview mode — sample data, stored in this browser only', 'പ്രിവ്യൂ മോഡ് — മാതൃകാ ഡാറ്റ, ഈ ബ്രൗസറിൽ മാത്രം'],
    'misc.readMore': ['Read more', 'കൂടുതൽ വായിക്കുക'],
    'misc.allNotices': ['All notices', 'എല്ലാ അറിയിപ്പുകളും'],
    'misc.viewAll': ['View all', 'എല്ലാം കാണുക'],
    'misc.loading': ['Loading…', 'ലോഡ് ചെയ്യുന്നു…'],
    'misc.none': ['Nothing here yet.', 'ഇവിടെ ഒന്നുമില്ല.'],
    'misc.today': ['Today', 'ഇന്ന്'],
    'misc.yesterday': ['Yesterday', 'ഇന്നലെ']
  };

  const KN = window.KN_TEXT || {};

  function getLang() {
    return document.documentElement.getAttribute('data-lang') || 'en';
  }

  function t(key, fallback) {
    const row = DICT[key];
    if (!row) return fallback || key;
    const lang = getLang();
    if (lang === 'ml') return row[1];
    if (lang === 'kn') return KN[row[0]] || row[0];
    return row[0];
  }

  /* Pick a translation for a hard-coded English string. Malayalam comes from
     the second argument, Kannada from the shared Kannada dictionary. */
  function pick(en, ml) {
    const lang = getLang();
    if (lang === 'ml') return ml;
    if (lang === 'kn') return KN[en] || en;
    return en;
  }

  function apply() {
    const lang = getLang();
    const attr = lang === 'ml' ? 'ml' : (lang === 'kn' ? 'kn' : 'en');
    const knText = function (en) { return KN[en] || en; };
    document.querySelectorAll('[data-en]').forEach(function (el) {
      let val = el.getAttribute('data-' + attr);
      if (val === null && lang === 'kn') val = knText(el.getAttribute('data-en'));
      if (val !== null) el.textContent = val;
    });
    document.querySelectorAll('[data-en-html]').forEach(function (el) {
      let val = el.getAttribute('data-' + attr + '-html');
      if (val === null && lang === 'kn') val = knText(el.getAttribute('data-en-html'));
      if (val !== null) el.innerHTML = val;
    });
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      let val = el.getAttribute('data-' + attr + '-ph');
      if (val === null && lang === 'kn') val = knText(el.getAttribute('data-en-ph'));
      if (val !== null) el.setAttribute('placeholder', val);
    });
    document.querySelectorAll('[data-en-aria]').forEach(function (el) {
      let val = el.getAttribute('data-' + attr + '-aria');
      if (val === null && lang === 'kn') val = knText(el.getAttribute('data-en-aria'));
      if (val !== null) el.setAttribute('aria-label', val);
    });
    document.documentElement.lang = lang === 'ml' ? 'ml' : (lang === 'kn' ? 'kn' : 'en');
  }

  function setLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    try { localStorage.setItem('ghss_lang', lang); } catch (e) {}
    apply();
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.lang === lang);
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem('ghss_lang'); } catch (e) {}
    const lang = saved || (window.APP_CONFIG && window.APP_CONFIG.defaultLang) || 'en';
    document.documentElement.setAttribute('data-lang', lang);
    apply();
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.lang === lang);
      b.addEventListener('click', function () { setLang(b.dataset.lang); });
    });
  }

  window.I18NS = { t: t, pick: pick, apply: apply, setLang: setLang, init: init, getLang: getLang };
})();
