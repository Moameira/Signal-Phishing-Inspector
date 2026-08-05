/**
 * Phishing Detection Engine
 * -----------------------------------------
 * A weighted heuristic scorer that inspects an email (sender, subject,
 * body, links) and returns a 0-100 risk score plus a list of the specific
 * signals that were triggered, so the user always sees WHY, not just a number.
 *
 * This is designed to run in two places with zero changes:
 *   1. demo.html (standalone testing page)
 *   2. extension/content.js (live Gmail scanning)
 *
 * NOTE: this is a rules-based v1. It's transparent and fast, and gives us
 * a labeled baseline. The natural v2 upgrade is to train a small classifier
 * on top of these same features once we have real labeled data (see README).
 */

const KNOWN_BRANDS = [
  "paypal", "amazon", "apple", "microsoft", "google", "netflix", "facebook",
  "instagram", "bankofamerica", "wellsfargo", "chase", "americanexpress",
  "dhl", "fedex", "ups", "linkedin", "dropbox", "docusign", "irs", "ebay"
];

const URGENCY_PHRASES = [
  "verify your account", "account suspended", "act now", "immediate action",
  "your account will be closed", "unusual activity", "confirm your identity",
  "limited time", "click here immediately", "failure to respond",
  "final notice", "your account has been locked", "security alert",
  "update your payment", "unauthorized login", "within 24 hours",
  "within 48 hours", "avoid suspension", "restricted account"
];

const CREDENTIAL_HARVEST_PHRASES = [
  "enter your password", "confirm your password", "ssn", "social security number",
  "credit card number", "cvv", "verify your identity", "login to your account",
  "update your billing", "banking details", "wire transfer", "confirm your pin"
];

const URL_SHORTENERS = [
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
  "rebrand.ly", "cutt.ly"
];

const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com",
  "icloud.com", "mail.com", "gmx.com", "protonmail.com"
];

