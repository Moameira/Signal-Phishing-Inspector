# Release Checklist

Use this before calling the project ready for a demo or public preview.

## Local Checks

- [ ] Run `npm test`
- [ ] Run `npm run evaluate`
- [ ] Open `demo.html` and test both sample emails
- [ ] Load the unpacked extension in Chrome
- [ ] Open Gmail and confirm the badge appears
- [ ] Confirm the badge updates when switching emails
- [ ] Fill out `TESTING.md`

## GitHub Checks

- [ ] README explains how to run the demo
- [ ] README explains how to load the Chrome extension
- [ ] Privacy note is present
- [ ] Known limitations are honest and current
- [ ] Roadmap matches the next real work

## Chrome Web Store Prep

- [ ] Add extension icons
- [ ] Add screenshots
- [ ] Write a short store description
- [ ] Verify privacy policy requirements
- [ ] Test with multiple Gmail accounts
- [ ] Decide whether this is private testing, unlisted, or public

## Accuracy Prep

- [ ] Add more labeled phishing examples to `data/sample-emails.json`
- [ ] Add more legitimate examples to `data/sample-emails.json`
- [ ] Review false positives
- [ ] Review false negatives
- [ ] Tune weights only after adding enough examples
