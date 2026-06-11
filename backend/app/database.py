"""
SQLAlchemy database setup.
Manages both the metadata SQLite DB and dynamic user data tables.
"""
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid

from app.config import get_settings

settings = get_settings()

# Main metadata engine (tracks uploads + history)
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── ORM Models ───────────────────────────────────────────────────────────────

class UploadedTable(Base):
    """Tracks every CSV file that has been uploaded and ingested."""
    __tablename__ = "uploaded_tables"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String, nullable=False)
    table_name = Column(String, nullable=False, unique=True)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    schema_json = Column(Text, nullable=False)          # JSON: list of column defs
    created_at = Column(DateTime, default=datetime.utcnow)


class QueryHistory(Base):
    """Tracks every NL → SQL query that was executed."""
    __tablename__ = "query_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    table_id = Column(String, nullable=False)           # FK → uploaded_tables.id
    table_name = Column(String, nullable=False)
    question = Column(Text, nullable=False)
    sql_query = Column(Text, nullable=False)
    results_json = Column(Text, nullable=True)          # JSON: list of row dicts
    chart_type = Column(String, nullable=True)
    chart_config_json = Column(Text, nullable=True)     # JSON: chart axis config
    insights_json = Column(Text, nullable=True)         # JSON: list of insight strings
    execution_time_ms = Column(Integer, default=0)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def create_tables():
    """Create all metadata tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency: yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_data_engine():
    """
    Returns the same engine used for user CSV data tables.
    In production you might use a separate DB per user.
    """
    return engine
