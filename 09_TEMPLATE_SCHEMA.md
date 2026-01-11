09_TEMPLATE_SCHEMA.md

# BCQA Checklist Template Schema (v1)

This document defines the **template JSON format** used by BCQA to render:
- Bucket tiles (dashboard)
- Groups (sub-headings inside buckets)
- Questions (Pass/Fail/N/A)
- Photo requirements (pre/post rules)
- Validation gates (declare/export)

Design intent: **add new checklists by adding a new JSON file**, not by changing app code.

---

## 1) Design goals

- **Stable IDs**: every question has a stable `question_id` within a template version.
- **Versioned + immutable**: templates are never edited in-place once released; publish a new version/template.
- **UI-friendly**: templates contain ordering + icon hints (but never drive logic).
- **Validation-first**: rules are explicit; backend enforces them.
- **Extensible**: templates can later add run metadata fields, richer answer types, and new validators.

---

## 2) File location + naming

Recommended repo location:



packages/templates/
cel_das_v1.json
cel_dot_v1.json
<future_template_id>.json


Naming convention:
- `template_id` should be globally unique.
- Suggested: `{programme}_{solution}_v{major}` e.g. `cel_das_v1`, `cel_dot_v1`.

---

## 3) High-level structure

A template is composed of:
- `meta`: identity + versioning
- `ui`: high-level UI hints
- `run_fields`: optional extra metadata fields for “Create Checklist” (template-specific)
- `buckets`: dashboard tiles
- `declaration`: statement + signature requirements
- `validation`: gates before declare/export

---

## 4) Minimal example (readable)

