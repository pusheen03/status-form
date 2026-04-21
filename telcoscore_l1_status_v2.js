/* ── GCHAT CONFIG ── */
const GCHAT = {
  webhook : 'https://chat.googleapis.com/v1/spaces/AAQAos2lyw8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=YRRGulOMHa--v35bF0PC0U9d2Z6shF5b4DRwrq9VYsY',
  spaceUrl: 'https://mail.google.com/mail/u/0/?tab=rm&ogbl#chat/space/AAQAos2lyw8',
};

/* ── EMAILS / DOMAINS (update these to real addresses) ── */
const EMAILS = {
  platform : 'platform-team@globe.com.ph',
  infra    : 'infra-team@globe.com.ph',
  wakanda  : 'wakandal2support@globe.com.ph',
  mynt     : 'rochelle.panteria@gcash.com',
  ts       : 'ts-support@partner.com',
  fs       : 'fs-support@partner.com',
  hc       : 'hc-support@partner.com',
};

/* ── INIT DATE / TIME ── */
const now = new Date();
const dateInput = document.getElementById('rdate');
const timeInput = document.getElementById('rtime');
let isTimeLive = true;
let isDateManual = false;

function formatTimeValue(date) {
  return date.getHours().toString().padStart(2,'0') + ':' +
         date.getMinutes().toString().padStart(2,'0');
}

function updateLiveDateTime() {
  const current = new Date();
  if (!isDateManual) {
    dateInput.value = current.toISOString().split('T')[0];
  }
  if (isTimeLive) {
    timeInput.value = formatTimeValue(current);
  }
}

function resetTime() {
  isTimeLive = true;
  updateLiveDateTime();
}

updateLiveDateTime();
setInterval(updateLiveDateTime, 1000);

dateInput.addEventListener('input', () => { isDateManual = true; });
timeInput.addEventListener('input', () => { isTimeLive = false; });

timeInput.addEventListener('focus', () => { isTimeLive = false; });

/* ── SECTION SWITCHING ── */
function switchSection(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + section).classList.add('active');
}

// Set default to infra
switchSection('infra');

/* ── DETAIL TOGGLE ── */
const detailTriggers = {
  af1: ['err','warn'], af2: ['err'], af3: ['err'],
  gw1: ['err','warn'], gw2: ['err','warn'], gw3: ['err','warn'], gw4: ['err'],
  db1: ['prog','sched'], db2: ['prog','sched'], db3: ['prog','sched'], db4: ['prog','sched'],
  db5: ['prog','sched'], db6: ['prog','sched'], db7: ['err'], db8: ['err'], db9: ['err'], db10: ['err'], db11: ['err'], db12: ['err'],
  ap2: ['err'], ap3: ['ok','warn']
};
Object.entries(detailTriggers).forEach(([name, triggers]) => {
  document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
    r.addEventListener('change', function () {
      const lvl = this.value.split('|')[0];
      document.getElementById(name + '-d').style.display =
        triggers.includes(lvl) ? 'flex' : 'none';
    });
  });
});

/* ── PARTNER STATUS HANDLER ── */
function handlePartnerStatus(val) {
  const row = document.getElementById('partner-select-row');
  const detail = document.getElementById('ap1-d');
  if (val === 'err' || val === 'na') {
    row.classList.add('visible');
    detail.style.display = 'flex';
  } else {
    row.classList.remove('visible');
    detail.style.display = 'none';
  }
  updatePartnerPreview();
}

/* ── PARTNER CHECKBOXES → update preview labels ── */
function getSelectedPartners() {
  const partners = [];
  if (document.getElementById('cb-ts')?.checked) partners.push('TS');
  if (document.getElementById('cb-fs')?.checked) partners.push('FS');
  if (document.getElementById('cb-hc')?.checked) partners.push('HC');
  return partners;
}

function updatePartnerPreview() {
  const partners = getSelectedPartners();
  const previewEl = document.getElementById('partner-recipient-preview');
  const wakandaEl = document.getElementById('wakanda-recipients-preview');

  if (partners.length === 0) {
    previewEl.textContent = '';
    if (wakandaEl) wakandaEl.textContent = 'Wakanda · MYNT';
  } else {
    const list = ['Wakanda', 'MYNT', ...partners].join(' · ');
    previewEl.textContent = 'Email will be sent to: ' + list;
    if (wakandaEl) wakandaEl.textContent = list;
  }
}

