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
  domain: 'ghsspandi.org.in'
};

// Classes offered: primary and upper primary (1-7), high school (8-10, split
// into divisions) and higher secondary Commerce only.
window.SCHOOL_CLASSES = [
  '1', '2', '3', '4', '5', '6', '7',
  '8 A', '8 B', '9 A', '9 B', '10 A', '10 B',
  'Plus One Commerce', 'Plus Two Commerce'
];

window.SUPABASE_CONFIG = {
  /* Replace with your project values from Supabase → Settings → API */
  url: 'https://ljpwzkmniocjpcijuuoq.supabase.co',
  anonKey: 'sb_publishable_XNVFQfIFiGAelOGk2_NXQQ_i8RHoQpU'
};

/* How a new account proves it owns the contact it registered with.
   'sms'   -> a six-digit code is texted to the mobile number
   'email' -> the old behaviour, a six-digit code by email
   SMS needs a provider on the Supabase side: Authentication -> Providers ->
   Phone, with Twilio/MSG91 and (in India) a DLT-registered sender and template.
   Until that is on, leave this as 'email' or registration stops working. */
window.OTP_CONFIG = {
  channel: 'sms',
  country: '+91'
};

/* Turns 9446553567, 09446553567 or +91 94465 53567 into +919446553567. */
window.OTP_CONFIG.toE164 = function (value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  const cc = String(window.OTP_CONFIG.country || '+91').replace('+', '');
  if (digits.length > 10 && digits.startsWith(cc)) return '+' + digits;
  return '+' + cc + digits.replace(/^0+/, '').slice(-10);
};

/* True when this build sends the code by SMS rather than email. */
window.OTP_CONFIG.usesSms = function () {
  return String(window.OTP_CONFIG.channel || 'email').toLowerCase() === 'sms';
};

/* What the person types: a mobile number in SMS mode, an address otherwise. */
window.OTP_CONFIG.identityOf = function (email, phone) {
  return window.OTP_CONFIG.usesSms() ? window.OTP_CONFIG.toE164(phone) : String(email || '').trim().toLowerCase();
};

window.APP_CONFIG = {
  /* When Supabase is not configured the site runs in local demo mode so the
     UI can be previewed. All accounts live in this browser only. */
  demoFallback: true,
  defaultLang: 'en',
  chatMaxLength: 500
};

/* The student AI study buddy. Left empty, the buddy answers from the study
   notes built into js/ai.js, so the site works with no API key and no cost.
   To connect a real language model, deploy a Supabase Edge Function that holds
   the key (never put a key in this file) and set its URL here. It must accept
   {"message","lang","nickname","class"} and return {"reply":"..."}. */
window.AI_CONFIG = {
  endpoint: '',
  maxTurnsPerHour: 60
};
