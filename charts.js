/**
 * charts.js — Dashboard KPIs, bar chart, donut pie
 */

'use strict';

const PIE_COLORS = {
  PENDING:'#c8750a', OUP:'#6c3fc9', ACCOUNTING:'#1a6cf0',
  RELEASED:'#137a3e', APPROVED:'#0c8b72', DISAPPROVED:'#c62828', RETURNED:'#c45a0a',
};

function refreshDashboard() {
  const db  = getRecords();
  const now = new Date();
  updateNavCount(db.length);

  const dateEl = document.getElementById('dash-date');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  const yr = now.getFullYear();
  const el = document.getElementById('year-chip'); if(el) el.textContent = '📅 Year ' + yr;
  const fl = document.getElementById('form-year-label'); if(fl) fl.textContent = 'Year ' + yr;

  const bo  = db.filter(r=>r.action==='PENDING').length;
  const oup = db.filter(r=>r.action==='OUP').length;
  const acc = db.filter(r=>r.action==='ACCOUNTING'||r.action==='APPROVED').length;
  const rel = db.filter(r=>r.action==='RELEASED').length;

  const p = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v+' paper'+(v!==1?'s':''); };
  p('pipe-bo',bo); p('pipe-oup',oup); p('pipe-acc',acc); p('pipe-rel',rel);

  const s = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
  s('kpi-total',  db.length);
  s('kpi-amount', fmtPHP(db.reduce((a,r)=>a+Number(r.amount||0),0)));
  s('kpi-released', rel);
  s('kpi-pending',  db.filter(r=>r.action!=='RELEASED'&&r.action!=='DISAPPROVED').length);
  s('oc-bo',bo); s('oc-oup',oup); s('oc-acc',acc);

  renderChargeBars(db);
  renderPie(db);
}

function renderChargeBars(db) {
  const el = document.getElementById('charge-bars');
  if (!el) return;
  const map = {};
  db.forEach(r => { const k=(r.chargeTo||'N/A').trim(); map[k]=(map[k]||0)+Number(r.amount||0); });
  const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if (!sorted.length) { el.innerHTML='<div class="empty-state" style="padding:28px"><div class="es-icon">📊</div><p>No data yet</p></div>'; return; }
  const max = sorted[0][1]||1;
  el.innerHTML = sorted.map(([k,v])=>`
    <div class="bar-row">
      <div class="bar-label" title="${escHtml(k)}">${escHtml(k)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/max*100)}%"></div></div>
      <div class="bar-val">${fmtPHP(v)}</div>
    </div>`).join('');
}

function renderPie(db) {
  const canvas = document.getElementById('pie-canvas');
  const legend = document.getElementById('pie-legend');
  if (!canvas||!legend) return;
  const map = {};
  db.forEach(r=>{ const k=r.action||'PENDING'; map[k]=(map[k]||0)+1; });
  const ctx   = canvas.getContext('2d');
  const total = Object.values(map).reduce((a,b)=>a+b,0);
  const entries = Object.entries(map);
  ctx.clearRect(0,0,110,110);
  if (!total) {
    ctx.fillStyle='#e1e7ef'; ctx.beginPath(); ctx.arc(55,55,48,0,Math.PI*2); ctx.fill();
  } else {
    let start = -Math.PI/2;
    entries.forEach(([k,v])=>{
      const slice = (v/total)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(55,55); ctx.arc(55,55,48,start,start+slice); ctx.closePath();
      ctx.fillStyle = PIE_COLORS[k]||'#94a3b8'; ctx.fill();
      start += slice;
    });
    ctx.beginPath(); ctx.arc(55,55,26,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
    ctx.fillStyle='#1a2332'; ctx.font='700 14px JetBrains Mono,monospace';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(total,55,55);
  }
  legend.innerHTML = entries.length
    ? entries.map(([k,v])=>`
        <div class="pie-item">
          <div class="pie-dot" style="background:${PIE_COLORS[k]||'#94a3b8'}"></div>
          <span>${k}</span>
          <span class="pie-pct">${Math.round(v/total*100)}%</span>
        </div>`).join('')
    : '<p class="text-muted" style="font-size:12px">No data yet</p>';
}
