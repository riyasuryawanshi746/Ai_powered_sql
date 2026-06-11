"""
History Router: retrieve and delete query history.
"""
import json

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db, QueryHistory
from app.models.query import QueryHistoryItem, QueryResponse, ChartConfig

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history", response_model=list[QueryHistoryItem])
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    """Get query history, newest first."""
    records = (
        db.query(QueryHistory)
        .order_by(QueryHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        QueryHistoryItem(
            query_id=r.id,
            table_id=r.table_id,
            table_name=r.table_name,
            question=r.question,
            sql=r.sql_query,
            chart_type=r.chart_type or "none",
            row_count=len(json.loads(r.results_json)) if r.results_json else 0,
            execution_time_ms=r.execution_time_ms or 0,
            created_at=r.created_at,
            error=r.error,
        )
        for r in records
    ]


@router.get("/history/{query_id}", response_model=QueryResponse)
def get_history_item(query_id: str, db: Session = Depends(get_db)):
    """Get full details of a specific historical query."""
    r = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Query not found.")

    results = json.loads(r.results_json) if r.results_json else []
    chart_config_data = json.loads(r.chart_config_json) if r.chart_config_json else None
    chart_config = ChartConfig(**chart_config_data) if chart_config_data else None
    insights = json.loads(r.insights_json) if r.insights_json else []

    return QueryResponse(
        query_id=r.id,
        table_name=r.table_name,
        question=r.question,
        sql=r.sql_query,
        results=results,
        row_count=len(results),
        chart_type=r.chart_type or "none",
        chart_config=chart_config,
        insights=insights,
        execution_time_ms=r.execution_time_ms or 0,
        error=r.error,
    )


@router.delete("/history/{query_id}")
def delete_history_item(query_id: str, db: Session = Depends(get_db)):
    """Delete a specific query from history."""
    r = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Query not found.")
    db.delete(r)
    db.commit()
    return {"success": True, "message": "Query deleted."}
