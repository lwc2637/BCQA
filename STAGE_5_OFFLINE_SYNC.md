# docs/stages/STAGE_5_OFFLINE_SYNC.md
# Stage 5 — Offline Sync

## Objective
Enable meaningful work offline and sync later.

## Scope
- IndexedDB cache for templates/runs/answers
- Local photo blob storage + sync queue
- Conflict-safe sync strategy
- Clear sync status UX

## Acceptance criteria
- Complete run offline → later sync without data loss
- No duplicated answers/media created during sync
- UI clearly shows local vs cloud state
