# Privacy

Signal runs locally in your browser.

## What the extension reads

When you open an email in Gmail, the extension reads visible message details from the page:

- sender
- subject
- message body text

It uses that text to calculate a phishing risk score and show the signals it found.

## What the extension sends

Nothing.

Signal does not send email content, sender details, subjects, links, scores, or usage data to any server.

## Storage

Signal does not currently store email content, scan results, or settings.

## Permissions

The extension only requests access to Gmail pages:

```text
https://mail.google.com/*
```

This permission is needed so the content script can read the open email and show the floating badge.

## Current status

This is an early testing build. The phishing score is based on transparent rules, not a guarantee that an email is safe or unsafe.
