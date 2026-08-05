# Signal — Phishing Inspector

A weighted heuristic engine that scores emails for phishing risk (0–100%) with a plain-English explanation of every signal it found — not just a black-box number.

## What's in here

- **`engine.js`** — the detection brain. Pure JS, no dependencies, works in browser or Node. This is what you'd swap for a trained ML model later.
- **`demo.html`** — paste an email's From/Subject/Body, see the live score. Open this directly in a browser to test the engine.
- **`extension/`** — a Chrome extension (Manifest V3) that reads whatever email is currently open in Gmail and shows a floating risk badge, bottom-right.

## Try the demo right now

Just open `demo.html` in any browser (double-click it, or drag into a browser tab). Click "phishing example" or "legit example" to see it in action, or paste your own suspicious email.

## Install the extension (for testing)

1. Open Chrome → `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Open Gmail, open any email — the badge appears bottom-right

## Known limitations (be honest with yourself about these before showing anyone)

1. **Gmail's DOM selectors are fragile.** `content.js` uses class names (`.gD`, `.hP`, `.a3s`) that other open-source extensions commonly rely on, but Gmail changes its markup without notice. If the badge stops updating, right-click the subject line in Gmail → Inspect → find the new class names → update `SELECTORS` in `content.js`.
2. **No Reply-To detection from the Gmail UI.** Reply-To isn't shown in Gmail's normal view (only via "Show original"), so that signal is currently unused in the live extension — it *does* work in the demo page where you can paste headers manually.
3. **Rules-based, not ML.** This catches classic phishing patterns (lookalike domains, urgency language, IP-based links) but a well-crafted spear-phishing email with no obvious red flags will score low. That's expected for v1.
4. **Not tested against Gmail's live production DOM yet** — I built this without live network access, so the selectors are informed best-guesses, not verified against today's actual Gmail HTML. Testing on real Gmail is the very next step.

## Roadmap (in priority order)

1. **Verify & fix selectors against live Gmail** — the most urgent thing before this is usable at all.
2. **Add a labeled dataset** (e.g. public phishing corpora + a sample of your own inbox) to measure real accuracy — right now the scoring weights are hand-tuned, not calibrated against real data.
3. **Swap/augment the rules engine with a small classifier** (e.g. logistic regression or a lightweight LLM call) trained on the same features, once you have labeled data — keeps the explainability, improves accuracy on emails that don't match the hand-written rules.
4. **Outlook version** — same `engine.js`, different content script for Outlook Web's DOM.
5. **Decide the business model** — free extension + paid team/API tier is the most common path here (e.g. free for individuals, paid for small-business inboxes at scale).
