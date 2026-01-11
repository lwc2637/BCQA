# docs/stages/STAGE_3_PHOTOS_STORAGE.md
# Stage 3 — Photos + Storage

## Objective
Capture and store pre/post photos per question.

## Scope
- Camera capture modal (mobile-first)
- Presigned uploads to MinIO
- Worker generates thumbnails
- Photo display per question (pre/post)

## Acceptance criteria
- Engineer can attach pre and post photos to any question
- Photos persist and load quickly (thumbnail first)
- Upload retry works on flaky networks