// --- small string utilities ---------------------------------------------

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function extractDomain(emailOrUrl) {
  try {
    if (emailOrUrl.includes("@")) {
      return emailOrUrl.split("@").pop().toLowerCase().trim().replace(/[>,;]/g, "");
    }
    const url = emailOrUrl.startsWith("http") ? emailOrUrl : "http://" + emailOrUrl;
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isIpAddress(host) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

function isPunycode(host) {
  return host.includes("xn--");
}

function extractUrls(text) {
  const matches = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  return matches;
}

// --- signal detectors -----------------------------------------------------
// Each returns { hit: bool, weight: number, label: string } when triggered.

function checkDisplayNameSpoof(fromHeader) {
  // e.g. "PayPal Support <security@totally-not-paypal.xyz>"
  const match = fromHeader.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
  if (!match) return null;
  const displayName = match[1].toLowerCase();
  const senderDomain = extractDomain(match[2]);
  for (const brand of KNOWN_BRANDS) {
    if (displayName.includes(brand) && senderDomain && !senderDomain.includes(brand)) {
      return {
        hit: true,
        weight: 28,
        label: `Display name says "${brand}" but the actual sending domain is "${senderDomain}"`
      };
    }
  }
  return null;
}

function checkTyposquatting(senderDomain) {
  if (!senderDomain) return null;
  const base = senderDomain.replace(/\.(com|net|org|xyz|info|co)$/, "");
  for (const brand of KNOWN_BRANDS) {
    if (base === brand) continue; // exact legit match
    const dist = levenshtein(base, brand);
    if (dist > 0 && dist <= 2 && Math.abs(base.length - brand.length) <= 2) {
      return {
        hit: true,
        weight: 30,
        label: `Sending domain "${senderDomain}" closely resembles "${brand}.com" (possible lookalike domain)`
      };
    }
  }
  return null;
}

function checkFreeEmailImpersonatingBrand(senderDomain, subject, body) {
  if (!FREE_EMAIL_DOMAINS.includes(senderDomain)) return null;
  const combined = (subject + " " + body).toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (combined.includes(brand)) {
      return {
        hit: true,
        weight: 18,
        label: `Sent from a free email provider (${senderDomain}) while referencing "${brand}" as if official`
      };
    }
  }
  return null;
}

function checkReplyToMismatch(fromDomain, replyToDomain) {
  if (!replyToDomain || !fromDomain) return null;
  if (replyToDomain !== fromDomain) {
    return {
      hit: true,
      weight: 15,
      label: `Reply-To domain ("${replyToDomain}") does not match the sender's domain ("${fromDomain}")`
    };
  }
  return null;
}

function checkUrgencyLanguage(text) {
  const lower = text.toLowerCase();
  const hits = URGENCY_PHRASES.filter(p => lower.includes(p));
  if (hits.length === 0) return null;
  return {
    hit: true,
    weight: Math.min(6 * hits.length, 22),
    label: `Uses urgency/pressure language (${hits.slice(0, 3).join(", ")}${hits.length > 3 ? ", ..." : ""})`
  };
}

function checkCredentialHarvesting(text) {
  const lower = text.toLowerCase();
  const hits = CREDENTIAL_HARVEST_PHRASES.filter(p => lower.includes(p));
  if (hits.length === 0) return null;
  return {
    hit: true,
    weight: Math.min(8 * hits.length, 26),
    label: `Asks for sensitive info or credentials (${hits.slice(0, 2).join(", ")}${hits.length > 2 ? ", ..." : ""})`
  };
}

function checkGenericGreeting(text) {
  const lower = text.toLowerCase();
  if (/\b(dear customer|dear user|dear valued customer|dear account holder|dear sir\/madam)\b/.test(lower)) {
    return {
      hit: true,
      weight: 8,
      label: `Uses a generic greeting instead of your name`
    };
  }
  return null;
}

function checkLinkTextMismatch(text) {
  // find patterns like: Click here (paypal.com) but href goes elsewhere isn't
  // available from plain text alone, so we approximate: any anchor-style
  // "text [actual-url]" pattern where a brand name appears in text but the
  // URL domain doesn't match.
  const urls = extractUrls(text);
  if (urls.length === 0) return null;

  for (const url of urls) {
    const domain = extractDomain(url);
    if (isIpAddress(domain)) {
      return {
        hit: true,
        weight: 25,
        label: `Contains a link that points to a raw IP address instead of a domain name`
      };
    }
    if (isPunycode(domain)) {
      return {
        hit: true,
        weight: 25,
        label: `Contains a link using punycode encoding (often used to fake familiar domains)`
      };
    }
    if (URL_SHORTENERS.some(s => domain.includes(s))) {
      return {
        hit: true,
        weight: 12,
        label: `Contains a shortened URL (${domain}), which hides the real destination`
      };
    }
    const base = domain.replace(/\.(com|net|org|xyz|info|co)$/, "");
    for (const brand of KNOWN_BRANDS) {
      const dist = levenshtein(base, brand);
      if (dist > 0 && dist <= 2 && Math.abs(base.length - brand.length) <= 2) {
        return {
          hit: true,
          weight: 27,
          label: `Contains a link to a lookalike domain ("${domain}" resembling "${brand}.com")`
        };
      }
    }
  }
  return null;
}

function checkAttachmentMention(text) {
  const lower = text.toLowerCase();
  if (/\.(exe|scr|js|vbs|bat|jar|hta)\b/.test(lower)) {
    return {
      hit: true,
      weight: 20,
      label: `References an attachment with a potentially dangerous file type`
    };
  }
  return null;
}

// --- main entry point -------------------------------------------------

/**
 * @param {Object} email
 * @param {string} email.from     - full From header, e.g. '"PayPal" <a@b.com>'
 * @param {string} email.replyTo  - Reply-To header (optional)
 * @param {string} email.subject
 * @param {string} email.body     - plain text body
 * @returns {{score: number, verdict: string, signals: Array<{label:string, weight:number}>}}
 */
function analyzeEmail({ from = "", replyTo = "", subject = "", body = "" }) {
  const fromDomain = extractDomain(from);
  const replyToDomain = replyTo ? extractDomain(replyTo) : "";
  const fullText = `${subject}\n${body}`;

  const checks = [
    checkDisplayNameSpoof(from),
    checkTyposquatting(fromDomain),
    checkFreeEmailImpersonatingBrand(fromDomain, subject, body),
    checkReplyToMismatch(fromDomain, replyToDomain),
    checkUrgencyLanguage(fullText),
    checkCredentialHarvesting(fullText),
    checkGenericGreeting(fullText),
    checkLinkTextMismatch(fullText),
    checkAttachmentMention(fullText)
  ].filter(Boolean);

  let score = checks.reduce((sum, c) => sum + c.weight, 0);
  score = Math.max(0, Math.min(100, score));

  let verdict = "Likely safe";
  if (score >= 70) verdict = "Very likely phishing";
  else if (score >= 40) verdict = "Suspicious";
  else if (score >= 20) verdict = "Low risk, minor flags";

  return {
    score,
    verdict,
    signals: checks
      .map(c => ({ label: c.label, weight: c.weight }))
      .sort((a, b) => b.weight - a.weight)
  };
}

// Export for both browser (extension/demo) and Node (testing) contexts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { analyzeEmail };
}
if (typeof window !== "undefined") {
  window.PhishingEngine = { analyzeEmail };
}
