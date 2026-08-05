const assert = require('assert');
const { analyzeEmail } = require('./engine');

const phishing = analyzeEmail({
  from: '"PayPal Support" <security@paypa1-verify.xyz>',
  replyTo: 'noreply@some-other-domain.ru',
  subject: 'URGENT: Your account will be closed - verify your account now',
  body: 'Dear Customer, we detected unusual activity. Please confirm your identity within 24 hours by clicking here: http://192.168.10.5/login and enter your password to avoid suspension.'
});

assert(
  phishing.score >= 70,
  `Expected phishing sample to score at least 70, got ${phishing.score}`
);
assert.strictEqual(phishing.verdict, 'Very likely phishing');
assert(
  phishing.signals.length >= 4,
  `Expected phishing sample to trigger several signals, got ${phishing.signals.length}`
);

const legitimate = analyzeEmail({
  from: '"Sarah from the team" <sarah@mycompany.com>',
  replyTo: 'sarah@mycompany.com',
  subject: 'Notes from our call today',
  body: 'Hi! Thanks for the great conversation earlier. I attached the summary doc, let me know if you have questions.'
});

assert(
  legitimate.score <= 10,
  `Expected legitimate sample to stay low risk, got ${legitimate.score}`
);
assert.strictEqual(legitimate.verdict, 'Likely safe');
assert.strictEqual(legitimate.signals.length, 0);

const freeEmailBrandImpersonation = analyzeEmail({
  from: '"Account Team" <support@gmail.com>',
  subject: 'Amazon billing update',
  body: 'Please update your billing details.'
});

assert(
  freeEmailBrandImpersonation.score >= 20,
  `Expected brand impersonation from free email to be flagged, got ${freeEmailBrandImpersonation.score}`
);

console.log('All engine checks passed.');
