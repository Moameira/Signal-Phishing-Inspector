/**
 * Signal — Gmail content script
 * -----------------------------------------
 * IMPORTANT / HONEST NOTE FOR THE BUILDER (you):
 * Gmail's DOM uses obfuscated, frequently-changing class names (.gD, .hP,
 * .a3s, etc). These selectors are the ones commonly relied on by other
 * open-source Gmail extensions as of early 2026, but Gmail can and does
 * change them. If the badge stops updating, open an email, right-click the
 * subject line -> Inspect, and update SELECTORS below to match.
 *
 * This is intentionally built as a floating badge (not inline-injected into
 * Gmail's header) because that's far more resilient to markup changes and
 * won't break Gmail's own layout if a selector goes stale.
 */

const SELECTORS = {
  senderSpan: 'span.gD',        // has [email] and [name] attributes
  subject: 'h2.hP',
  body: 'div.a3s.aiL'
};

let lastSignature = null;
let badgeEl = null;

function ensureBadge() {
  if (badgeEl) return badgeEl;
  badgeEl = document.createElement('div');
  badgeEl.id = 'signal-badge';
  badgeEl.innerHTML = `
    <div class="signal-badge-header">
      <span class="signal-dot"></span>
      <span class="signal-title">Signal</span>
      <button class="signal-close" title="Hide">&times;</button>
    </div>
    <div class="signal-score-row">
      <span class="signal-score">--</span>
      <span class="signal-verdict">Waiting for an open email...</span>
    </div>
    <div class="signal-list"></div>
  `;
  document.body.appendChild(badgeEl);
  badgeEl.querySelector('.signal-close').addEventListener('click', () => {
    badgeEl.style.display = 'none';
  });
  return badgeEl;
}

function readOpenEmail() {
  const subjectEl = document.querySelector(SELECTORS.subject);
  const senderEls = document.querySelectorAll(SELECTORS.senderSpan);
  const bodyEls = document.querySelectorAll(SELECTORS.body);

  if (!subjectEl || senderEls.length === 0 || bodyEls.length === 0) return null;

  // Take the last message in the thread (the one most likely expanded/read)
  const lastSender = senderEls[senderEls.length - 1];
  const lastBody = bodyEls[bodyEls.length - 1];

  const name = lastSender.getAttribute('name') || '';
  const email = lastSender.getAttribute('email') || '';
  const from = `"${name}" <${email}>`;
  const subject = subjectEl.textContent || '';
  const body = lastBody.textContent || '';

  return { from, replyTo: '', subject, body };
}

function updateBadge() {
  const email = readOpenEmail();
  const badge = ensureBadge();

  if (!email) {
    badge.querySelector('.signal-score').textContent = '--';
    badge.querySelector('.signal-verdict').textContent = 'Open an email to scan it';
    badge.querySelector('.signal-list').innerHTML = '';
    badge.className = '';
    return;
  }

  const signature = email.from + email.subject;
  if (signature === lastSignature) return; // avoid re-render spam
  lastSignature = signature;

  const result = window.PhishingEngine.analyzeEmail(email);
  const { score, verdict, signals } = result;

  let riskClass = 'safe';
  if (score >= 70) riskClass = 'danger';
  else if (score >= 20) riskClass = 'caution';

  badge.className = riskClass;
  badge.querySelector('.signal-score').textContent = score;
  badge.querySelector('.signal-verdict').textContent = verdict;
  badge.querySelector('.signal-list').innerHTML = signals.length
    ? signals.map(s => `<div class="signal-row"><span>${escapeHtml(s.label)}</span><span class="w">+${s.weight}</span></div>`).join('')
    : '<div class="signal-row empty">No suspicious signals detected</div>';
  badge.style.display = 'block';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Gmail is a single-page app — watch for DOM changes instead of navigation events
const observer = new MutationObserver(debounce(updateBadge, 400));
observer.observe(document.body, { childList: true, subtree: true });

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Initial pass
setTimeout(updateBadge, 1000);
