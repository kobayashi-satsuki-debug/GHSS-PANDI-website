/* =========================================================
   Shared layout, navigation and session helpers.
   ========================================================= */
(function () {
  const C = window.SCHOOL_CONFIG;

  const NAV = [
    ['index.html', 'nav.home', 'Home', 'ഹോം'],
    ['about.html', 'nav.about', 'About', 'സ്കൂളിനെക്കുറിച്ച്'],
    ['admissions.html', 'nav.admissions', 'Admissions', 'പ്രവേശനം'],
    ['gallery.html', 'nav.gallery', 'Gallery', 'ചിത്രശാല'],
    ['creative.html', 'nav.creative', 'Creative corner', 'ക്രിയേറ്റീവ് കോർണർ'],
    ['achievements.html', 'nav.achievements', 'Achievements', 'നേട്ടങ്ങൾ'],
    ['faculty.html', 'nav.faculty', 'Faculty', 'അധ്യാപകർ'],
    ['notices.html', 'nav.notices', 'Notices', 'അറിയിപ്പുകൾ'],
    ['results.html', 'nav.results', 'Results', 'ഫലങ്ങൾ'],
    ['resources.html', 'nav.resources', 'Resources', 'പഠന സാമഗ്രികൾ']
  ];

  function page() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }

  function headerHtml(session) {
    const cur = page();
    const items = NAV.map(([href, , en, ml]) =>
      '<li><a href="' + href + '" data-en="' + en + '" data-ml="' + ml + '"' +
      (cur === href ? ' aria-current="page"' : '') + '>' + en + '</a></li>').join('');
    const account = session
      ? '<li class="nav-login"><a class="btn btn-primary btn-sm" href="dashboard.html" data-en="Dashboard" data-ml="ഡാഷ്ബോർഡ്">Dashboard</a></li>'
      : '<li class="nav-login"><a class="btn btn-primary btn-sm" href="login.html" data-en="Login" data-ml="ലോഗിൻ">Login</a></li>';

    return '' +
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<div class="topstrip"><div class="container">' +
        '<div class="topstrip-info">' +
          '<span>📞 <a href="tel:+91' + C.phone + '">+91 ' + C.phone + '</a></span>' +
          '<span>✉️ <a href="mailto:' + C.email + '">' + C.email + '</a></span>' +
          '<span>📍 <span data-en="Pandi, Adoor, Kasaragod, Kerala" data-ml="പാണ്ടി, അടൂർ, കാസർകോട്, കേരളം">Pandi, Adoor, Kasaragod, Kerala</span></span>' +
        '</div>' +
        '<div class="lang-switch" role="group" aria-label="Language">' +
          '<button type="button" data-lang="en" class="active">English</button>' +
          '<button type="button" data-lang="ml">മലയാളം</button>' +
          '<button type="button" data-lang="kn">ಕನ್ನಡ</button>' +
        '</div>' +
      '</div></div>' +
      '<div class="container">' +
        '<div class="header-main">' +
          '<a class="brand" href="index.html">' +
            '<img src="assets/logo.svg" alt="GHSS Pandi logo" width="58" height="58">' +
            '<span class="brand-text">' +
              '<span class="brand-title" data-en="G H S S Pandi" data-ml="ജി.എച്ച്.എസ്.എസ് പാണ്ടി">G H S S Pandi</span><br>' +
              '<span class="brand-sub" data-en="Government Higher Secondary School" data-ml="ഗവ. ഹയർ സെക്കൻഡറി സ്കൂൾ">Government Higher Secondary School</span>' +
            '</span>' +
          '</a>' +
          '<div class="header-actions">' +
            '<a class="btn btn-gold btn-sm" href="admissions.html" data-en="Apply now" data-ml="അപേക്ഷിക്കുക">Apply now</a>' +
            '<button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false">☰</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<nav class="site-nav" id="site-nav" aria-label="Main navigation"><div class="container">' +
        '<ul>' + items + account + '</ul>' +
      '</div></nav>';
  }

  function footerHtml() {
    return '<div class="container">' +
      '<div class="footer-grid">' +
        '<div>' +
          '<div class="footer-brand">' +
            '<img src="assets/logo.svg" alt="">' +
            '<span><strong data-en="G H S S Pandi" data-ml="ജി.എച്ച്.എസ്.എസ് പാണ്ടി">G H S S Pandi</strong>' +
            '<span data-en="Government Higher Secondary School, Kerala" data-ml="ഗവ. ഹയർ സെക്കൻഡറി സ്കൂൾ, കേരളം">Government Higher Secondary School, Kerala</span></span>' +
          '</div>' +
          '<p class="small" style="color:#c9b39a" data-en="A government higher secondary school serving the Pandi community in Kasaragod district, Kerala, with a tradition of academic excellence and public service." data-ml="കാസർകോട് ജില്ലയിലെ പാണ്ടി ജനതയ്ക്ക് സേവനം നൽകുന്ന ഗവൺമെന്റ് ഹയർ സെക്കൻഡറി സ്കൂൾ — വിദ്യാഭ്യാസ മികവിന്റെയും സാമൂഹിക സേവനത്തിന്റെയും പാരമ്പര്യം.">A government higher secondary school serving the Pandi community in Kasaragod district, Kerala.</p>' +
        '</div>' +
        '<div>' +
          '<h4 data-en="School" data-ml="സ്കൂൾ">School</h4>' +
          '<ul class="footer-links">' +
            '<li><a href="about.html" data-en="About us" data-ml="ഞങ്ങളെക്കുറിച്ച്">About us</a></li>' +
            '<li><a href="faculty.html" data-en="Our faculty" data-ml="അധ്യാപകർ">Our faculty</a></li>' +
            '<li><a href="creative.html" data-en="Creative corner" data-ml="ക്രിയേറ്റീവ് കോർണർ">Creative corner</a></li>' +
            '<li><a href="achievements.html" data-en="Achievements" data-ml="നേട്ടങ്ങൾ">Achievements</a></li>' +
            '<li><a href="notices.html" data-en="Notices" data-ml="അറിയിപ്പുകൾ">Notices</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4 data-en="Portals" data-ml="പോർട്ടലുകൾ">Portals</h4>' +
          '<ul class="footer-links">' +
            '<li><a href="login.html" data-en="Student / Teacher login" data-ml="വിദ്യാർത്ഥി / അധ്യാപക ലോഗിൻ">Student / Teacher login</a></li>' +
            '<li><a href="login.html#parent" data-en="Parent login" data-ml="രക്ഷിതാവ് ലോഗിൻ">Parent login</a></li>' +
            '<li><a href="register.html" data-en="Create an account" data-ml="അക്കൗണ്ട് ഉണ്ടാക്കുക">Create an account</a></li>' +
            '<li><a href="results.html" data-en="Exam results" data-ml="പരീക്ഷാ ഫലങ്ങൾ">Exam results</a></li>' +
            '<li><a href="resources.html" data-en="Notes and PDF resources" data-ml="കുറിപ്പുകളും PDF സാമഗ്രികളും">Notes and PDF resources</a></li>' +
            '<li><a href="staff.html" data-en="Headmaster / staff sign-in" data-ml="പ്രിൻസിപ്പൽ / സ്റ്റാഫ് ലോഗിൻ">Headmaster / staff sign-in</a></li>' +
            '<li><a href="admissions.html" data-en="Admissions" data-ml="പ്രവേശനം">Admissions</a></li>' +
          '</ul>' +
        '</div>' +
        '<div>' +
          '<h4 data-en="Contact" data-ml="ബന്ധപ്പെടുക">Contact</h4>' +
          '<ul class="footer-contact">' +
            '<li>📍 <span data-en="' + C.addressEn + '" data-ml="' + C.addressMl + '">' + C.addressEn + '</span></li>' +
            '<li>📞 <a href="tel:+91' + C.phone + '">+91 ' + C.phone + '</a></li>' +
            '<li>✉️ <a href="mailto:' + C.email + '">' + C.email + '</a></li>' +
            '<li class="small">' + '<span data-en="Office hours: 9:30 am – 3:30 pm, Monday to Friday" data-ml="ഓഫീസ് സമയം: രാവിലെ 9:30 – വൈകുന്നേരം 3:30, തിങ്കൾ–വെള്ളി">Office hours: 9:30 am – 3:30 pm, Monday to Friday</span></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
        '<span>© ' + new Date().getFullYear() + ' G H S S Pandi. <span data-en="All rights reserved." data-ml="എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.">All rights reserved.</span></span>' +
        '<span data-en="Website run by the school IT club" data-ml="സ്കൂൾ ഐ.ടി ക്ലബ്ബ് നിർവഹിക്കുന്നു">Website run by the school IT club</span>' +
      '</div>' +
    '</div>';
  }

  function demoBanner() {
    if (API.isLive) return '';
    return '<div style="background:#fff3d6;color:#7a5200;text-align:center;font-size:.8rem;padding:.35rem 1rem;border-bottom:1px solid #f0dcae">' +
      '<span data-en="Preview mode — sample accounts and data stored in this browser only. Connect Supabase in js/config.js to go live." ' +
      'data-ml="പ്രിവ്യൂ മോഡ് — മാതൃകാ അക്കൗണ്ടുകളും ഡാറ്റയും ഈ ബ്രൗസറിൽ മാത്രം. ലൈവ് ആകാൻ js/config.js ൽ Supabase ബന്ധിപ്പിക്കുക.">' +
      'Preview mode — sample accounts and data stored in this browser only. Connect Supabase in js/config.js to go live.</span></div>';
  }

  let sessionPromise = null;
  function session(force) {
    if (!sessionPromise || force) sessionPromise = API.session().catch(() => null);
    return sessionPromise;
  }

  async function mount() {
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    let s = await session();
    if (header) {
      header.className = 'site-header';
      header.innerHTML = demoBanner() + headerHtml(s);
      const toggle = header.querySelector('.nav-toggle');
      const nav = header.querySelector('#site-nav');
      if (toggle) toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? '✕' : '☰';
      });
    }
    if (footer) {
      footer.className = 'site-footer';
      footer.innerHTML = footerHtml();
    }
    if (window.I18NS) {
      window.I18NS.apply();
      window.I18NS.init();
    }
    return s;
  }

  async function requireRole(roles, loginUrl) {
    const s = await session(true);
    if (!s) {
      location.href = (loginUrl || 'login.html') + '?next=' + encodeURIComponent(location.pathname.split('/').pop());
      return null;
    }
    if (roles && roles.indexOf(s.profile.role) === -1) {
      location.href = 'dashboard.html';
      return null;
    }
    if (window.Security) Security.startIdleGuard();
    return s;
  }

  async function logout() {
    await API.signOut();
    sessionPromise = null;
    location.href = 'index.html';
  }

  window.Site = { mount, session, requireRole, logout, page };
})();