/* ── SCREENSHOT TOGGLE ── */
function toggleSS(section, val) {
  document.getElementById(section + '-screenshot').value = val;
  document.getElementById(section + '-ss-no').classList.toggle('active', val === 'no');
  document.getElementById(section + '-ss-yes').classList.toggle('active', val === 'yes');
}

/* ── HELPERS ── */
function rv(name) {
  const c = document.querySelector(`input[name="${name}"]:checked`);
  return c ? c.value : null;
}
function tv(id) { return (document.getElementById(id)?.value || '').trim(); }
function sv(id) { return document.getElementById(id)?.value || 'no'; }

function parse(raw) {
  if (!raw) return { lvl: null, label: 'Not reported' };
  const [lvl, ...rest] = raw.split('|');
  return { lvl, label: rest.join('|') };
}
function icon(lvl) {
  return lvl === 'ok' ? '✅' : lvl === 'err' ? '🔴' : lvl === 'warn' ? '🟡' : '⬜';
}
function isIssue(lvl) { return lvl === 'err' || lvl === 'warn'; }

function line(q, label, lvl, detail) {
  let s = `  ${icon(lvl)} ${q.padEnd(4)} ${label}\n`;
  if (detail) s += `         ↳ ${detail}\n`;
  return s;
}

/* ══════════════════════════════════════
   BUILD: PLATFORM email (Airflow)
══════════════════════════════════════ */
function buildPlatformEmail() {
  if (!rv('af1')) {
    alert('Please answer at least Q1 in the Airflow section before generating.');
    return null;
  }
  const date = tv('rdate') || now.toISOString().split('T')[0];
  const time = tv('rtime');
  const af1 = parse(rv('af1')), af2 = parse(rv('af2')), af3 = parse(rv('af3'));
  const afSS = sv('af-screenshot') === 'yes';
  const anyIssue = [af1,af2,af3].some(v => isIssue(v.lvl));

  const subject = anyIssue
    ? `[ACTION REQUIRED] TelcoScore Airflow Status — ${date} | Issues Detected`
    : `[ALL CLEAR] TelcoScore Airflow Status — ${date} | No Issues`;

  let body = `Hi Platform Team,\n\nPlease find below the TelcoScore L1 Airflow status check for ${date}${time ? ' at ' + time : ''}.\n\n`;
  body += `══════════════════════════════════════════════\n`;
  body += `  AIRFLOW JOBS (EDS Data Pipeline)\n`;
  body += `══════════════════════════════════════════════\n`;
  body += line('[Q1]', af1.label, af1.lvl, isIssue(af1.lvl) ? tv('af1-t') : '');
  body += line('[Q2]', af2.label, af2.lvl, isIssue(af2.lvl) ? tv('af2-t') : '');
  body += line('[Q3]', af3.label, af3.lvl, isIssue(af3.lvl) ? tv('af3-t') : '');
  body += `  📎 Screenshot: ${afSS ? 'Please find attached file/screenshot' : 'N/A'}\n\n`;
  body += `══════════════════════════════════════════════\n`;
  body += `  OVERALL: ${anyIssue ? '🔴 Issues detected. Please review.' : '✅ All clear.'}\n`;
  body += `══════════════════════════════════════════════\n\n`;
  body += `Kindly acknowledge receipt of this report.\n`;
  if (anyIssue) body += `Please coordinate on the flagged items above.\n`;
  body += `\nThank you,\nL1 Support — TelcoScore / EDS MS`;

  return { subject, body, to: EMAILS.platform, cc: '' };
}

/* ══════════════════════════════════════
   DB EDIT MODE
══════════════════════════════════════ */
let dbEditActive = false;
let customItemCounter = 100; // IDs for dynamically added items

function toggleDbEdit() {
  dbEditActive = !dbEditActive;
  const secBody = document.querySelector('#section-infra .sec-body');
  const btn = document.getElementById('db-edit-toggle');
  const gchatBtn = document.getElementById('gchat-send-btn');
  if (dbEditActive) {
    secBody.classList.add('db-edit-active');
    btn.classList.add('active');
    btn.textContent = 'Done Editing';
    document.getElementById('add-critical-row').style.display = 'flex';
    document.getElementById('add-health-row').style.display = 'flex';
    gchatBtn.disabled = true;
    gchatBtn.style.opacity = '0.5';
    gchatBtn.style.cursor = 'not-allowed';
  } else {
    secBody.classList.remove('db-edit-active');
    btn.classList.remove('active');
    btn.textContent = 'Edit Items';
    document.getElementById('add-critical-row').style.display = 'none';
    document.getElementById('add-health-row').style.display = 'none';
    renumberItems('critical-items-container', 'Critical Report');
    renumberItems('health-items-container', 'Health Check');
    gchatBtn.disabled = false;
    gchatBtn.style.opacity = '1';
    gchatBtn.style.cursor = 'pointer';
  }
}

