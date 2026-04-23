/* ── GCHAT CONFIG ── */
const GCHAT = {
  webhook : 'https://chat.googleapis.com/v1/spaces/AAAAj7UKkRU/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=pMhHx51QSXmtGMjqL9KaVz0h3hUn-DblyYCGWE8iISo',
  spaceUrl: 'https://chat.google.com/app/chat/AAAAj7UKkRU',
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

/* ── DETAIL TOGGLE ── */
const detailTriggers = {
  db1: ['prog','sched'], db2: ['prog','sched'], db3: ['prog','sched'], db4: ['prog','sched'],
  db5: ['prog','sched'], db6: ['prog','sched'], db7: ['prog','sched'],
  dh1: ['err'], dh2: ['err'], dh3: ['err'], dh4: ['err'], dh5: ['err'], dh6: ['err'],
  dh7: ['err']
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
/* ══════════════════════════════════════
   DB EDIT MODE
══════════════════════════════════════ */
let dbEditActive = false;
let customItemCounter = 100; 

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
   INFRA GChat message (Database)
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
      // Notes textarea, id ends in '-t'
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
    if (item.note && (isDbIssue(item.parsed.lvl) || isNotDone(item.parsed.lvl))) s += `   ↳ ${item.note}\n`;
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

  if (anyIssue)        msg += `*OVERALL: 🔴 Issues detected.*\n`;
  else if (anyPending) msg += `*OVERALL: 🔄 Some items still in progress or scheduled.*\n`;
  else                 msg += `*OVERALL: ✅ All items completed. No issues.*\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  if (anyIssue) msg += `\nFYI on the flagged items above.`;
  msg += `\n\n— L1 Support, EDS MS`;

  return { msg, anyIssue, anyPending };
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
   SEND TO GCHAT 
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
      // Success - open the GChat space
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

/* ── COPY PREVIEW FOOTER ── */
function doCopy() {
  const body = document.getElementById('prev-body').textContent;
  navigator.clipboard.writeText(body).then(() => {
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
    
    // UNCOMMENT BELOW
    //,
    //{ id: 'db7', label: 'New Item' }
    

  ];

  const healthDefaults = [
    { id: 'dh1', label: 'Snowflake Table Refresh' },
    { id: 'dh2', label: 'Kafka Topics' },
    { id: 'dh3', label: 'Kafka CDP Infra Monitoring' },
    { id: 'dh4', label: 'Compute Infra Monitoring' },
    { id: 'dh5', label: 'ADH CDC Status' },
    { id: 'dh6', label: 'Other Open Issue' }
    
    // UNCOMMENT BELOW
    //,
    // { id: 'dh7', label: 'New Item' }
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
    { id: 'dh1', options: [['ok|Successful', 'Successful'], ['err|Failed', 'Failed']] },
    { id: 'dh2', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'dh3', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'dh4', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'dh5', options: [['ok|Healthy', 'Healthy'], ['err|With Alert', 'With Alert']] },
    { id: 'dh6', options: [['ok|No Open Issue', 'No Open Issue'], ['err|Open Issue', 'Open Issue']] }
    
    // UNCOMMENT BELOW
    // ,
    // { id: 'dh7', options: [['ok|Successful', 'Successful'], ['err|Failed', 'Failed']] }
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
        dh1: 'Which table(s) failed to refresh? Error message or time of failure?',
        dh2: 'Which topics have issues? Describe the problem.',
        dh3: 'Describe any anomalies or concerns.',
        dh4: 'Describe any infrastructure issues.',
        dh5: 'Describe the alert details.',
        dh6: 'List any open issues and their status.'
        // UNCOMMENT BELOW
        // ,
        // dh7: 'Describe any issues or concerns.'
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

  /* Exit edit mode if active */
  if (dbEditActive) { toggleDbEdit(); }

  /* Restore default DB items and remove any dynamic items */
  restoreDefaultDbItems();
  document.querySelectorAll('#critical-items-container .qrow[id^="qrow-dyn"]').forEach(r => r.remove());
  document.querySelectorAll('#health-items-container .qrow[id^="qrow-dyn"]').forEach(r => r.remove());
  renumberItems('critical-items-container', 'critical');
  renumberItems('health-items-container', 'health');

  const noBtn = document.getElementById('db-ss-no');
  const yesBtn = document.getElementById('db-ss-yes');
  const val = document.getElementById('db-screenshot');
  if (val) val.value = 'no';
  if (noBtn) noBtn.classList.add('active');
  if (yesBtn) yesBtn.classList.remove('active');

  isTimeLive = true;
  isDateManual = false;
  updateLiveDateTime();
}