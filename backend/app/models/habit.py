from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    target_frequency = Column(String(50), default="daily", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="habits")
    records = relationship("HabitRecord", back_populates="habit", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Habit(id={self.id}, name='{self.name}', user_id={self.user_id})>"


class HabitRecord(Base):
    __tablename__ = "habit_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True)
    completed_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    habit = relationship("Habit", back_populates="records")

    # Enforce only one completion record per habit per day
    __table_args__ = (
        UniqueConstraint("habit_id", "completed_date", name="uq_habit_date"),
    )

    def __repr__(self):
        return f"<HabitRecord(id={self.id}, habit_id={self.habit_id}, completed_date={self.completed_date})>"
