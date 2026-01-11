# docs/04_UI_SYSTEM.md
# UI System — BCQA

## UX goals
- One-handed mobile operation
- Minimal taps to capture evidence
- Clear progress + “what’s missing” guidance
- Premium feel: subtle motion, clean typography, calm spacing

---

## Stack
- Next.js + Tailwind + shadcn/ui
- Framer Motion (animations)
- TanStack Query (server-state)
- React Hook Form + Zod (forms)

---

## App IA (information architecture)
- Home
- Create checklist
- Checklist dashboard (bucket tiles)
- Bucket detail (questions)
- Declaration
- Export

---

## Core components
- AppShell (top bar, content)
- ThemeToggle (light/dark, persisted)
- TileCard (icon, title, completion %, badges)
- ProgressRing (overall progress)
- QuestionRow:
  - Pass/Fail/N/A
  - comment (required on fail)
  - Pre/Post photo actions + thumbnails
- PhotoCaptureModal:
  - camera preview
  - retake/use
  - upload progress and retry
- OfflineBanner + SyncStatus
- Toasts (success/error)

---

## Navigation map
- /                   Home
- /runs/new           Create checklist
- /runs/:id           Bucket tiles
- /runs/:id/b/:bucketId  Bucket detail
- /runs/:id/declaration  Declaration
- /runs/:id/export       Export + artifacts

---

## Motion guidelines (tasteful)
- Page transitions: fade + slight slide (150–250ms)
- Tile press: slight scale (0.98)
- Progress ring: animate value changes
- Respect `prefers-reduced-motion`

---

## Accessibility
- Hit targets ≥ 44px
- High contrast in both themes
- Keyboard navigable for desktop reviewers
md
Copy code
