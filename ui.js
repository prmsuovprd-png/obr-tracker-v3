/**
 * ui.js — Navigation, toast, confirm dialog, shared helpers
 * OBR & Voucher Tracker — PRMSU Budget Office
 */

'use strict';

const PAGES = ['dashboard', 'new-entry', 'records', 'tracker'];
const PAGE_TITLES = {
  'dashboard': '📊 Dashboard',
  'new-entry': '📝 New Entry',
  'records':   '📋 Records',
  'tracker':   '📍 Paper Tracker',
};

function showPage(id) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p).classList.add('hidden');
    const nav = document.getElementById('nav-' + p);
    if (nav) nav.classList.remove('active');
  });
  document.getElementById('page-' + id).classList.remove('hidden');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[id] || id;
  const nav = document.getElementById('nav-' + id);
  if (nav) nav.classList.add('active');

  if (id === 'dashboard') refreshDashboard();
  if (id === 'records')   renderRecords();
  if (id === 'tracker')   renderTrackerList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavCount(count) {
  document.getElementById('nav-count').textContent = count;
}

// ─── Loading Overlay ──────────────────────────────────────────
function showLoading(msg = 'Saving...') {
  document.getElementById('loading-msg').textContent = msg;
  document.getElementById('loading-overlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

// ─── Toast ────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'toast'; }, 3400);
}

// ─── Confirm ──────────────────────────────────────────────────
let _confirmResolve = null;
function showConfirm(title, msg, icon = '⚠️', okLabel = 'Delete', okClass = 'btn-danger') {
  document.getElementById('confirm-icon').textContent  = icon;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  const btn = document.getElementById('confirm-ok');
  btn.textContent = okLabel;
  btn.className   = 'btn ' + okClass;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  return new Promise(res => { _confirmResolve = res; });
}
function confirmResolve(val) {
  document.getElementById('confirm-overlay').classList.add('hidden');
  if (_confirmResolve) { _confirmResolve(val); _confirmResolve = null; }
}

// ─── Modal ────────────────────────────────────────────────────
function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ─── Shared Formatters ────────────────────────────────────────
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtPHP(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function locationLabel(loc) {
  return (loc || 'Budget Office').replace(/[^\x00-\x7F]/g, '').trim() || 'Budget Office';
}

const STATUS_MAP = {
  PENDING:     { cls: 'p-pending',     label: 'Pending' },
  OUP:         { cls: 'p-oup',         label: 'OUP' },
  ACCOUNTING:  { cls: 'p-accounting',  label: 'Accounting' },
  RELEASED:    { cls: 'p-released',    label: 'Released' },
  APPROVED:    { cls: 'p-approved',    label: 'Approved' },
  DISAPPROVED: { cls: 'p-disapproved', label: 'Disapproved' },
  RETURNED:    { cls: 'p-returned',    label: 'Returned' },
};
function statusPill(action) {
  const s = STATUS_MAP[action] || { cls: 'p-pending', label: action || '—' };
  return `<span class="pill ${s.cls}">${s.label}</span>`;
}

// ─── API status indicator ─────────────────────────────────────
function updateDbStatus(ok) {
  const dot  = document.getElementById('db-dot');
  const text = document.getElementById('db-status-text');
  if (ok) {
    dot.classList.remove('error');
    text.textContent = isApiConfigured() ? 'Google Sheets ✓' : 'LocalStorage (setup needed)';
  } else {
    dot.classList.add('error');
    text.textContent = 'Connection Error';
  }
}