/* Sync the visible label text when user types in the edit input */
function syncItemLabel(input, _unused) {
  const qlabel = input.closest('.qlabel');
  const textSpan = qlabel.querySelector('.item-label-text');
  // Find numbering prefix by looking at current text
  const currentText = textSpan.textContent;
  const numMatch = currentText.match(/^(\d+\.\s)/);
  const prefix = numMatch ? numMatch[1] : '';
  textSpan.textContent = prefix + input.value;
}

/* Renumber all items in a container after add/remove */
function renumberItems(containerId, _type) {
  const items = document.querySelectorAll(`#${containerId} .qrow`);
  items.forEach((row, i) => {
    const textSpan = row.querySelector('.item-label-text');
    const input = row.querySelector('.item-label-input');
    if (textSpan && input) {
      textSpan.textContent = `${i + 1}. ${input.value}`;
    }
  });
}

/* Remove an item row */
function removeDbItem(rowId, _name, section) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const container = section === 'critical' ? 'critical-items-container' : 'health-items-container';
  row.remove();
  renumberItems(container, section);
}

/* Add a new item to a subsection */
function addDbItem(section) {
  const inputId = `add-${section}-input`;
  const nameInput = document.getElementById(inputId);
  const name = nameInput.value.trim();
  if (!name) { nameInput.focus(); return; }

  const containerId = section === 'critical' ? 'critical-items-container' : 'health-items-container';
  const container = document.getElementById(containerId);
  const itemCount = container.querySelectorAll('.qrow').length + 1;
  const uid = `dyn${++customItemCounter}`;

  /* Determine radio options */
  let radioHTML = '';
  let placeholder = `Additional Notes for ${name}`;

  if (section === 'critical') {
    radioHTML = `
      <label><input type="radio" name="${uid}" value="sched|Scheduled" checked> Scheduled</label>
      <label><input type="radio" name="${uid}" value="prog|In-Progress"> In-Progress</label>
      <label><input type="radio" name="${uid}" value="ok|Completed"> Completed</label>`;
  } else {
    const typeEl = document.getElementById('add-health-type');
    const typeVal = typeEl ? typeEl.value : 'health-ok-alert';
    if (typeVal === 'health-success-fail') {
      radioHTML = `
        <label><input type="radio" name="${uid}" value="ok|Successful" checked> Successful</label>
        <label><input type="radio" name="${uid}" value="err|Failed"> Failed</label>`;
    } else if (typeVal === 'health-no-open') {
      radioHTML = `
        <label><input type="radio" name="${uid}" value="ok|No Open Issue" checked> No Open Issue</label>
        <label><input type="radio" name="${uid}" value="err|Open Issue"> Open Issue</label>`;
    } else {
      radioHTML = `
        <label><input type="radio" name="${uid}" value="ok|Healthy" checked> Healthy</label>
        <label><input type="radio" name="${uid}" value="err|With Alert"> With Alert</label>`;
    }
  }

  const div = document.createElement('div');
  div.className = 'qrow';
  div.id = `qrow-${uid}`;
  div.dataset.section = section;
  div.innerHTML = `
    <div class="qlabel">
      <span class="item-label-text">${itemCount}. ${name}</span>
      <input class="item-label-input" value="${name}" oninput="syncItemLabel(this)">
      <button class="item-remove-btn" onclick="removeDbItem('qrow-${uid}','${uid}','${section}')">✕ Remove</button>
    </div>
    <div class="radio-group">${radioHTML}</div>
    <div class="detail-row" id="${uid}-d">
      <textarea rows="2" id="${uid}-t" placeholder="${placeholder}"></textarea>
    </div>`;

  container.appendChild(div);

  /* Wire up detail toggle for new item */
  const triggers = section === 'critical' ? ['prog','sched'] : ['err'];
  div.querySelectorAll(`input[name="${uid}"]`).forEach(r => {
    r.addEventListener('change', function() {
      const lvl = this.value.split('|')[0];
      document.getElementById(`${uid}-d`).style.display =
        triggers.includes(lvl) ? 'flex' : 'none';
    });
  });

  nameInput.value = '';
  nameInput.focus();
}

