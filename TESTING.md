# Signal Testing Log

Use this file when manually testing the Chrome extension in Gmail.

## Chrome Extension Test

- Date:
- Chrome version:
- Gmail type: Personal / Google Workspace
- Extension loaded without errors: Yes / No
- Signal badge appears after opening an email: Yes / No
- Badge updates when switching emails: Yes / No
- Badge can be closed: Yes / No

## Emails Checked

| Email type | Expected result | Actual score | Notes |
| --- | --- | ---: | --- |
| Normal personal email | Likely safe |  |  |
| Newsletter or receipt | Likely safe / Low risk |  |  |
| Password reset/security alert | Low risk / Suspicious |  |  |
| Obvious phishing sample | Very likely phishing |  |  |
| Suspicious link or shortened URL | Suspicious / Very likely phishing |  |  |

## Selector Issues

If the badge does not appear or does not update, inspect the open Gmail message and note what changed.

- Sender selector issue:
- Subject selector issue:
- Body selector issue:

## Accuracy Notes

### False Positives

Legitimate emails that scored too high:

- 

### False Negatives

Suspicious emails that scored too low:

- 

## Next Fixes

- 
