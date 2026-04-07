/**
 * store.js — In-memory records store
 * All modules read/write through here so there's one source of truth.
 */

'use strict';

let _records = [];

function getRecords()         { return _records; }
function setRecords(data)     { _records = Array.isArray(data) ? data : []; }
function addRecord(r)         { _records.unshift(r); }
function replaceRecord(r)     {
  const i = _records.findIndex(x => x.id === r.id);
  if (i >= 0) _records[i] = r;
}
function removeRecord(id)     { _records = _records.filter(r => r.id !== id); }
