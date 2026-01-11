from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from uuid import UUID

class RunCreate(BaseModel):
    template_id: str
    p_ref: str
    site_name: str
    engineer_name: str
    contractor_name: Optional[str] = None
    supplier_name: Optional[str] = None
    visit_date: date
    tech_bands: List[Union[int, dict]]
    ap_count: int
    address: Optional[str] = None

class RunUpdate(BaseModel):
    template_id: Optional[str] = None
    site_name: Optional[str] = None
    p_ref: Optional[str] = None
    engineer_name: Optional[str] = None
    contractor_name: Optional[str] = None
    supplier_name: Optional[str] = None
    visit_date: Optional[date] = None
    tech_bands: Optional[List[Union[int, dict]]] = None
    ap_count: Optional[int] = None
    address: Optional[str] = None

class RunResponse(RunCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None

class PhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    created_at: datetime

class AnswerCreate(BaseModel):
    question_id: str
    value: Optional[str] = None # pass, fail, na
    comment: Optional[str] = None

class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_id: str
    value: Optional[str] = None
    comment: Optional[str] = None
    photos: List[PhotoResponse] = []
    updated_at: Optional[datetime] = None

class ExportDeclarationItem(BaseModel):
    id: str
    label: str

class ExportRequest(BaseModel):
    declaration_checks: List[ExportDeclarationItem] = []

class ExportResponse(BaseModel):
    pdf_url: str
