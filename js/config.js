/* =========================================================
   G H S S PANDI — site configuration
   Fill in your Supabase project values before publishing.
   The anon key is safe to expose; Row Level Security in the
   database enforces every permission.
   ========================================================= */
window.SCHOOL_CONFIG = {
  nameEn: 'Government Higher Secondary School, Pandi',
  nameMl: 'ഗവ. ഹയർ സെക്കൻഡറി സ്കൂൾ, പാണ്ടി',
  shortEn: 'G H S S PANDI',
  shortMl: 'ജി.എച്ച്.എസ്.എസ്. പാണ്ടി',
  addressEn: 'Pandi, Adoor, Kasaragod District, Kerala 671543',
  addressMl: 'പാണ്ടി, അടൂർ, കാസർകോട് ജില്ല, കേരളം 671543',
  phone: '9446553567',
  email: '14101ghsspandi@gmail.com',
  domain: 'ghsspandi.in'
};

window.SUPABASE_CONFIG = {
  /* Replace with your project values from Supabase → Settings → API */
  url: 'https://ljpwzkmniocjpcijuuoq.supabase.co',
  anonKey: 'sb_publishable_XNVFQfIFiGAelOGk2_NXQQ_i8RHoQpU'
};

window.APP_CONFIG = {
  /* When Supabase is not configured the site runs in local demo mode so the
     UI can be previewed. All accounts live in this browser only. */
  demoFallback: true,
  defaultLang: 'en',
  chatMaxLength: 500
};
