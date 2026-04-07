/**
 * app.js — Application entry point
 */

'use strict';

(async function init() {
  // Show API setup warning if not configured
  if (!isApiConfigured()) {
    showSetupBanner();
  }

  // Load records from Google Sheets (or local cache)
  showLoading('Loading records...');
  try {
    const data = await apiGetAll();
    setRecords(data);
    updateDbStatus(true);
  } catch (e) {
    updateDbStatus(false);
    console.error('Load error:', e);
  } finally {
    hideLoading();
  }

  updateNavCount(getRecords().length);
  refreshDashboard();

  // Set today's date in the form
  const fi = document.getElementById('f-date-in');
  const fd = document.getElementById('f-date');
  if (fi) fi.value = today();
  if (fd) fd.value = today();

  console.info('[OBR Tracker] Ready. API configured:', isApiConfigured());
})();

function showSetupBanner() {
  const banner = document.getElementById('setup-banner');
  if (banner) banner.classList.remove('hidden');
}
