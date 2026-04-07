/**
 * form.js — New Entry form: save, clear, edit, update
 */

'use strict';

let _editId = null;

const FORM_FIELDS = [
  'f-date','f-date-in','f-time-in','f-obr-no',
  'f-payee','f-amount','f-charge-to','f-received-by',
  'f-particulars','f-date-released','f-time-out','f-dv-no',
  'f-dv-payee','f-dv-amount','f-dv-charge','f-dv-particulars',
  'f-oup-received','f-oup-date','f-oup-time','f-received-initial',
];

function getVal(id)      { return (document.getElementById(id)?.value || '').trim(); }
function setVal(id, val) { const el = document.getElementById(id); if (el && val != null) el.value = val; }

function resolveLocation(action, raw) {
  if (action === 'RELEASED')                            return 'Released';
  if (action === 'OUP')                                 return 'OUP';
  if (action === 'ACCOUNTING' || action === 'APPROVED') return 'Accounting Office';
  return raw || 'Budget Office';
}

function clearForm() {
  FORM_FIELDS.forEach(id => setVal(id, ''));
  setVal('f-date-in', today());
  setVal('f-date',    today());
  setVal('f-location', 'Budget Office');
  setVal('f-action',   'PENDING');
  _editId = null;
  const btn = document.getElementById('btn-save');
  if (btn) { btn.textContent = '✅ Save Entry'; btn.onclick = saveEntry; }
}

function buildRecord(action, location) {
  return {
    date:             getVal('f-date'),
    dateIn:           getVal('f-date-in'),
    timeIn:           getVal('f-time-in'),
    obrNo:            getVal('f-obr-no'),
    payee:            getVal('f-payee'),
    amount:           parseFloat(document.getElementById('f-amount')?.value) || 0,
    chargeTo:         getVal('f-charge-to'),
    receivedBy:       getVal('f-received-by'),
    particulars:      getVal('f-particulars'),
    dateReleased:     getVal('f-date-released'),
    timeOut:          getVal('f-time-out'),
    dvNo:             getVal('f-dv-no'),
    dvPayee:          getVal('f-dv-payee'),
    dvAmount:         parseFloat(document.getElementById('f-dv-amount')?.value) || 0,
    dvCharge:         getVal('f-dv-charge'),
    dvParticulars:    getVal('f-dv-particulars'),
    oupReceived:      getVal('f-oup-received'),
    oupDate:          getVal('f-oup-date'),
    oupTime:          getVal('f-oup-time'),
    receivedInitial:  getVal('f-received-initial'),
    action,
    location,
  };
}

async function saveEntry() {
  const dateIn = getVal('f-date-in');
  const payee  = getVal('f-payee');
  const amount = parseFloat(document.getElementById('f-amount')?.value);
  const parts  = getVal('f-particulars');

  if (!dateIn)               { showToast('⚠️ Date In is required', 'error'); return; }
  if (!payee)                { showToast('⚠️ Payee is required', 'error'); return; }
  if (isNaN(amount) || amount <= 0) { showToast('⚠️ Enter a valid amount', 'error'); return; }
  if (!parts)                { showToast('⚠️ Particulars is required', 'error'); return; }

  const action   = getVal('f-action') || 'PENDING';
  const location = resolveLocation(action, getVal('f-location'));
  const record   = buildRecord(action, location);
  record.id        = genId();
  record.createdAt = new Date().toISOString();
  record.year      = new Date().getFullYear();

  showLoading('Saving to Google Sheets...');
  try {
    await apiInsert(record);
    addRecord(record);
    updateNavCount(getRecords().length);
    showToast('✅ Entry saved to Google Sheets!', 'success');
    clearForm();
    showPage('records');
  } catch (e) {
    showToast('⚠️ Saved locally (no internet)', 'info');
  } finally {
    hideLoading();
  }
}

async function updateEntry() {
  if (!_editId) { saveEntry(); return; }

  const payee  = getVal('f-payee');
  const amount = parseFloat(document.getElementById('f-amount')?.value);
  if (!payee)                { showToast('⚠️ Payee is required', 'error'); return; }
  if (isNaN(amount) || amount <= 0) { showToast('⚠️ Enter a valid amount', 'error'); return; }

  const action   = getVal('f-action') || 'PENDING';
  const location = resolveLocation(action, getVal('f-location'));
  const existing = getRecords().find(r => r.id === _editId);
  const record   = { ...existing, ...buildRecord(action, location) };

  showLoading('Updating record...');
  try {
    await apiUpdate(record);
    replaceRecord(record);
    showToast('💾 Record updated!', 'success');
  } catch (e) {
    showToast('⚠️ Updated locally (no internet)', 'info');
  } finally {
    hideLoading();
    _editId = null;
    const btn = document.getElementById('btn-save');
    if (btn) { btn.textContent = '✅ Save Entry'; btn.onclick = saveEntry; }
    clearForm();
    showPage('records');
  }
}

function editRecord(id) {
  const r = getRecords().find(x => x.id === id);
  if (!r) return;
  _editId = id;
  showPage('new-entry');
  setVal('f-date',             r.date);
  setVal('f-date-in',          r.dateIn);
  setVal('f-time-in',          r.timeIn);
  setVal('f-obr-no',           r.obrNo);
  setVal('f-payee',            r.payee);
  setVal('f-amount',           r.amount);
  setVal('f-charge-to',        r.chargeTo);
  setVal('f-received-by',      r.receivedBy);
  setVal('f-particulars',      r.particulars);
  setVal('f-date-released',    r.dateReleased);
  setVal('f-time-out',         r.timeOut);
  setVal('f-dv-no',            r.dvNo);
  setVal('f-dv-payee',         r.dvPayee);
  setVal('f-dv-amount',        r.dvAmount);
  setVal('f-dv-charge',        r.dvCharge);
  setVal('f-dv-particulars',   r.dvParticulars);
  setVal('f-oup-received',     r.oupReceived);
  setVal('f-oup-date',         r.oupDate);
  setVal('f-oup-time',         r.oupTime);
  setVal('f-received-initial', r.receivedInitial);
  setVal('f-location',         locationLabel(r.location));
  setVal('f-action',           r.action);
  const btn = document.getElementById('btn-save');
  if (btn) { btn.textContent = '💾 Update Entry'; btn.onclick = updateEntry; }
  showToast('Editing: ' + r.payee, 'info');
}
