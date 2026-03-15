/* ══════════════════════════════════════════
   CUADERNO ARDUINO — TECuy | EBI-UTU 2025
   app.js — Lógica de la aplicación
   ══════════════════════════════════════════ */

'use strict';

// ── Password (stored in localStorage) ──
const DEFAULT_PASS = 'tecuy';
const PASS_KEY = 'arduino_sol_pass';

function getPass() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
}
function setPass(p) {
  localStorage.setItem(PASS_KEY, p);
}

// ── Tab Navigation ──
function showTab(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

  const sec = document.getElementById('sec-' + name);
  if (sec) sec.classList.add('active');

  document.querySelectorAll('.tab-item').forEach(t => {
    if (t.dataset.tab === name) t.classList.add('active');
  });

  // If solutions tab: check auth
  if (name === 'soluciones') checkSolAuth();

  // Scroll to top of content
  const tabsNav = document.querySelector('.tabs-nav');
  const offset = tabsNav ? tabsNav.offsetTop : 0;
  window.scrollTo({ top: Math.max(0, offset - 10), behavior: 'smooth' });
}

// ── Solutions Auth ──
function checkSolAuth() {
  const locked = document.getElementById('sol-locked');
  const content = document.getElementById('sol-content');
  const isAuth = sessionStorage.getItem('sol_auth') === '1';

  if (locked)  locked.style.display  = isAuth ? 'none'  : 'flex';
  if (content) content.style.display = isAuth ? 'block' : 'none';
}

function tryUnlock() {
  const input = document.getElementById('sol-pass-input');
  const errEl = document.getElementById('sol-error');
  if (!input) return;

  const val = input.value.trim();
  if (val === getPass()) {
    sessionStorage.setItem('sol_auth', '1');
    input.value = '';
    if (errEl) errEl.className = 'sol-error';
    checkSolAuth();
    showToast('✅ Acceso concedido', 's');
  } else {
    input.classList.add('error');
    if (errEl) errEl.className = 'sol-error show';
    setTimeout(() => input.classList.remove('error'), 400);
    input.value = '';
    input.focus();
  }
}

function lockSolutions() {
  sessionStorage.removeItem('sol_auth');
  checkSolAuth();
  showToast('🔐 Sección bloqueada', 'w');
}

// Enter key on unlock input
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const inp = document.getElementById('sol-pass-input');
    if (inp && document.activeElement === inp) tryUnlock();

    const mpInp = document.getElementById('modal-new-pass');
    if (mpInp && document.activeElement === mpInp) saveNewPass();
  }
});

// ── Exercise Toggle ──
function toggleEx(id) {
  const body = document.getElementById('body-' + id);
  const btn  = document.getElementById('btn-' + id);
  if (!body) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  if (btn) btn.classList.toggle('open', !isOpen);
}

// ── Solution Card Toggle ──
function toggleSol(id) {
  const body = document.getElementById(id);
  if (!body) return;
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  const btn = body.previousElementSibling?.querySelector('.sol-toggle-btn');
  if (btn) btn.textContent = isOpen ? 'Ver solución ▼' : 'Ocultar ▲';
}

// ── Copy Code ──
function copyCode(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.innerText;
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Código copiado', 's'))
    .catch(() => {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Código copiado', 's');
    });
}

// ── Open Claude with code explanation ──
function explainAI(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const code = el.innerText.substring(0, 600);
  const prompt = `Soy estudiante secundaria aprendiendo Arduino. Explicame este código con palabras simples:\n\n${code}`;
  window.open('https://claude.ai/new?q=' + encodeURIComponent(prompt), '_blank');
}

// ── Change Password Modal ──
function openPasswordModal() {
  // First verify current session is authenticated
  if (sessionStorage.getItem('sol_auth') !== '1') {
    showToast('⚠️ Primero desbloqueá las soluciones', 'w');
    showTab('soluciones');
    return;
  }
  const modal = document.getElementById('pass-modal');
  if (modal) {
    modal.classList.add('open');
    document.getElementById('modal-current-pass')?.focus();
    document.getElementById('modal-msg').className = 'modal-msg';
  }
}

function closePasswordModal() {
  const modal = document.getElementById('pass-modal');
  if (modal) {
    modal.classList.remove('open');
    ['modal-current-pass','modal-new-pass','modal-confirm-pass'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('modal-msg').className = 'modal-msg';
  }
}

function saveNewPass() {
  const cur  = document.getElementById('modal-current-pass')?.value || '';
  const newP = document.getElementById('modal-new-pass')?.value || '';
  const conf = document.getElementById('modal-confirm-pass')?.value || '';
  const msg  = document.getElementById('modal-msg');

  if (cur !== getPass()) {
    if (msg) { msg.className = 'modal-msg err'; msg.textContent = '❌ Contraseña actual incorrecta'; }
    return;
  }
  if (newP.length < 4) {
    if (msg) { msg.className = 'modal-msg err'; msg.textContent = '❌ La nueva contraseña debe tener al menos 4 caracteres'; }
    return;
  }
  if (newP !== conf) {
    if (msg) { msg.className = 'modal-msg err'; msg.textContent = '❌ Las contraseñas no coinciden'; }
    return;
  }

  setPass(newP);
  if (msg) { msg.className = 'modal-msg ok'; msg.textContent = '✅ Contraseña actualizada correctamente'; }
  setTimeout(() => closePasswordModal(), 1500);
  showToast('🔑 Contraseña cambiada', 's');
}

// Close modal clicking overlay
document.addEventListener('click', e => {
  const modal = document.getElementById('pass-modal');
  if (modal && e.target === modal) closePasswordModal();
});

// ── Toast ──
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Image lazy loading with fallback ──
function initImages() {
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.onerror = function() {
      const fallback = this.dataset.fallback;
      if (fallback) {
        this.src = fallback;
      } else {
        this.style.display = 'none';
        // Show emoji fallback if available
        const emoji = this.dataset.emoji;
        if (emoji) {
          const span = document.createElement('span');
          span.style.cssText = 'font-size:2.4rem;line-height:1;';
          span.textContent = emoji;
          this.parentNode.insertBefore(span, this);
        }
      }
    };
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initImages();

  // Open first exercise in fundamentos by default
  const firstEx = document.getElementById('body-ex01');
  const firstBtn = document.getElementById('btn-ex01');
  if (firstEx) {
    setTimeout(() => {
      firstEx.classList.add('open');
      if (firstBtn) firstBtn.classList.add('open');
    }, 200);
  }

  // Tab keyboard navigation
  document.querySelectorAll('.tab-item').forEach((tab, i, arr) => {
    tab.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') arr[Math.min(i+1, arr.length-1)].click();
      if (e.key === 'ArrowLeft')  arr[Math.max(i-1, 0)].click();
    });
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('role', 'tab');
  });
});
