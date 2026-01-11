from sqlalchemy import Column, String, Integer, Date, JSON, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from .database import Base

class ChecklistRun(Base):
    __tablename__ = "checklist_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(String, nullable=False)
    status = Column(String, default="draft", nullable=False)
    p_ref = Column(String, nullable=False)
    site_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    engineer_name = Column(String, nullable=False)
    contractor_name = Column(String, nullable=True)
    supplier_name = Column(String, nullable=True)
    visit_date = Column(Date, nullable=False)
    tech_bands = Column(JSON, nullable=False) # List[int]
    ap_count = Column(Integer, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    answers = relationship("ChecklistAnswer", back_populates="run", cascade="all, delete-orphan")

class ChecklistAnswer(Base):
    __tablename__ = "checklist_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("checklist_runs.id"), nullable=False)
    question_id = Column(String, nullable=False)
    value = Column(String, nullable=True) # "pass", "fail", "na"
    comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    run = relationship("ChecklistRun", back_populates="answers")
    photos = relationship("ChecklistPhoto", back_populates="answer", cascade="all, delete-orphan")

class ChecklistPhoto(Base):
    __tablename__ = "checklist_photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    answer_id = Column(UUID(as_uuid=True), ForeignKey("checklist_answers.id"), nullable=False)
    url = Column(String, nullable=False)
    file_path = Column(String, nullable=False) # Local path for deletion
    thumbnail_url = Column(String, nullable=True)
    caption = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    answer = relationship("ChecklistAnswer", back_populates="photos")
