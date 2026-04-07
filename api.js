/**
 * api.js — Google Apps Script API layer
 * OBR & Voucher Tracker — PRMSU Budget Office
 *
 * After deploying Code.gs as a Web App, paste your URL below.
 */

'use strict';

// ─── REPLACE THIS WITH YOUR WEB APP URL ───────────────────────
const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
// Example:
// const API_URL = 'https://script.google.com/macros/s/AKfycb.../exec';

// ─── Offline / localStorage fallback key ─────────────────────
const LOCAL_KEY   = 'prmsu_obr_local';
const PENDING_KEY = 'prmsu_obr_pending'; // queued offline writes

// ─── Check if API is configured ───────────────────────────────
function isApiConfigured() {
  return API_URL && !API_URL.includes('YOUR_GOOGLE');
}

// ─── GET all records ──────────────────────────────────────────
async function apiGetAll() {
  if (!isApiConfigured()) {
    return getLocalRecords();
  }
  try {
    const res  = await fetch(`${API_URL}?action=getAll`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    // Sync to local cache
    saveLocalCache(json.data);
    return json.data;
  } catch (err) {
    console.warn('apiGetAll failed, using local cache:', err);
    return getLocalRecords();
  }
}

// ─── INSERT a new record ──────────────────────────────────────
async function apiInsert(record) {
  if (!isApiConfigured()) {
    return localInsert(record);
  }
  try {
    const res  = await fetch(API_URL, {
      method:  'POST',
      body:    JSON.stringify({ action: 'insert', record }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    // Update local cache
    const db = getLocalRecords();
    db.unshift(record);
    saveLocalCache(db);
    return json.data;
  } catch (err) {
    console.warn('apiInsert failed, saving locally:', err);
    return localInsert(record);
  }
}

// ─── UPDATE a record ─────────────────────────────────────────
async function apiUpdate(record) {
  if (!isApiConfigured()) {
    return localUpdate(record);
  }
  try {
    const res  = await fetch(API_URL, {
      method:  'POST',
      body:    JSON.stringify({ action: 'update', record }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    // Update local cache
    const db  = getLocalRecords();
    const idx = db.findIndex(r => r.id === record.id);
    if (idx >= 0) { db[idx] = record; saveLocalCache(db); }
    return json.data;
  } catch (err) {
    console.warn('apiUpdate failed, saving locally:', err);
    return localUpdate(record);
  }
}

// ─── DELETE a record ──────────────────────────────────────────
async function apiDelete(id) {
  if (!isApiConfigured()) {
    return localDelete(id);
  }
  try {
    const res  = await fetch(API_URL, {
      method:  'POST',
      body:    JSON.stringify({ action: 'delete', id }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);

    // Update local cache
    const db = getLocalRecords().filter(r => r.id !== id);
    saveLocalCache(db);
  } catch (err) {
    console.warn('apiDelete failed, deleting locally:', err);
    localDelete(id);
  }
}

// ─── Local Cache Helpers ──────────────────────────────────────
function getLocalRecords() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
  catch (e) { return []; }
}

function saveLocalCache(data) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }
  catch (e) { console.error('saveLocalCache error:', e); }
}

function localInsert(record) {
  const db = getLocalRecords();
  db.unshift(record);
  saveLocalCache(db);
  return record;
}

function localUpdate(record) {
  const db  = getLocalRecords();
  const idx = db.findIndex(r => r.id === record.id);
  if (idx >= 0) { db[idx] = record; saveLocalCache(db); }
  return record;
}

function localDelete(id) {
  const db = getLocalRecords().filter(r => r.id !== id);
  saveLocalCache(db);
}

// ─── ID & date helpers ────────────────────────────────────────
function genId() {
  return 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().split('T')[0];
}
