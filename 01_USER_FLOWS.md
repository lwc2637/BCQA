# docs/01_USER_FLOWS.md
# User Flows — BCQA

## Core flow
**Create → Capture evidence → Declare → Export**

---

## Flow 1: Home → Start a new checklist
1. User lands on **Home**
2. Presses **New BCQA Checklist**
3. Completes **Create Checklist** form (metadata)
4. Presses **Save & Next**
5. Lands on **Checklist Dashboard** (bucket tiles)

### Home requirements
- Light/Dark toggle (persisted)
- Recent runs list with status chips (Draft / In Progress / Submitted / Exported)
- Offline indicator + sync status

---

## Flow 2: Create checklist (metadata)
Fields:
- Template type: **DAS** or **DOT**
- Site: site name/code, P-Ref, address (optional), notes (optional)
- People: engineer (prefill), contractor/supplier (optional)
- Dates: visit date (required), install start/end (optional)
- Technology: 1800 / 2600 / 3500 (multi-select)
- AP count: integer (required)

Validation (MVP):
- Require template type, P-Ref, engineer name, visit date, AP count

---

## Flow 3: Checklist Dashboard (bucket tiles)
The dashboard shows **buckets** derived from the template.
Each tile shows:
- Icon + bucket name
- Completion % (answered / total)
- Optional badge: required photos missing

Navigation:
- Tap tile → bucket detail
- Sticky footer: progress ring + “Declaration” shortcut

---

## Flow 4: Bucket detail (questions)
Each question row:
- Pass / Fail / N/A
- Comment (required on Fail)
- Photos: Pre and Post (requirements per template rule)

UX:
- Default: scroll list
- Quick “Next unanswered” action
- One-tap add photo (pre/post)

---

## Flow 5: Declaration (gated)
Declaration includes:
- Statement text
- Name (auto) + date (auto)
- Signature capture (SVG)

Gate rules:
- Cannot sign unless required answers/photos exist
- Signing sets status to **Submitted**
- Unlocks **Export PDF**

---

## Flow 6: Export PDF
- User presses Export
- Backend queues a job (worker)
- UI shows progress and produces a download link
- PDF artifact stored and re-downloadable