```json
{
  "schema_version": "bcqa.template.v1",
  "meta": {
    "template_id": "cel_das_v1",
    "name": "CELs — DAS",
    "version": "1.0.0",
    "category": "IBS",
    "solution": "DAS",
    "created_at": "2026-01-10",
    "owner": "EE/BT",
    "description": "BCQA checklist for Ericsson IBS DAS deployments."
  },
  "ui": {
    "default_bucket_icon": "clipboard-check",
    "bucket_ordering": "as_defined"
  },
  "run_fields": [],
  "buckets": [
    {
      "bucket_id": "mer_signage_security",
      "title": "MER Signage, Security & Access",
      "icon": "door-closed",
      "order": 10,
      "groups": [
        {
          "group_id": "mer_door",
          "title": "MER Door",
          "order": 10,
          "questions": [
            {
              "question_id": "Q-0001",
              "text": "The MER Door Signage is installed and correct",
              "answer_type": "tri_state",
              "required": true,
              "require_comment_on": ["fail"],
              "media": {
                "pre":  { "required": false },
                "post": { "required": true, "min_count": 1, "capture_hint": "Include the full sign and door frame." },
                "required_on_fail": true
              }
            }
          ]
        }
      ]
    }
  ],
  "declaration": {
    "required": true,
    "statement": "I confirm this checklist is accurate and photos represent the installation at the time of the visit.",
    "signature_required": true
  },
  "validation": {
    "before_declare": [
      { "type": "required_questions_answered" },
      { "type": "required_media_present" }
    ],
    "before_export": [
      { "type": "declaration_signed" }
    ]
  }
}

5) Field breakdown (full)
5.1 Root fields
Field	Type	Required	Notes
schema_version	string	✅	Always bcqa.template.v1
meta	object	✅	Identity + versioning
ui	object	✅	UI hints only
run_fields	array	✅	Optional extra run fields (can be empty)
buckets	array	✅	Bucket tiles
declaration	object	✅	Sign-off settings
validation	object	✅	Gate rules
5.2 meta
Field	Type	Required	Notes
template_id	string	✅	Immutable identifier, e.g. cel_das_v1
name	string	✅	Shown to users
version	string	✅	Semver recommended (e.g. 1.0.0)
category	string	✅	e.g. IBS
solution	string	✅	e.g. DAS, DOT
created_at	string (date)	✅	ISO date
owner	string	❌	Team/Org
description	string	❌	Optional help text
5.3 ui (hints only)
Field	Type	Required	Notes
default_bucket_icon	string	✅	Used when bucket has no icon
bucket_ordering	string	✅	as_defined or alphabetical

Icon values should be from an internal registry (e.g., lucide names):

door-closed, server, battery-charging, wifi, shield-check

5.4 run_fields (template-specific run metadata)

BCQA has global run fields (P-Ref, Engineer, Bands, AP count, dates, supplier, etc).
run_fields is for template extras (optional in v1; powerful in v1.1+).

Each run field:

Field	Type	Required	Notes
field_id	string	✅	Stable snake_case
label	string	✅	UI label
type	string	✅	text, number, date, select, multiselect, boolean
required	boolean	✅	Required to create run
options	array	❌	For select types
placeholder	string	❌	
help_text	string	❌	
5.5 buckets

A bucket maps to a dashboard tile.

Field	Type	Required	Notes
bucket_id	string	✅	Stable id (slug)
title	string	✅	Tile title
icon	string	❌	Falls back to ui.default_bucket_icon
order	number	✅	Sorting
groups	array	✅	Sub-sections
5.6 groups

Groups are headings inside a bucket (perfect for your “Equipment” headings).

Field	Type	Required	Notes
group_id	string	✅	Stable id
title	string	✅	Heading in UI/PDF
order	number	✅	Sorting
questions	array	✅	Items
5.7 questions
Field	Type	Required	Notes
question_id	string	✅	Stable ID (do not renumber once released)
text	string	✅	Question text
answer_type	string	✅	v1 supports tri_state
required	boolean	✅	Must be answered before declaration
default_state	string	❌	unanswered (default) or na
help_text	string	❌	Short hint for consistent evidence capture
tags	array	❌	e.g. ["labelling","power"]
require_comment_on	array	❌	e.g. ["fail"]
media	object	❌	Pre/post photo rules
severity	string	❌	minor, major, critical (future reporting)
v1 answer_type: tri_state

Allowed states:

pass

fail

na

unanswered (internal default)

5.8 media (photo requirements)
"media": {
  "pre":  { "required": false, "min_count": 0, "capture_hint": "Optional: show before state" },
  "post": { "required": true,  "min_count": 1, "capture_hint": "Include the label and nearby reference points" },
  "required_on_fail": true
}

Field	Type	Required	Notes
pre	object	❌	Rule for pre-install photos
post	object	❌	Rule for post-install photos
required_on_fail	boolean	❌	If true, require photos when answer is fail

pre / post objects:

Field	Type	Required	Notes
required	boolean	✅	If true, photos required regardless of pass/fail
min_count	number	❌	Default 1 when required=true
capture_hint	string	❌	Text shown near camera button
6) Validation system (server authoritative)

Validation must be enforced server-side (UI can mirror).

6.1 validation.before_declare

Runs when user tries to sign declaration.

Supported validators (v1):

required_questions_answered

required_media_present

Optional scoping (safe to include now, implement later):

bucket_ids: limit validation scope

tags: validate only tagged questions

6.2 validation.before_export

Runs when user tries to export.

Supported validator (v1):

declaration_signed

7) Declaration block
"declaration": {
  "required": true,
  "statement": "I confirm ...",
  "signature_required": true
}

Field	Type	Required	Notes
required	boolean	✅	Strongly recommended true
statement	string	✅	Displayed + embedded in PDF
signature_required	boolean	✅	Capture SVG signature if true
8) Mapping from the Excel-derived DAS/DOT question sets

Your source structure maps naturally:

Area → bucket.title

Equipment → group.title

Question → question.text

Recommended deterministic IDs:

bucket_id: slugify(area)

group_id: slugify(area + "_" + equipment)

question_id: sequential in stable order: Q-0001, Q-0002, …

Rules:

Once a template is released, never renumber question_id.

Additions: append new question IDs at the end or publish a new version (v2).

9) Full JSON Schema (Draft 2020-12)

Use this to validate templates during import/upload.

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://bcqa.local/schemas/bcqa.template.v1.json",
  "title": "BCQA Checklist Template v1",
  "type": "object",
  "required": ["schema_version", "meta", "ui", "run_fields", "buckets", "declaration", "validation"],
  "properties": {
    "schema_version": { "type": "string", "const": "bcqa.template.v1" },

    "meta": {
      "type": "object",
      "required": ["template_id", "name", "version", "category", "solution", "created_at"],
      "properties": {
        "template_id": { "type": "string", "minLength": 3 },
        "name": { "type": "string", "minLength": 3 },
        "version": { "type": "string", "minLength": 1 },
        "category": { "type": "string", "minLength": 1 },
        "solution": { "type": "string", "minLength": 1 },
        "created_at": { "type": "string", "format": "date" },
        "owner": { "type": "string" },
        "description": { "type": "string" }
      },
      "additionalProperties": false
    },

    "ui": {
      "type": "object",
      "required": ["default_bucket_icon", "bucket_ordering"],
      "properties": {
        "default_bucket_icon": { "type": "string" },
        "bucket_ordering": { "type": "string", "enum": ["as_defined", "alphabetical"] }
      },
      "additionalProperties": false
    },

    "run_fields": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["field_id", "label", "type", "required"],
        "properties": {
          "field_id": { "type": "string" },
          "label": { "type": "string" },
          "type": { "type": "string", "enum": ["text", "number", "date", "select", "multiselect", "boolean"] },
          "required": { "type": "boolean" },
          "options": { "type": "array", "items": { "type": "string" } },
          "placeholder": { "type": "string" },
          "help_text": { "type": "string" }
        },
        "additionalProperties": false
      }
    },

    "buckets": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["bucket_id", "title", "order", "groups"],
        "properties": {
          "bucket_id": { "type": "string" },
          "title": { "type": "string" },
          "icon": { "type": "string" },
          "order": { "type": "number" },

          "groups": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "object",
              "required": ["group_id", "title", "order", "questions"],
              "properties": {
                "group_id": { "type": "string" },
                "title": { "type": "string" },
                "order": { "type": "number" },

                "questions": {
                  "type": "array",
                  "minItems": 1,
                  "items": {
                    "type": "object",
                    "required": ["question_id", "text", "answer_type", "required"],
                    "properties": {
                      "question_id": { "type": "string" },
                      "text": { "type": "string" },
                      "answer_type": { "type": "string", "enum": ["tri_state"] },
                      "required": { "type": "boolean" },
                      "default_state": { "type": "string", "enum": ["unanswered", "na"] },
                      "help_text": { "type": "string" },
                      "tags": { "type": "array", "items": { "type": "string" } },
                      "require_comment_on": { "type": "array", "items": { "type": "string", "enum": ["fail"] } },
                      "severity": { "type": "string", "enum": ["minor", "major", "critical"] },

                      "media": {
                        "type": "object",
                        "properties": {
                          "pre": {
                            "type": "object",
                            "required": ["required"],
                            "properties": {
                              "required": { "type": "boolean" },
                              "min_count": { "type": "number" },
                              "capture_hint": { "type": "string" }
                            },
                            "additionalProperties": false
                          },
                          "post": {
                            "type": "object",
                            "required": ["required"],
                            "properties": {
                              "required": { "type": "boolean" },
                              "min_count": { "type": "number" },
                              "capture_hint": { "type": "string" }
                            },
                            "additionalProperties": false
                          },
                          "required_on_fail": { "type": "boolean" }
                        },
                        "additionalProperties": false
                      }
                    },
                    "additionalProperties": false
                  }
                }
              },
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false
      }
    },

    "declaration": {
      "type": "object",
      "required": ["required", "statement", "signature_required"],
      "properties": {
        "required": { "type": "boolean" },
        "statement": { "type": "string" },
        "signature_required": { "type": "boolean" }
      },
      "additionalProperties": false
    },

    "validation": {
      "type": "object",
      "required": ["before_declare", "before_export"],
      "properties": {
        "before_declare": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["type"],
            "properties": {
              "type": { "type": "string", "enum": ["required_questions_answered", "required_media_present"] },
              "bucket_ids": { "type": "array", "items": { "type": "string" } },
              "tags": { "type": "array", "items": { "type": "string" } }
            },
            "additionalProperties": false
          }
        },
        "before_export": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["type"],
            "properties": {
              "type": { "type": "string", "enum": ["declaration_signed"] }
            },
            "additionalProperties": false
          }
        }
      },
      "additionalProperties": false
    }
  },

  "additionalProperties": false
}

10) Interpretation rules (how BCQA computes progress + gates)
Bucket completion

A question is “completed” if state != unanswered.

Bucket completion % = completed / total questions in bucket.

Required questions gate

Any question with required=true must not be unanswered before declaration.

Comment-on-fail

If answer is fail and require_comment_on contains fail, comment is required.

Required media gate

If media.post.required=true, ensure min_count post photos exist.

If required_on_fail=true and state is fail, enforce required photos even if not required on pass.

Export gate

If declaration.required=true, export requires a signed declaration.

11) Future extensions (v2 without breaking v1)

Add answer types: text, number, multi_select

Add pdf block: appendix settings, page layout hints

Add advanced validators via JSONLogic

Add per-question example photo overlays (to standardise evidence quality)


---

To wire this into the build plan, update **Stage 1** to include:
- “Implement template schema validation at startup (and on admin upload later).”
- “Fail fast if template JSON doesn’t validate.”

Next sensible step: I can also give you a **canonical icon registry list** (bucket → icon mapping) so the DAS/DOT templates look consistent from day one.
