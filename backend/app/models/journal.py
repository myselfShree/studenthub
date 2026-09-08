from sqlalchemy import Column, Integer, Date, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class DailyJournal(Base):
    __tablename__ = "daily_journals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_date = Column(Date, nullable=False, index=True)
    point_win = Column(Text, nullable=False, default="")
    point_insight = Column(Text, nullable=False, default="")
    point_improvement = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="journals")

    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="uq_user_journal_date"),
    )

    def __repr__(self):
        return f"<DailyJournal(id={self.id}, user_id={self.user_id}, date={self.entry_date})>"
