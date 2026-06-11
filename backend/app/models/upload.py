"""
Pydantic models for Upload-related API requests and responses.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ColumnInfo(BaseModel):
    name: str
    dtype: str           # pandas dtype string
    sql_type: str        # SQLite type: TEXT, INTEGER, REAL, DATE
    nullable: bool
    sample_values: list  # First 3 non-null values for context


class TableSchema(BaseModel):
    table_id: str
    table_name: str
    original_filename: str
    row_count: int
    column_count: int
    columns: list[ColumnInfo]
    created_at: datetime


class UploadResponse(BaseModel):
    success: bool
    message: str
    schema: Optional[TableSchema] = None


class TableListItem(BaseModel):
    table_id: str
    table_name: str
    original_filename: str
    row_count: int
    column_count: int
    created_at: datetime