/* ══════════════════════════════════════
   BUILD: INFRA GChat message (Database)
   Reads all items dynamically from DOM
══════════════════════════════════════ */
function buildInfraGChat() {
  const date = tv('rdate') || now.toISOString().split('T')[0];
  const time = tv('rtime');
  const dbSS = sv('db-screenshot') === 'yes';

  const statusIcon = (lvl) =>
    lvl === 'ok' ? '✅' : lvl === 'err' ? '🔴' : lvl === 'prog' ? '🔄' : '🕐';
  const isDbIssue  = (lvl) => lvl === 'err';
  const isNotDone  = (lvl) => lvl === 'prog' || lvl === 'sched';

  /* Collect all items from a container */
  function collectItems(containerId) {
    const rows = document.querySelectorAll(`#${containerId} .qrow`);
    return Array.from(rows).map(row => {
      const labelInput = row.querySelector('.item-label-input');
      const labelText  = row.querySelector('.item-label-text');
      const label = labelInput ? labelInput.value.trim() : labelText?.textContent.replace(/^\d+\.\s*/, '').trim() || '(unnamed)';
      // Find which radio is checked
      const radios = row.querySelectorAll('input[type=radio]');
      let parsedVal = { lvl: 'ok', label: 'Not reported' };
      radios.forEach(r => { if (r.checked) parsedVal = parse(r.value); });
      // Notes textarea — id ends in '-t'
      const textarea = row.querySelector('textarea');
      const note = textarea ? textarea.value.trim() : '';
      return { label, parsed: parsedVal, note };
    });
  }

  const criticalItems = collectItems('critical-items-container');
  const healthItems   = collectItems('health-items-container');
  const allItems      = [...criticalItems, ...healthItems];

  const anyIssue   = allItems.some(i => isDbIssue(i.parsed.lvl));
  const anyPending = criticalItems.some(i => isNotDone(i.parsed.lvl));

  const dbLine = (item) => {
    let s = `${statusIcon(item.parsed.lvl)} *${item.label}* — ${item.parsed.label}\n`;
    if (item.note) s += `   ↳ ${item.note}\n`;
    return s;
  };

  let msg = `EDS L1 Monitoring Health Checks ${date}${time ? ' at ' + time : ''}\n`;
  msg += `\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*CRITICAL REPORTS STATUS*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  criticalItems.forEach(item => { msg += dbLine(item); });
  msg += `\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*HEALTH CHECKS*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  healthItems.forEach(item => { msg += dbLine(item); });
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (anyIssue)        msg += `*OVERALL: 🔴 Issues detected. Please review.*\n`;
  else if (anyPending) msg += `*OVERALL: 🔄 Some items still in progress or scheduled.*\n`;
  else                 msg += `*OVERALL: ✅ All items completed. No issues.*\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  if (anyIssue) msg += `\nPlease coordinate on the flagged items above.`;
  msg += `\n\n— L1 Support, TelcoScore / EDS MS`;

  return { msg, anyIssue, anyPending };
}

/* ══════════════════════════════════════
   BUILD: WAKANDA email (Gateway + Partner Obs)
══════════════════════════════════════ */
function buildWakandaEmail() {
  if (!rv('gw1')) {
    alert('Please answer at least Q1 in the Gateway section before generating.');
    return null;
  }
  const date = tv('rdate') || now.toISOString().split('T')[0];
  const time = tv('rtime');

  const gw1 = parse(rv('gw1')), gw2 = parse(rv('gw2'));
  const gw3 = parse(rv('gw3')), gw4 = parse(rv('gw4'));
  const ap1status = rv('ap1-status') || 'ok';
  const ap2 = parse(rv('ap2')), ap3 = parse(rv('ap3'));
  const gwSS = sv('gw-screenshot') === 'yes';
  const apSS = sv('ap-screenshot') === 'yes';

  const selectedPartners = getSelectedPartners();
  const partnerNames = selectedPartners.length > 0 ? selectedPartners.join(', ') : 'None specified';

  const ap1Label = ap1status === 'ok'
    ? 'No partner-reported API errors via Apigee'
    : ap1status === 'err'
      ? `Partner(s) reporting API errors via Apigee — Affected: ${partnerNames}`
      : `Not yet confirmed with partners — Checking: ${partnerNames || 'TBD'}`;

  const gwIssue = [gw1,gw2,gw3,gw4].some(v => isIssue(v.lvl));
  const apIssue = ap1status !== 'ok' || isIssue(ap2.lvl) || isIssue(ap3.lvl);
  const anyIssue = gwIssue || apIssue;

  const subject = anyIssue
    ? `[ACTION REQUIRED] TelcoScore L1 Daily Status — ${date} | Issues Detected`
    : `[ALL CLEAR] TelcoScore L1 Daily Status — ${date} | No Issues`;

  /* Build recipient list */
  const ccList = [EMAILS.mynt];
  if (selectedPartners.includes('TS') && EMAILS.ts) ccList.push(EMAILS.ts);
  if (selectedPartners.includes('FS') && EMAILS.fs) ccList.push(EMAILS.fs);
  if (selectedPartners.includes('HC') && EMAILS.hc) ccList.push(EMAILS.hc);
  const cc = ccList.join(',');

  let body = `Hi Wakanda Team,\n\nPlease find below the TelcoScore L1 daily status check for ${date}${time ? ' at ' + time : ''}.\n\n`;

  body += `══════════════════════════════════════════════\n`;
  body += `  SECTION 1 — API GATEWAY (LB + 2 EC2)\n`;
  body += `  Scope: Globe / EDS MS\n`;
  body += `══════════════════════════════════════════════\n`;
  body += line('[Q1]', gw1.label, gw1.lvl, isIssue(gw1.lvl) ? tv('gw1-t') : '');
  body += line('[Q2]', gw2.label, gw2.lvl, isIssue(gw2.lvl) ? tv('gw2-t') : '');
  if (gw2.lvl === 'err') {
    body += `         ↳ ⚠️  ACTION FOR WAKANDA: Please increase available authentication token on Apigee side.\n`;
  }
  body += line('[Q3]', gw3.label, gw3.lvl, isIssue(gw3.lvl) ? tv('gw3-t') : '');
  if (isIssue(gw3.lvl)) {
    body += `         ↳ Note: If traffic is high — possible issue may originate from partner side.\n`;
  }
  body += line('[Q4]', gw4.label, gw4.lvl, isIssue(gw4.lvl) ? tv('gw4-t') : '');
  if (gw4.lvl === 'err') {
    body += `         ↳ Configured limits: creditRating-v1 = 600 calls/min | partners-mynt-v1 = 2400 calls/min\n`;
  }
  body += `  📎 Screenshot: ${gwSS ? 'Please find attached file/screenshot' : 'N/A'}\n\n`;

  body += `══════════════════════════════════════════════\n`;
  body += `  SECTION 2 — APIGEE / MYNT OBSERVATIONS\n`;
  body += `  Scope: Wakanda (for your action)\n`;
  body += `══════════════════════════════════════════════\n`;
  body += `  Note: Items below are observed by L1 but fall outside Globe/EDS scope.\n`;
  body += `  Wakanda team to investigate and take action accordingly.\n\n`;
  body += `  ${ap1status === 'ok' ? '✅' : ap1status === 'err' ? '🔴' : '⬜'} [Q1] ${ap1Label}\n`;
  if (ap1status !== 'ok' && tv('ap1-t')) {
    body += `         ↳ ${tv('ap1-t')}\n`;
  }
  body += line('[Q2]', ap2.label, ap2.lvl, isIssue(ap2.lvl) ? tv('ap2-t') : '');
  if (ap2.lvl === 'err') {
    body += `         ↳ Configured limits: creditRating-v1 = 600 calls/min | partners-mynt-v1 = 2400 calls/min\n`;
  }
  body += line('[Q3]', ap3.label, ap3.lvl, (isIssue(ap3.lvl) || ap3.lvl === 'ok') ? tv('ap3-t') : '');
  body += `  📎 Screenshot: ${apSS ? 'Please find attached file/screenshot' : 'N/A'}\n\n`;

  body += `══════════════════════════════════════════════\n`;
  body += `  OVERALL STATUS\n`;
  body += `══════════════════════════════════════════════\n`;
  body += `  Gateway (Globe/EDS): ${gwIssue ? '🔴 Issues detected — see Section 1 above' : '✅ All clear'}\n`;
  body += `  Partner (Apigee):    ${apIssue ? '🔴 Issues observed — see Section 2 above' : '✅ No issues observed'}\n`;
  if (selectedPartners.length > 0) {
    body += `  Affected partner(s): ${partnerNames}\n`;
  }
  body += `══════════════════════════════════════════════\n\n`;
  body += `Kindly acknowledge receipt of this report.\n`;
  if (anyIssue) body += `Please coordinate with the respective PICs on flagged items. Wakanda team to review Section 2 items.\n`;
  body += `\nThank you,\nL1 Support — TelcoScore / EDS MS`;

  return { subject, body, to: EMAILS.wakanda, cc };
}

/* ══════════════════════════════════════
   SHOW PREVIEW (Email)
══════════════════════════════════════ */
function showPreview(result) {
  if (!result) return;
  const { subject, body, to, cc } = result;
  const ccDisplay = cc
    ? cc.split(',').join(' · ')
    : '(none)';
  document.getElementById('prev-meta').innerHTML = `
    <div class="frow"><span class="fkey">To:</span><span class="fval">${to}</span></div>
    <div class="frow"><span class="fkey">CC:</span><span class="fval">${ccDisplay}</span></div>
    <div class="frow"><span class="fkey">Subject:</span><span class="fval">${subject}</span></div>`;
  document.getElementById('prev-body').textContent = body;
  document.getElementById('preview-type-badge').textContent = '✉️ Email Preview';
  const p = document.getElementById('preview');
  p.style.display = 'block';
  p.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════════════════════
   SHOW GCHAT PREVIEW
══════════════════════════════════════ */
function showGChatPreview(result) {
  if (!result) return;
  const { msg, anyIssue, anyPending } = result;

  const statusLabel = anyIssue
    ? '🔴 Issues Detected'
    : anyPending
      ? '🔄 In Progress'
      : '✅ All Clear';

  document.getElementById('prev-meta').innerHTML = `
    <div class="frow"><span class="fkey">Channel:</span><span class="fval">Infra Team — Google Chat</span></div>
    <div class="frow"><span class="fkey">Status:</span><span class="fval">${statusLabel}</span></div>
    <div class="frow"><span class="fkey">Format:</span><span class="fval">GChat message (bold via asterisks)</span></div>`;
  document.getElementById('prev-body').textContent = msg;
  document.getElementById('preview-type-badge').textContent = '💬 GChat Preview';
  const p = document.getElementById('preview');
  p.style.display = 'block';
  p.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════════════════════
   OPEN IN OUTLOOK
══════════════════════════════════════ */
function openOutlook(type) {
  let result;
  if (type === 'platform') result = buildPlatformEmail();
  else                     result = buildWakandaEmail();
  if (!result) return;
  showPreview(result);
  const { subject, body, to, cc } = result;
  let mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (cc) mailto += `&cc=${encodeURIComponent(cc)}`;
  window.location.href = mailto;
}

/* ══════════════════════════════════════
   SEND TO GCHAT (DB section)
   1. POST message via webhook
   2. Open GChat space in new tab
══════════════════════════════════════ */
async function sendToGChat() {
  const result = buildInfraGChat();
  if (!result) return;

  showGChatPreview(result);

  const btn = document.getElementById('gchat-send-btn');
  const statusEl = document.getElementById('infra-copy-ok');

  // Disable button while sending
  btn.disabled = true;
  btn.textContent = '⏳ Sending...';

  try {
    const response = await fetch(GCHAT.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: result.msg }),
    });

    if (response.ok) {
      // Success — open the GChat space
      window.open(GCHAT.spaceUrl, '_blank');

      btn.textContent = '✅ Sent!';
      statusEl.textContent = '✅ Message sent to GChat!';
      statusEl.style.color = '#1a7a40';
      statusEl.style.display = 'inline';

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<span class="gchat-icon">💬</span> Send to GChat';
        statusEl.style.display = 'none';
      }, 3000);
    } else {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }
  } catch (err) {
    console.error('GChat webhook error:', err);
    btn.textContent = '❌ Failed — check console';
    btn.style.background = 'linear-gradient(135deg, #e53935, #b71c1c)';
    statusEl.textContent = '❌ Send failed. Copied to clipboard instead.';
    statusEl.style.color = '#c0392b';
    statusEl.style.display = 'inline';

    // Fallback: copy to clipboard
    navigator.clipboard.writeText(result.msg).catch(() => {});

    setTimeout(() => {
      btn.disabled = false;
      btn.style.background = '';
      btn.innerHTML = '<span class="gchat-icon">💬</span> Send to GChat';
      statusEl.style.display = 'none';
    }, 4000);
  }
}

/* ══════════════════════════════════════
   COPY EMAIL
══════════════════════════════════════ */
function copyEmail(type) {
  let result;
  if (type === 'platform') result = buildPlatformEmail();
  else                     result = buildWakandaEmail();
  if (!result) return;
  showPreview(result);
  const { subject, body } = result;
  navigator.clipboard.writeText('Subject: ' + subject + '\n\n' + body).then(() => {
    const el = document.getElementById('copy-ok');
    el.style.display = 'inline';
    setTimeout(() => el.style.display = 'none', 2500);
  });
}

/* ── COPY PREVIEW FOOTER ── */
function doCopy() {
  const body = document.getElementById('prev-body').textContent;
  const badge = document.getElementById('preview-type-badge')?.textContent || '';
  const isGChat = badge.includes('GChat');

  let copyText;
  if (isGChat) {
    copyText = body;
  } else {
    const subj = document.querySelector('#prev-meta .frow:nth-child(3) .fval')?.textContent || '';
    copyText = 'Subject: ' + subj + '\n\n' + body;
  }

  navigator.clipboard.writeText(copyText).then(() => {
    const el = document.getElementById('copy-ok');
    el.style.display = 'inline';
    setTimeout(() => el.style.display = 'none', 2500);
  });
}

/* ── RESTORE DEFAULT DB ITEMS ── */
function restoreDefaultDbItems() {
  const criticalDefaults = [
    { id: 'db1', label: 'ADH Batch 1' },
    { id: 'db2', label: 'IN Summary' },
    { id: 'db3', label: 'New Delphi' },
    { id: 'db4', label: 'CWN Status' },
    { id: 'db5', label: 'VOC RDL Field Engineer' },
    { id: 'db6', label: 'Revenue Accounting Monthly Report (Day 1)' }
  ];

  const healthDefaults = [
    { id: 'db7', label: 'Snowflake Table Refresh' },
    { id: 'db8', label: 'Kafka Topics' },
    { id: 'db9', label: 'Kafka CDP Infra Monitoring' },
    { id: 'db10', label: 'Compute Infra Monitoring' },
    { id: 'db11', label: 'ADH CDC Status' },
    { id: 'db12', label: 'Other Open Issue' }
  ];

  /* Restore critical items */
  const criticalContainer = document.getElementById('critical-items-container');
  criticalDefaults.forEach((item, idx) => {
    let row = document.getElementById(`qrow-${item.id}`);
    if (!row) {
      const div = document.createElement('div');
      div.className = 'qrow';
      div.id = `qrow-${item.id}`;
      div.dataset.section = 'critical';
      div.innerHTML = `
        <div class="qlabel">
          <span class="item-label-text">${idx + 1}. ${item.label}</span>
          <input class="item-label-input" value="${item.label}" oninput="syncItemLabel(this,'${item.id}-label-text')">
          <button class="item-remove-btn" onclick="removeDbItem('qrow-${item.id}','${item.id}','critical')">✕ Remove</button>
        </div>
        <div class="radio-group">
          <label><input type="radio" name="${item.id}" value="sched|Scheduled" checked> Scheduled</label>
          <label><input type="radio" name="${item.id}" value="prog|In-Progress"> In-Progress</label>
          <label><input type="radio" name="${item.id}" value="ok|Completed"> Completed</label>
        </div>
        <div class="detail-row" id="${item.id}-d">
          <textarea rows="2" id="${item.id}-t" placeholder="Additional notes for ${item.label} (e.g. delayed, error encountered)"></textarea>
        </div>`;
      criticalContainer.appendChild(div);
      /* Wire up detail toggle for restored item */
      div.querySelectorAll(`input[name="${item.id}"]`).forEach(r => {
        r.addEventListener('change', function () {
          const detail = document.getElementById(item.id + '-d');
          if (detail) detail.style.display = this.checked && ['prog','sched'].includes(this.value.split('|')[0]) ? 'flex' : 'none';
        });
      });
    } else {
      /* Reset existing item to default state */
      row.querySelector('input[value="sched|Scheduled"]').checked = true;
      const textarea = row.querySelector('textarea');
      if (textarea) textarea.value = '';
      const detailRow = row.querySelector('.detail-row');
      if (detailRow) detailRow.style.display = 'none';
    }
  });

  /* Restore health items */
  const healthContainer = document.getElementById('health-items-container');
  const healthRadios = [
    { id: 'db7', options: [['ok|Successful', 'Successful'], ['err|Failed', 'Failed']] },
    { id: 'db8', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'db9', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'db10', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'db11', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'db12', options: [['ok|No Open Issue', 'No Open Issue'], ['err|Open Issue', 'Open Issue']] }
  ];

  healthDefaults.forEach((item, idx) => {
    let row = document.getElementById(`qrow-${item.id}`);
    if (!row) {
      const radioConfig = healthRadios[idx];
      let radioHTML = '';
      radioConfig.options.forEach(([val, label]) => {
        const checked = val.startsWith('ok') ? 'checked' : '';
        radioHTML += `<label><input type="radio" name="${item.id}" value="${val}" ${checked}> ${label}</label>`;
      });

      const placeholders = {
        db7: 'Which table(s) failed to refresh? Error message or time of failure?',
        db8: 'Which topics have issues? Describe the problem.',
        db9: 'Describe any anomalies or concerns.',
        db10: 'Describe any infrastructure issues.',
        db11: 'Describe the alert details.',
        db12: 'List any open issues and their status.'
      };

      const div = document.createElement('div');
      div.className = 'qrow';
      div.id = `qrow-${item.id}`;
      div.dataset.section = 'health';
      div.innerHTML = `
        <div class="qlabel">
          <span class="item-label-text">${idx + 1}. ${item.label}</span>
          <input class="item-label-input" value="${item.label}">
          <button class="item-remove-btn" onclick="removeDbItem('qrow-${item.id}','${item.id}','health')">✕ Remove</button>
        </div>
        <div class="radio-group">${radioHTML}</div>
        <div class="detail-row" id="${item.id}-d">
          <textarea rows="2" id="${item.id}-t" placeholder="${placeholders[item.id]}"></textarea>
        </div>`;
      healthContainer.appendChild(div);
      /* Wire up detail toggle for restored item */
      div.querySelectorAll(`input[name="${item.id}"]`).forEach(r => {
        r.addEventListener('change', function () {
          const detail = document.getElementById(item.id + '-d');
          if (detail) detail.style.display = this.checked && this.value.split('|')[0] === 'err' ? 'flex' : 'none';
        });
      });
    } else {
      /* Reset existing item to default state */
      row.querySelector('input[value^="ok"]').checked = true;
      const textarea = row.querySelector('textarea');
      if (textarea) textarea.value = '';
      const detailRow = row.querySelector('.detail-row');
      if (detailRow) detailRow.style.display = 'none';
    }
  });
}

/* ── RESET ── */
function resetAll() {
  document.querySelectorAll('input[type=radio]').forEach(r => { r.checked = r.defaultChecked; });
  document.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
  document.querySelectorAll('textarea').forEach(t => t.value = '');
  document.querySelectorAll('.detail-row').forEach(d => d.style.display = 'none');
  document.getElementById('preview').style.display = 'none';
  document.getElementById('partner-select-row').classList.remove('visible');
  document.getElementById('partner-recipient-preview').textContent = '';
  document.getElementById('wakanda-recipients-preview').textContent = 'Wakanda · MYNT';

  /* Exit edit mode if active */
  if (dbEditActive) { toggleDbEdit(); }

  /* Restore default DB items and remove any dynamic items */
  restoreDefaultDbItems();
  document.querySelectorAll('#critical-items-container .qrow[id^="qrow-dyn"]').forEach(r => r.remove());
  document.querySelectorAll('#health-items-container .qrow[id^="qrow-dyn"]').forEach(r => r.remove());
  renumberItems('critical-items-container', 'critical');
  renumberItems('health-items-container', 'health');

  ['af','gw','db','ap'].forEach(sec => {
    const noBtn = document.getElementById(sec + '-ss-no');
    const yesBtn = document.getElementById(sec + '-ss-yes');
    const val = document.getElementById(sec + '-screenshot');
    if (val) val.value = 'no';
    if (noBtn) noBtn.classList.add('active');
    if (yesBtn) yesBtn.classList.remove('active');
  });

  isTimeLive = true;
  isDateManual = false;
  updateLiveDateTime();

  switchSection('infra');
}