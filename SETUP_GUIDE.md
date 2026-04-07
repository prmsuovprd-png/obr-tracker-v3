# OBR & Voucher Tracker — Setup Guide
## PRMSU Budget Office

---

## Why Google Sheets?

Your data is saved **permanently** in a Google Sheet — it never disappears, works from any device, any browser, and is free forever.

---

## STEP 1 — Create a Google Sheet

1. Go to **https://sheets.google.com**
2. Create a **New Spreadsheet**
3. Name it: `OBR Voucher Tracker`
4. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  >>>THIS_PART<<<  /edit
   ```

---

## STEP 2 — Deploy the Google Apps Script

1. Go to **https://script.google.com**
2. Click **New Project**
3. Delete all default code
4. Open `Code.gs` from this project folder
5. **Paste the entire contents** into the script editor
6. On **line 14**, replace `YOUR_GOOGLE_SHEET_ID_HERE` with your Sheet ID:
   ```javascript
   const SHEET_ID = 'your_actual_sheet_id_here';
   ```
7. Click 💾 **Save** (Ctrl+S)
8. Click **Deploy → New Deployment**
9. Settings:
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
10. Click **Deploy**
11. **Authorize** when prompted (click "Allow")
12. Copy the **Web App URL** — it looks like:
    ```
    https://script.google.com/macros/s/AKfycb.../exec
    ```

---

## STEP 3 — Connect the Frontend

1. Open `js/api.js` in VS Code
2. Find line 10:
   ```javascript
   const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace with your URL:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Save the file

---

## STEP 4 — Publish Your Site

### Option A: GitHub Pages (Free)
1. Create a free account at **https://github.com**
2. Create a new repository (e.g., `obr-tracker`)
3. Upload all files from the `obr-tracker-v2` folder
4. Go to **Settings → Pages → Source: main branch**
5. Your site will be live at: `https://yourusername.github.io/obr-tracker`

### Option B: Netlify (Free)
1. Go to **https://netlify.com**
2. Sign up free
3. Drag and drop the entire `obr-tracker-v2` folder onto the Netlify dashboard
4. Done — your site is live instantly with a URL

---

## STEP 5 — Test It

1. Open your published site
2. The setup banner at the top should **disappear** (if API_URL is set correctly)
3. The sidebar footer should show: **Google Sheets ✓**
4. Add a test record — check your Google Sheet to confirm it was saved

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Connection Error" in sidebar | Check your API_URL in api.js |
| Records not saving to Sheet | Re-deploy the Apps Script (Deploy → Manage → Edit → Deploy) |
| "Authorization required" error | Open the Apps Script URL in browser and authorize again |
| Sheet not found | Double-check SHEET_ID in Code.gs matches your actual sheet |

---

## File Structure

```
obr-tracker-v2/
├── index.html          ← Main app
├── Code.gs             ← Google Apps Script (deploy this separately)
├── SETUP_GUIDE.md      ← This file
├── css/
│   └── style.css       ← All styles
└── js/
    ├── api.js          ← ⭐ Set your API_URL here
    ├── store.js        ← In-memory data store
    ├── ui.js           ← Navigation & UI helpers
    ├── form.js         ← New entry form
    ├── records.js      ← Records table
    ├── tracker.js      ← Paper tracker
    ├── charts.js       ← Dashboard charts
    ├── export.js       ← CSV & Excel export
    └── app.js          ← App initialization
```

---

*Built for PRMSU Budget Office — OBR & Voucher Tracking System*
