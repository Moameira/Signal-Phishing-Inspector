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


## Roadmap (in priority order)

1. **Verify & fix selectors against live Gmail** — the most urgent thing before this is usable at all.
2. **Add a labeled dataset** (e.g. public phishing corpora + a sample of your own inbox) to measure real accuracy — right now the scoring weights are hand-tuned, not calibrated against real data.
3. **Swap/augment the rules engine with a small classifier** (e.g. logistic regression or a lightweight LLM call) trained on the same features, once you have labeled data — keeps the explainability, improves accuracy on emails that don't match the hand-written rules.
4. **Outlook version** — same `engine.js`, different content script for Outlook Web's DOM.
5. **Decide the business model** — free extension + paid team/API tier is the most common path here (e.g. free for individuals, paid for small-business inboxes at scale).
