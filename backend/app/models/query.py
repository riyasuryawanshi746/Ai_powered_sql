"""
Pydantic models for Query-related API requests and responses.
"""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class QueryRequest(BaseModel):
    table_id: str
    question: str


class ChartConfig(BaseModel):
    x_key: str
    y_key: str
    label_key: Optional[str] = None   # For pie charts: the label field


class QueryResponse(BaseModel):
    query_id: str
    table_name: str
    question: str
    sql: str
    results: list[dict[str, Any]]
    row_count: int
    chart_type: str                   # "bar" | "line" | "pie" | "scatter" | "none"
    chart_config: Optional[ChartConfig] = None
    insights: list[str]
    execution_time_ms: int
    error: Optional[str] = None


class QueryHistoryItem(BaseModel):
    query_id: str
    table_id: str
    table_name: str
    question: str
    sql: str
    chart_type: str
    row_count: int
    execution_time_ms: int
    created_at: datetime
    error: Optional[str] = None
