# docs/00_MISSION.md
# Project BCQA — Mission

## One-line mission
Build **BCQA**, a **mobile-first** web app (PWA) that helps engineers capture **high-quality pre/post installation photo evidence** and structured QA answers for IBS deployments, then exports a clean, audit-friendly **PDF report**.

## Primary users
- **Field engineers** performing BCQA walkdowns (DAS or DOT installs)
- **QA / audit reviewers** consuming exported PDF evidence packs
- **Programme / supplier management** tracking completion and issues (later)

## Problem statement
Photo evidence and QA notes are often inconsistent: wrong angles, missing labels, unclear “before/after”, and hard-to-compare reports. BCQA standardises capture and produces defensible outputs.

## Success criteria (MVP)
- Engineer can create a checklist run, answer all questions, capture required photos, sign a declaration, and export a PDF.
- Same app supports **DAS** and **DOT** via **template-driven checklists** (no hardcoding).
- Works smoothly on mobile browsers; feels “app-like”.

## Design principles
1. **Mobile-first, fast, offline-aware**
2. **Template-driven** (add new checklists later)
3. **Evidence-first** (photos + comments-on-fail + declaration gate)
4. **Auditability** (stable question IDs per template version; immutable exports)
5. **Delight where it matters** (UI/animations), **boring where it must be** (data/security)

## Non-goals (for MVP)
- Complex enterprise RBAC/SSO (later)
- Supplier dashboards / analytics (later)
- Computer vision defect detection (later)

## Key deliverables
- PWA UI: Home → Create → Buckets → Questions → Declaration → Export
- API + DB + storage in Docker Compose
- Templates: initial DAS and DOT checklists
- PDF export pipeline (server-side generation with embedded photos)

## Glossary
- **Checklist Template**: versioned JSON definition of buckets + questions + rules
- **Checklist Run**: a user’s instance of a template completed for a specific site/job
- **Media Asset**: stored photo (pre/post) linked to a question + run
- **Declaration**: sign-off required before export
