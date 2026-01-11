# docs/06_OFFLINE_SYNC.md
# Offline + Sync — BCQA

## Why
Engineers will be in low-signal environments (basements, plant rooms, roofs). BCQA must not lose work.

---

## v1.0 (offline-aware)
- PWA caching for core UI + templates
- API retries with exponential backoff
- Visible offline/sync status

---

## v1.1 (offline-capable)
Local storage:
- IndexedDB for:
  - run metadata
  - answers
  - pending media blobs
- Cache template definitions

Sync queue:
- Answers: idempotent PUT upsert
- Media:
  1) capture → store blob locally
  2) when online: presign → upload → complete

Conflict handling:
- Answers: last-write-wins (updated_at)
- Maintain conflict log (debug/audit)

Background sync:
- Service Worker background sync where supported
- Otherwise: sync on app resume + network regained

---

## UX requirements
- Banner: “Offline — saving locally”
- Counter: “X items pending sync”
- Manual “Sync now” button
- Never hide failure: show actionable errors
md
Copy code
