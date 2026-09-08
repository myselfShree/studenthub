from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#3B82F6", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="subjects")
    notes = relationship("Note", back_populates="subject", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="subject")

    def __repr__(self):
        return f"<Subject(id={self.id}, name='{self.name}', user_id={self.user_id})>"
