(function () {
  'use strict';

  const CONFIG = window.AI_CONFIG || {};
  const today = () => new Date();

  const SUGGESTIONS = {
    en: ['Explain photosynthesis', 'How do I solve a quadratic equation?', 'Tips to remember exam answers', 'Help me improve my English', 'What is Ohm\u2019s law?'],
    ml: ['പ്രകാശസംശ്ലേഷണം വിശദീകരിക്കുക', 'ദ്വിമാന സമവാക്യം എങ്ങനെ നിർദ്ധാരണം ചെയ്യാം?', 'പരീക്ഷാ ഉത്തരങ്ങൾ ഓർക്കാനുള്ള വഴികൾ', 'ഇംഗ്ലീഷ് മെച്ചപ്പെടുത്താൻ സഹായിക്കുക', 'ഓമിന്റെ നിയമം എന്ത്?'],
    kn: ['ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ವಿವರಿಸಿ', 'ವರ್ಗ ಸಮೀಕರಣ ಹೇಗೆ ಬಿಡಿಸುವುದು?', 'ಪರೀಕ್ಷಾ ಉತ್ತರ ನೆನಪಿಡುವ ಸಲಹೆ', 'ಇಂಗ್ಲಿಷ್ ಸುಧಾರಿಸಲು ಸಹಾಯ ಮಾಡಿ', 'ಓಮ್ ಕಾನೂನು ಎಂದರೇನು?']
  };

  const TOPICS = [
    {
      keys: ['photosynthesis', 'പ്രകാശസംശ്ലേഷണ', 'ದ್ಯುತಿಸಂಶ್ಲೇಷಣ', 'chlorophyll', 'plant food'],
      en: 'Photosynthesis is how green plants make food.\n\n1. Roots take water, leaves take carbon dioxide.\n2. Chlorophyll in the leaf traps sunlight.\n3. Water and carbon dioxide join to form glucose, and oxygen is released.\n\nEquation: 6CO\u2082 + 6H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082 (in sunlight, with chlorophyll).\n\nExam tip: draw the leaf cross-section and label stomata, mesophyll and vein \u2014 that diagram alone often carries two marks.',
      ml: 'പ്രകാശസംശ്ലേഷണം എന്നത് പച്ചച്ചെടികൾ ഭക്ഷണം ഉണ്ടാക്കുന്ന രീതിയാണ്.\n\n1. വേരുകൾ വെള്ളം എടുക്കുന്നു, ഇലകൾ കാർബൺ ഡൈ ഓക്സൈഡ് എടുക്കുന്നു.\n2. ഇലയിലെ ക്ലോറോഫിൽ സൂര്യപ്രകാശം പിടിച്ചെടുക്കുന്നു.\n3. വെള്ളവും കാർബൺ ഡൈ ഓക്സൈഡും ചേർന്ന് ഗ്ലൂക്കോസ് ഉണ്ടാകുന്നു, ഓക്സിജൻ പുറത്തുവരുന്നു.\n\nസമവാക്യം: 6CO\u2082 + 6H\u2082O \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082.\n\nപരീക്ഷാ നുറുങ്ങ്: ഇലയുടെ ഛേദചിത്രം വരച്ച് സ്റ്റോമാറ്റ, മീസോഫിൽ, സിര എന്നിവ അടയാളപ്പെടുത്തുക \u2014 ഈ ചിത്രത്തിന് തന്നെ രണ്ട് മാർക്ക് കിട്ടാം.'
    },
    {
      keys: ['quadratic', 'ദ്വിമാന', 'ವರ್ಗ ಸಮೀಕರಣ', 'x2', 'x^2', 'algebra', 'ബീജഗണിത'],
      en: 'For a quadratic equation ax\u00b2 + bx + c = 0:\n\n\u2022 Formula: x = (\u2212b \u00b1 \u221a(b\u00b2 \u2212 4ac)) / 2a\n\u2022 Discriminant D = b\u00b2 \u2212 4ac decides the roots: D > 0 two real roots, D = 0 one repeated root, D < 0 no real roots.\n\u2022 If the roots are \u03b1 and \u03b2 then \u03b1 + \u03b2 = \u2212b/a and \u03b1\u03b2 = c/a.\n\nExample: x\u00b2 \u2212 5x + 6 = 0 \u2192 D = 25 \u2212 24 = 1 \u2192 x = (5 \u00b1 1)/2 \u2192 x = 3 or 2.\n\nTry the next one yourself and tell me your answer: x\u00b2 \u2212 7x + 12 = 0.',
      ml: 'ax\u00b2 + bx + c = 0 എന്ന ദ്വിമാന സമവാക്യത്തിന്:\n\n\u2022 സൂത്രവാക്യം: x = (\u2212b \u00b1 \u221a(b\u00b2 \u2212 4ac)) / 2a\n\u2022 D = b\u00b2 \u2212 4ac മൂലങ്ങളുടെ സ്വഭാവം തീരുമാനിക്കുന്നു: D > 0 രണ്ട് യഥാർത്ഥ മൂലങ്ങൾ, D = 0 ഒരു മൂലം, D < 0 യഥാർത്ഥ മൂലമില്ല.\n\u2022 മൂലങ്ങൾ \u03b1, \u03b2 എങ്കിൽ \u03b1 + \u03b2 = \u2212b/a, \u03b1\u03b2 = c/a.\n\nഉദാഹരണം: x\u00b2 \u2212 5x + 6 = 0 \u2192 D = 1 \u2192 x = 3 അല്ലെങ്കിൽ 2.\n\nഅടുത്തത് നിങ്ങൾ ചെയ്ത് ഉത്തരം പറയൂ: x\u00b2 \u2212 7x + 12 = 0.'
    },
    {
      keys: ['ohm', 'ഓം', 'ಓಮ್', 'current', 'voltage', 'resistance', 'വോൾട്ടേജ്'],
      en: 'Ohm\u2019s law: V = I \u00d7 R, where V is voltage (volts), I is current (amperes) and R is resistance (ohms).\n\n\u2022 Doubling the voltage doubles the current if resistance stays the same.\n\u2022 Example: 12 V across 4 \u03a9 gives I = V/R = 3 A.\n\u2022 Power: P = V \u00d7 I.\n\nIn the exam, always write the formula, substitute with units, then give the answer with the unit \u2014 marks are given for each step.',
      ml: 'ഓമിന്റെ നിയമം: V = I \u00d7 R. V = വോൾട്ടേജ് (വോൾട്ട്), I = കറന്റ് (ആമ്പിയർ), R = പ്രതിരോധം (ഓം).\n\n\u2022 പ്രതിരോധം മാറ്റമില്ലാതെ വോൾട്ടേജ് ഇരട്ടിയായാൽ കറന്റും ഇരട്ടിയാകും.\n\u2022 ഉദാഹരണം: 4 \u03a9 പ്രതിരോധത്തിൽ 12 V \u2192 I = 3 A.\n\u2022 പവർ: P = V \u00d7 I.\n\nപരീക്ഷയിൽ സൂത്രവാക്യം എഴുതി, യൂണിറ്റോടെ മൂല്യം ചേർത്ത്, ഉത്തരം യൂണിറ്റോടെ നൽകുക.'
    },
    {
      keys: ['english', 'grammar', 'ഇംഗ്ലീഷ', 'ಇಂಗ್ಲಿಷ್', 'tense', 'essay', 'paragraph'],
      en: 'Five habits that raise English marks fastest:\n\n1. Read one news report aloud every day \u2014 you hear correct sentences.\n2. Keep a page of "useful phrases" from your textbook and use two of them in each answer.\n3. Learn ten new words a week with one sentence each.\n4. In writing answers, use the pattern: point \u2192 explanation \u2192 example.\n5. Before the exam, practise the previous three question papers with a timer.\n\nTell me a topic and I will give you an outline to write about.',
      ml: 'ഇംഗ്ലീഷ് മാർക്ക് വേഗം കൂട്ടാൻ അഞ്ച് ശീലങ്ങൾ:\n\n1. ദിവസവും ഒരു വാർത്ത ഉറക്കെ വായിക്കുക.\n2. പാഠപുസ്തകത്തിലെ "ഉപയോഗപ്രദ വാക്യങ്ങൾ" എഴുതി സൂക്ഷിച്ച് ഓരോ ഉത്തരത്തിലും രണ്ടെണ്ണം ഉപയോഗിക്കുക.\n3. ആഴ്ചയിൽ പത്ത് പുതിയ വാക്കുകൾ, ഓരോന്നും ഒരു വാക്യത്തിൽ.\n4. ഉത്തരം എഴുതുമ്പോൾ: ആശയം \u2192 വിശദീകരണം \u2192 ഉദാഹരണം.\n5. പരീക്ഷയ്ക്ക് മുൻപ് മൂന്ന് പഴയ ചോദ്യപേപ്പറുകൾ സമയം നോക്കി ചെയ്യുക.\n\nഒരു വിഷയം പറയൂ, ഒരു രൂപരേഖ തയ്യാറാക്കി തരാം.'
    },
    {
      keys: ['study', 'remember', 'ഓർക്ക', 'ನೆನಪ', 'exam tip', 'revision', 'പഠന'],
      en: 'A revision plan that actually works:\n\n\u2022 Study in 25-minute blocks with a 5-minute break (four blocks, then a longer break).\n\u2022 After reading a page, close the book and write what you remember \u2014 this is "active recall" and beats re-reading.\n\u2022 Revisit yesterday\u2019s topic for five minutes before starting today\u2019s.\n\u2022 Make one page of diagrams and formulas per subject and revise only that on the last day.\n\u2022 Sleep 7\u20138 hours: memory is fixed during sleep, not during the night before.\n\nTell me your exam date and subjects, and I will help you split the days.',
      ml: 'ഫലപ്രദമായ റിവിഷൻ പ്ലാൻ:\n\n\u2022 25 മിനിറ്റ് പഠനം, 5 മിനിറ്റ് വിശ്രമം \u2014 നാല് ചുറ്റ് കഴിഞ്ഞ് നീണ്ട വിശ്രമം.\n\u2022 ഒരു പേജ് വായിച്ചതിന് ശേഷം പുസ്തകം അടച്ച് ഓർമ്മയുള്ളത് എഴുതുക \u2014 ഇതാണ് "ആക്ടീവ് റീകോൾ".\n\u2022 ഇന്നത്തെ പഠനത്തിന് മുൻപ് ഇന്നലത്തെ വിഷയം 5 മിനിറ്റ് ഒന്ന് നോക്കുക.\n\u2022 ഓരോ വിഷയത്തിനും ചിത്രങ്ങളും സൂത്രവാക്യങ്ങളും ഒരു പേജിൽ എഴുതി അവസാന ദിവസം അത് മാത്രം നോക്കുക.\n\u2022 7\u20138 മണിക്കൂർ ഉറങ്ങുക \u2014 ഓർമ്മ ഉറക്കത്തിൽ ഉറയ്ക്കുന്നു.\n\nപരീക്ഷാ തീയതിയും വിഷയങ്ങളും പറഞ്ഞാൽ ദിവസങ്ങൾ വിഭജിച്ച് തരാം.'
    },
    {
      keys: ['result', 'ഫലം', 'ಫಲಿತಾಂಶ', 'marks', 'grade', 'report card'],
      en: 'To see your result: open the Results page, choose your class and roll number, then sign in. Parents see it after the office approves their link to you.\n\nIf a mark looks wrong, tell your class teacher first \u2014 corrections are made by the teacher who published the result, and every change is logged.',
      ml: 'ഫലം കാണാൻ: ഫലം പേജ് തുറന്ന് ക്ലാസും റോൾ നമ്പറും നൽകി ലോഗിൻ ചെയ്യുക. മാതാപിതാക്കൾ ഓഫീസ് അംഗീകാരം നൽകിയ ശേഷം കാണാം.\n\nമാർക്ക് തെറ്റാണെങ്കിൽ ക്ലാസ് ടീച്ചറെ ആദ്യം അറിയിക്കുക \u2014 ഫലം പ്രകടിപ്പിച്ച അധ്യാപകനാണ് തിരുത്തൽ നടത്തുക.'
    },
    {
      keys: ['admission', 'പ്രവേശന', 'ಪ್ರವೇಶ', 'join', 'seat', 'plus one'],
      en: 'Admissions: Class 8 and Plus One applications for 2026\u201327 are open. Submit the enquiry form on the Admissions page or visit the school office between 9:30 am and 3:30 pm with the student\u2019s birth certificate and the last report card. Phone: 94465 53567.',
      ml: 'പ്രവേശനം: 2026\u201327 അധ്യയനവർഷത്തേക്ക് 8-ാം ക്ലാസ്, പ്ലസ് വൺ അപേക്ഷകൾ തുറന്നിരിക്കുന്നു. പ്രവേശന പേജിലെ ഫോം പൂരിപ്പിക്കുകയോ ജനന സർട്ടിഫിക്കറ്റും അവസാന റിപ്പോർട്ട് കാർഡും സഹിതം രാവിലെ 9:30 മുതൽ വൈകുന്നേരം 3:30 വരെ ഓഫീസിൽ വരികയോ ചെയ്യുക. ഫോൺ: 94465 53567.'
    },
    {
      keys: ['chat', 'group chat', 'ചാറ്റ്', 'ಚಾಟ್', 'report message'],
      en: 'The class chat is for schoolwork. A teacher moderates it, and any message can be reported with the flag button. Bullying, personal details or photos of others are not allowed \u2014 reported messages are reviewed by staff and the action is recorded.',
      ml: 'ക്ലാസ് ചാറ്റ് പഠനത്തിനുള്ളതാണ്. അധ്യാപകർ മോഡറേറ്റ് ചെയ്യുന്നു; ഏത് സന്ദേശവും ഫ്ലാഗ് ചെയ്ത് റിപ്പോർട്ട് ചെയ്യാം. മറ്റുള്ളവരെ അപമാനിക്കുന്നതോ വ്യക്തിവിവരങ്ങളോ ഫോട്ടോകളോ പങ്കുവയ്ക്കുന്നതോ അനുവദനീയമല്ല.'
    },
    {
      keys: ['hello', 'hi', 'hey', 'ഹായ്', 'നമസ്കാരം', 'ನಮಸ್ಕಾರ', 'good morning'],
      en: 'Hello! I am {nickname}, your study buddy at G H S S Pandi. Ask me about any subject, exam preparation, results or school facilities. What are you working on today?',
      ml: 'നമസ്കാരം! ഞാൻ {nickname}, ജി.എച്ച്.എസ്.എസ്. പാണ്ടിയിലെ നിങ്ങളുടെ പഠന സഹായി. ഏത് വിഷയവും, പരീക്ഷാ തയ്യാറെടുപ്പ്, ഫലം, സ്കൂൾ സൗകര്യങ്ങൾ \u2014 ചോദിക്കാം. ഇന്ന് എന്താണ് പഠിക്കുന്നത്?'
    },
    {
      keys: ['thanks', 'thank you', 'നന്ദി', 'ಧನ್ಯವಾದ'],
      en: 'You are welcome. Come back any time \u2014 and remember to write the answer in your own words before the exam, that is what makes it stick.',
      ml: 'സ്വാഗതം. എപ്പോൾ വേണമെങ്കിലും വരിക \u2014 പരീക്ഷയ്ക്ക് മുൻപ് ഉത്തരം സ്വന്തം വാക്കുകളിൽ എഴുതി പരിശീലിക്കുക, അതാണ് ഓർമ്മയിൽ നിൽക്കാൻ സഹായിക്കുന്നത്.'
    }
  ];

  const REFUSALS = {
    en: 'Sorry, I cannot help with writing answers for a live exam, or with another student\u2019s marks or personal details. Those need a teacher. Ask me the subject instead and I will explain it.',
    ml: 'ക്ഷമിക്കണം, പരീക്ഷയ്ക്ക് നേരിട്ട് ഉത്തരം എഴുതി നൽകാനോ മറ്റൊരു വിദ്യാർത്ഥിയുടെ മാർക്കോ വ്യക്തിവിവരങ്ങളോ നൽകാനോ എനിക്കാവില്ല. അതിന് അധ്യാപകനെ സമീപിക്കുക. വിഷയം ചോദിച്ചാൽ വിശദീകരിച്ചു തരാം.'
  };

  const GUARD = /(mark(s)? of|result of|password|phone number of|address of|hack|exam paper leak|leaked question)/i;
  const LIVE_EXAM = /(answers? (for|to) (the |today.?s )?(exam|test)|solve my exam|help me cheat)/i;

  const FALLBACK = {
    en: 'I did not find that in my notes yet. I can help best with: photosynthesis, quadratic equations, Ohm\u2019s law, English writing, revision plans, results and admissions.\n\nYou can also ask your subject teacher in the class chat, or tell me the exact topic again with a few more words.',
    ml: 'അത് എന്റെ കുറിപ്പുകളിൽ ഇല്ല. ഇവയിൽ എനിക്ക് നന്നായി സഹായിക്കാം: പ്രകാശസംശ്ലേഷണം, ദ്വിമാന സമവാക്യങ്ങൾ, ഓമിന്റെ നിയമം, ഇംഗ്ലീഷ് എഴുത്ത്, റിവിഷൻ പ്ലാൻ, ഫലം, പ്രവേശനം.\n\nഅല്ലെങ്കിൽ ക്ലാസ് ചാറ്റിൽ വിഷയ അധ്യാപകനോട് ചോദിക്കാം; അല്ലെങ്കിൽ വിഷയം കുറച്ചുകൂടി വിശദമായി പറയൂ.'
  };

  function lang() {
    const l = (window.I18NS && window.I18NS.getLang()) || 'en';
    return l === 'ml' || l === 'kn' || l === 'en' ? l : 'en';
  }

  function fill(text, ctx) {
    return text.replace(/\{nickname\}/g, (ctx && ctx.nickname) || 'Buddy')
      .replace(/\{name\}/g, (ctx && ctx.name) || '');
  }

  function pickText(topic, l) {
    return topic[l] || topic.en;
  }

  function score(topic, msg) {
    const m = msg.toLowerCase();
    let s = 0;
    topic.keys.forEach(k => { if (m.indexOf(k.toLowerCase()) !== -1) s += 2; });
    return s;
  }

  async function viaEndpoint(message, ctx) {
    const res = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang: lang(), nickname: ctx.nickname, class: ctx.className })
    });
    if (!res.ok) throw new Error('ai_offline');
    const data = await res.json();
    return (data && (data.reply || data.text)) || '';
  }

  async function reply(message, ctx) {
    ctx = ctx || {};
    const l = lang();
    const text = String(message || '').trim();
    if (!text) return '';

    if (LIVE_EXAM.test(text) || GUARD.test(text)) return REFUSALS[l] || REFUSALS.en;

    if (CONFIG.endpoint) {
      try {
        const out = await viaEndpoint(text, ctx);
        if (out) return out;
      } catch (e) { /* fall through to the offline notes */ }
    }

    let best = null, bestScore = 0;
    TOPICS.forEach(t => {
      const s = score(t, text);
      if (s > bestScore) { best = t; bestScore = s; }
    });
    if (best && bestScore > 0) return fill(pickText(best, l), ctx);

    return FALLBACK[l] || FALLBACK.en;
  }

  function suggestions() {
    return SUGGESTIONS[lang()] || SUGGESTIONS.en;
  }

  function welcome(ctx) {
    const l = lang();
    const name = (ctx && ctx.nickname) || 'Buddy';
    const text = {
      en: 'Hi ' + (ctx && ctx.name ? ctx.name : 'there') + '! I am ' + name + ', your study buddy. Ask me about a subject, an exam or school information.',
      ml: 'ഹായ് ' + (ctx && ctx.name ? ctx.name : '') + '! ഞാൻ ' + name + ', നിങ്ങളുടെ പഠന സഹായി. വിഷയം, പരീക്ഷ, സ്കൂൾ വിവരങ്ങൾ \u2014 ചോദിക്കാം.',
      kn: 'ನಮಸ್ಕಾರ! ನಾನು ' + name + ', ನಿಮ್ಮ ಅಧ್ಯಯನ ಸಹಾಯಕ. ವಿಷಯ, ಪರೀಕ್ಷೆ ಅಥವಾ ಶಾಲೆಯ ಮಾಹಿತಿ ಕೇಳಿ.'
    };
    return text[l] || text.en;
  }

  window.AI = { reply, suggestions, welcome, configured: !!CONFIG.endpoint, TOPICS: TOPICS.length };
})();
