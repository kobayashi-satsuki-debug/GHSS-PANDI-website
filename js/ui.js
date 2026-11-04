/* =========================================================
   UI helpers — toasts, modals, dates, escaping, form state.
   ========================================================= */
(function () {
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function toast(message, kind) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('role', 'status');
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + (kind === 'error' ? 'err' : kind === 'ok' ? 'ok' : '');
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 4200);
    setTimeout(() => el.remove(), 4700);
  }

  function formatDate(value, withTime) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    const lang = window.I18NS ? window.I18NS.getLang() : 'en';
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    if (withTime) { opts.hour = 'numeric'; opts.minute = '2-digit'; }
    return d.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-IN', opts);
  }

  function formatTime(value) {
    const d = new Date(value);
    if (isNaN(d)) return '';
    const lang = window.I18NS ? window.I18NS.getLang() : 'en';
    return d.toLocaleTimeString(lang === 'ml' ? 'ml-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' });
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function el(tag, attrs, html) {
    const node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      if (k === 'class') node.className = attrs[k];
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    if (html != null) node.innerHTML = html;
    return node;
  }

  function emptyState(icon, text) {
    return '<div class="empty"><span class="big">' + esc(icon || '📄') + '</span>' + esc(text) + '</div>';
  }

  function showMsg(node, text, kind) {
    if (!node) return;
    node.textContent = text;
    node.className = 'form-msg show ' + (kind || 'info');
  }
  function hideMsg(node) { if (node) node.className = 'form-msg'; }

  function busy(btn, on, label) {
    if (!btn) return;
    if (on) {
      btn.dataset.label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> ' + (label || '');
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
    }
  }

  function confirmDialog(title, text, okLabel) {
    return new Promise(resolve => {
      const modal = el('div', { class: 'modal open', role: 'dialog', 'aria-modal': 'true' });
      modal.innerHTML =
        '<div class="modal-card" style="max-width:420px">' +
          '<div class="modal-head"><h3>' + esc(title) + '</h3></div>' +
          '<div class="modal-body"><p style="margin:0">' + esc(text) + '</p></div>' +
          '<div class="modal-foot">' +
            '<button class="btn btn-ghost" data-act="no">' + esc(window.I18NS.t('act.cancel')) + '</button>' +
            '<button class="btn btn-primary" data-act="yes">' + esc(okLabel || window.I18NS.t('act.approve')) + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', e => {
        const act = e.target.closest('[data-act]');
        if (act) { modal.remove(); resolve(act.dataset.act === 'yes'); }
        else if (e.target === modal) { modal.remove(); resolve(false); }
      });
    });
  }

  function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
  function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }

  const MONTHS = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ml: ['ജനു', 'ഫെബ്രു', 'മാർ', 'ഏപ്രി', 'മേയ്', 'ജൂൺ', 'ജൂലൈ', 'ഓഗ', 'സെപ്റ്റ', 'ഒക്ടോ', 'നവം', 'ഡിസം'],
    kn: ['ಜನ', 'ಫೆಬ್ರ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿ', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗ', 'ಸೆಪ್ಟ', 'ಅಕ್ಟೋ', 'ನವೆಂ', 'ಡಿಸೆಂ']
  };
  function dayMonth(value) {
    const d = new Date(value);
    const lang = window.I18NS ? window.I18NS.getLang() : 'en';
    return { d: d.getDate(), m: (MONTHS[lang] || MONTHS.en)[d.getMonth()] };
  }


  function csvCell(v) {
    let t = v === null || v === undefined ? '' : String(v);
    if (/^[=+@\t\r]/.test(t)) t = "'" + t;
    return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }

  /* Download rows as a CSV file. A BOM keeps Malayalam/Kannada text correct in Excel. */
  function downloadCsv(filename, headers, rows) {
    const lines = [headers.map(csvCell).join(',')];
    rows.forEach(r => lines.push(r.map(csvCell).join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  window.UI = { downloadCsv, esc, toast, formatDate, formatTime, initials, el, emptyState, showMsg, hideMsg, busy, confirmDialog, openModal, closeModal, dayMonth };
})();
