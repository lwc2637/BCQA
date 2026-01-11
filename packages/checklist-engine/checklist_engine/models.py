from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, constr, validator
from datetime import date

# -- Enums & Types --

AnswerType = Literal["tri_state"]
DefaultState = Literal["unanswered", "na"]
BucketOrdering = Literal["as_defined", "alphabetical"]
FieldType = Literal["text", "number", "date", "select", "multiselect", "boolean"]
Severity = Literal["minor", "major", "critical"]
ValidationTypeBeforeDeclare = Literal["required_questions_answered", "required_media_present"]
ValidationTypeBeforeExport = Literal["declaration_signed"]

# -- Sub-Models --

class TemplateMeta(BaseModel):
    template_id: str = Field(..., min_length=3)
    name: str = Field(..., min_length=3)
    version: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    solution: str = Field(..., min_length=1)
    created_at: date
    owner: Optional[str] = None
    description: Optional[str] = None

class UIHints(BaseModel):
    default_bucket_icon: str
    bucket_ordering: BucketOrdering

class RunField(BaseModel):
    field_id: str
    label: str
    type: FieldType
    required: bool
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None

class MediaRule(BaseModel):
    required: bool
    min_count: Optional[int] = None
    capture_hint: Optional[str] = None

class QuestionMedia(BaseModel):
    pre: Optional[MediaRule] = None
    post: Optional[MediaRule] = None
    required_on_fail: Optional[bool] = None

class Question(BaseModel):
    question_id: str
    text: str
    answer_type: AnswerType
    required: bool
    default_state: Optional[DefaultState] = None
    help_text: Optional[str] = None
    tags: Optional[List[str]] = None
    require_comment_on: Optional[List[Literal["fail"]]] = None
    severity: Optional[Severity] = None
    media: Optional[QuestionMedia] = None

class Group(BaseModel):
    group_id: str
    title: str
    order: float
    questions: List[Question]

class Bucket(BaseModel):
    bucket_id: str
    title: str
    icon: Optional[str] = None
    order: float
    groups: List[Group]

class DeclarationConfig(BaseModel):
    required: bool
    statement: str
    signature_required: bool

class ValidatorBeforeDeclare(BaseModel):
    type: ValidationTypeBeforeDeclare
    bucket_ids: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class ValidatorBeforeExport(BaseModel):
    type: ValidationTypeBeforeExport

class ValidationConfig(BaseModel):
    before_declare: List[ValidatorBeforeDeclare]
    before_export: List[ValidatorBeforeExport]

# -- Root Model --

class ChecklistTemplate(BaseModel):
    schema_version: Literal["bcqa.template.v1"]
    meta: TemplateMeta
    ui: UIHints
    run_fields: List[RunField] = []
    buckets: List[Bucket]
    declaration: DeclarationConfig
    validation: ValidationConfig
