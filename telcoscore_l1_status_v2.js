/* ── GCHAT CONFIG ── */
const GCHAT = {
  webhook : 'https://chat.googleapis.com/v1/spaces/AAQAos2lyw8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=YRRGulOMHa--v35bF0PC0U9d2Z6shF5b4DRwrq9VYsY',
  spaceUrl: 'https://mail.google.com/mail/u/0/#chat/space/AAQAos2lyw8',
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
document.getElementById('rdate').value = now.toISOString().split('T')[0];
document.getElementById('rtime').value =
  now.getHours().toString().padStart(2,'0') + ':' +
  now.getMinutes().toString().padStart(2,'0') + ' PHT';

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
  db5: ['err'], db6: ['err'],
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
   BUILD: INFRA GChat message (Database)
══════════════════════════════════════ */
function buildInfraGChat() {
  if (!rv('db1')) {
    alert('Please fill in the Database section before generating.');
    return null;
  }
  const date = tv('rdate') || now.toISOString().split('T')[0];
  const time = tv('rtime');

  const db1 = parse(rv('db1')), db2 = parse(rv('db2'));
  const db3 = parse(rv('db3')), db4 = parse(rv('db4'));
  const db5 = parse(rv('db5')), db6 = parse(rv('db6'));
  const dbSS = sv('db-screenshot') === 'yes';

  const statusIcon = (lvl) =>
    lvl === 'ok' ? '✅' : lvl === 'err' ? '🔴' : lvl === 'prog' ? '🔄' : '🕐';

  const isDbIssue = (lvl) => lvl === 'err';
  const isNotDone = (lvl) => lvl === 'prog' || lvl === 'sched';

  const anyIssue = [db1,db2,db3,db4,db5,db6].some(v => isDbIssue(v.lvl));
  const anyPending = [db1,db2,db3,db4].some(v => isNotDone(v.lvl));

  const dbLine = (label, parsed, noteId) => {
    const ico = statusIcon(parsed.lvl);
    let s = `${ico} *${label}* — ${parsed.label}\n`;
    const note = tv(noteId);
    if (note) s += `   ↳ ${note}\n`;
    return s;
  };

 
  let msg = `Please find below the TelcoScore L1 DB health check ${date}${time ? ' at ' + time : ''}\n`;
  msg += `\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*BATCH / PIPELINE STATUS*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += dbLine('ADH Batch 1',  db1, 'db1-t');
  msg += dbLine('IN Summary',   db2, 'db2-t');
  msg += dbLine('New Delphi',   db3, 'db3-t');
  msg += dbLine('CWN Status',   db4, 'db4-t');
  msg += `\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*HEALTH CHECKS*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += dbLine('Kafka & ADH CDC',            db5, 'db5-t');
  msg += dbLine('Snowflake Ext. Table Refresh', db6, 'db6-t');
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (anyIssue)        msg += `*OVERALL: 🔴 Issues detected — please review.*\n`;
  else if (anyPending) msg += `*OVERALL: 🔄 Some items still in progress or scheduled.*\n`;
  else                 msg += `*OVERALL: ✅ All items completed — no issues.*\n`;

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `\nKindly acknowledge receipt of this report.`;
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

  ['af','gw','db','ap'].forEach(sec => {
    document.getElementById(sec + '-screenshot').value = 'no';
    document.getElementById(sec + '-ss-no').classList.add('active');
    document.getElementById(sec + '-ss-yes').classList.remove('active');
  });

  const n = new Date();
  document.getElementById('rdate').value = n.toISOString().split('T')[0];
  document.getElementById('rtime').value =
    n.getHours().toString().padStart(2,'0') + ':' +
    n.getMinutes().toString().padStart(2,'0') + ' PHT';

  switchSection('infra');
}