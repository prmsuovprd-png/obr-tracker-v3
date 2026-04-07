/**
 * records.js — Records table: render, filter, view, delete, move
 */

'use strict';

function renderRecords() {
  const db  = getRecords();
  const q   = (document.getElementById('rec-search')?.value || '').toLowerCase();
  const sf  = document.getElementById('rec-filter-status')?.value || '';
  const cf  = document.getElementById('rec-filter-charge')?.value  || '';

  // Rebuild charge filter
  const charges = [...new Set(db.map(r => r.chargeTo || '').filter(Boolean))].sort();
  const cSel    = document.getElementById('rec-filter-charge');
  const prevC   = cSel?.value;
  if (cSel) {
    cSel.innerHTML = '<option value="">All Charges</option>' +
      charges.map(c => `<option value="${c}" ${c===prevC?'selected':''}>${c}</option>`).join('');
  }

  const filtered = db.filter(r => {
    const txt = !q ||
      (r.payee||'').toLowerCase().includes(q) ||
      (r.obrNo||'').toLowerCase().includes(q) ||
      (r.dvNo||'').toLowerCase().includes(q)  ||
      (r.particulars||'').toLowerCase().includes(q) ||
      (r.chargeTo||'').toLowerCase().includes(q);
    return txt && (!sf || r.action === sf) && (!cf || r.chargeTo === cf);
  });

  const sub = document.getElementById('rec-sub');
  if (sub) sub.textContent = filtered.length + ' of ' + db.length + ' record' + (db.length!==1?'s':'');

  const tbody = document.getElementById('records-tbody');
  const empty = document.getElementById('records-empty');

  if (!filtered.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  tbody.innerHTML = filtered.map((r, i) => `
    <tr>
      <td class="mono" style="color:var(--subtle)">${i+1}</td>
      <td>${r.dateIn||'—'}</td>
      <td class="mono">${r.obrNo||'—'}</td>
      <td><div style="font-weight:600;font-size:13px">${escHtml(r.payee)}</div></td>
      <td class="amount">${fmtPHP(r.amount)}</td>
      <td><span class="charge-chip">${escHtml(r.chargeTo||'—')}</span></td>
      <td class="mono">${r.dvNo||'—'}</td>
      <td>${statusPill(r.action)}</td>
      <td style="font-size:12px;color:var(--muted)">${locationLabel(r.location)}</td>
      <td>
        <div class="row-acts">
          <button class="act-btn"        onclick="viewRecord('${r.id}')">View</button>
          <button class="act-btn"        onclick="editRecord('${r.id}')">Edit</button>
          <button class="act-btn danger" onclick="deleteRecord('${r.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterRecords() { renderRecords(); }

function viewRecord(id) {
  const r = getRecords().find(x => x.id === id);
  if (!r) return;

  document.getElementById('modal-title').textContent = '📋 Record — ' + (r.obrNo||'No OBR');
  document.getElementById('modal-body').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><label>Payee</label><p>${escHtml(r.payee)}</p></div>
      <div class="detail-item"><label>Amount</label><p class="mono">${fmtPHP(r.amount)}</p></div>
      <div class="detail-item"><label>OBR / BUR No.</label><p class="mono">${r.obrNo||'—'}</p></div>
      <div class="detail-item"><label>DV No.</label><p class="mono">${r.dvNo||'—'}</p></div>
      <div class="detail-item"><label>Date In</label><p>${r.dateIn||'—'}${r.timeIn?' at '+r.timeIn:''}</p></div>
      <div class="detail-item"><label>Charge To</label><p>${r.chargeTo||'—'}</p></div>
      <div class="detail-item"><label>Status</label><p>${statusPill(r.action)}</p></div>
      <div class="detail-item"><label>Location</label><p>${locationLabel(r.location)}</p></div>
      <div class="detail-item" style="grid-column:1/-1"><label>Particulars</label><p>${escHtml(r.particulars)||'—'}</p></div>
      ${r.oupDate    ?`<div class="detail-item"><label>OUP Date</label><p>${r.oupDate}</p></div>`:''}
      ${r.oupReceived?`<div class="detail-item"><label>OUP Received By</label><p>${escHtml(r.oupReceived)}</p></div>`:''}
    </div>
    <div class="move-form">
      <label>Quick Update — Move to / Change Status</label>
      <div class="move-form-row">
        <select class="form-control" id="move-action" style="flex:1">
          ${['PENDING','OUP','ACCOUNTING','APPROVED','RELEASED','DISAPPROVED','RETURNED']
            .map(a=>`<option value="${a}" ${a===r.action?'selected':''}>${a}</option>`).join('')}
        </select>
        <select class="form-control" id="move-loc" style="flex:1">
          ${['Budget Office','OUP','Accounting Office','Released']
            .map(l=>`<option value="${l}" ${locationLabel(r.location)===l?'selected':''}>${l}</option>`).join('')}
        </select>
        <button class="btn btn-primary" onclick="moveRecord('${r.id}')">Update</button>
      </div>
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-neutral" onclick="closeModal()">Close</button>
    <button class="btn btn-danger"  onclick="deleteRecord('${r.id}')">Delete</button>
  `;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

async function moveRecord(id) {
  const r = getRecords().find(x => x.id === id);
  if (!r) return;
  const updated = { ...r,
    action:   document.getElementById('move-action')?.value,
    location: document.getElementById('move-loc')?.value,
  };
  showLoading('Updating...');
  try {
    await apiUpdate(updated);
    replaceRecord(updated);
    showToast('📍 Record updated!', 'success');
  } catch (e) {
    showToast('⚠️ Updated locally', 'info');
  } finally {
    hideLoading();
    closeModal();
    renderRecords();
  }
}

async function deleteRecord(id) {
  const r = getRecords().find(x => x.id === id);
  if (!r) return;
  closeModal();
  const ok = await showConfirm(
    'Delete Record',
    `Delete "${r.payee}" (${r.obrNo||'No OBR'})? This cannot be undone.`,
    '🗑', 'Delete', 'btn-danger'
  );
  if (!ok) return;
  showLoading('Deleting...');
  try {
    await apiDelete(id);
    removeRecord(id);
    showToast('🗑 Record deleted', 'error');
  } catch (e) {
    showToast('⚠️ Deleted locally', 'info');
  } finally {
    hideLoading();
    renderRecords();
    updateNavCount(getRecords().length);
  }
}
