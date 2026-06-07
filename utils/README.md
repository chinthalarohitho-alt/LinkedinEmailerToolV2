# utils/

Shared utility modules used by server services.

## Files

| File | Purpose |
|------|---------|
| `SentEmailManager.js` | Tracks which emails have already been sent to prevent duplicates. Uses an in-memory cache backed by `Data/SentEmails.json`. Entries expire after 96 hours. Provides `addEmail()`, `addEmails()` (batch), `isAlreadySent()`, `getSentList()`, and `cleanup()`. |
