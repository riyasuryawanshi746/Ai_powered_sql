"""
Query Router: handles the full NL → SQL → Execute → Insights pipeline.
"""
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db, QueryHistory, UploadedTable
from app.models.query import QueryRequest, QueryResponse, ChartConfig
from app.models.upload import ColumnInfo
from app.services.gemini_service import generate_sql, generate_insights
from app.services.sql_service import validate_sql, execute_sql
from app.utils.chart_selector import select_chart

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse)
def run_query(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Full pipeline:
    1. Load schema from DB
    2. Send schema + question to Gemini → get SQL
    3. Validate SQL
    4. Execute SQL against SQLite
    5. Select chart type from results
    6. Generate AI insights
    7. Save to history
    8. Return everything
    """
    query_id = str(uuid.uuid4())

    # ── 1. Load table metadata ────────────────────────────────────────────────
    table_record = (
        db.query(UploadedTable).filter(UploadedTable.id == request.table_id).first()
    )
    if not table_record:
        raise HTTPException(status_code=404, detail="Table not found. Please upload a CSV first.")

    columns = [ColumnInfo(**c) for c in json.loads(table_record.schema_json)]

    # ── 2. Generate SQL via Gemini ────────────────────────────────────────────
    try:
        sql = generate_sql(table_record.table_name, columns, request.question)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # ── 3. Validate SQL ───────────────────────────────────────────────────────
    is_valid, validation_error = validate_sql(sql)
    if not is_valid:
        # Save failed query to history
        _save_history(
            db, query_id, request.table_id, table_record.table_name,
            request.question, sql, [], "none", None, [], 0,
            error=f"SQL validation failed: {validation_error}",
        )
        raise HTTPException(
            status_code=422,
            detail=f"Generated SQL failed validation: {validation_error}\nSQL: {sql}",
        )

    # ── 4. Execute SQL ────────────────────────────────────────────────────────
    results, exec_time_ms, exec_error = execute_sql(sql)

    if exec_error:
        _save_history(
            db, query_id, request.table_id, table_record.table_name,
            request.question, sql, [], "none", None, [], exec_time_ms,
            error=exec_error,
        )
        raise HTTPException(
            status_code=422,
            detail=f"SQL execution error: {exec_error}",
        )

    # ── 5. Select chart type ──────────────────────────────────────────────────
    chart_type, chart_config = select_chart(results)

    # ── 6. Generate insights ──────────────────────────────────────────────────
    insights = generate_insights(request.question, sql, results, table_record.table_name)

    # ── 7. Save to history ────────────────────────────────────────────────────
    chart_config_json = chart_config.model_dump() if chart_config else None
    _save_history(
        db, query_id, request.table_id, table_record.table_name,
        request.question, sql, results, chart_type, chart_config_json,
        insights, exec_time_ms,
    )

    # ── 8. Return response ────────────────────────────────────────────────────
    return QueryResponse(
        query_id=query_id,
        table_name=table_record.table_name,
        question=request.question,
        sql=sql,
        results=results,
        row_count=len(results),
        chart_type=chart_type,
        chart_config=chart_config,
        insights=insights,
        execution_time_ms=exec_time_ms,
    )


def _save_history(
    db: Session,
    query_id: str,
    table_id: str,
    table_name: str,
    question: str,
    sql: str,
    results: list,
    chart_type: str,
    chart_config: dict | None,
    insights: list,
    exec_time_ms: int,
    error: str | None = None,
):
    """Persist a query to the history table."""
    record = QueryHistory(
        id=query_id,
        table_id=table_id,
        table_name=table_name,
        question=question,
        sql_query=sql,
        results_json=json.dumps(results[:100], default=str),  # store first 100 rows
        chart_type=chart_type,
        chart_config_json=json.dumps(chart_config) if chart_config else None,
        insights_json=json.dumps(insights),
        execution_time_ms=exec_time_ms,
        error=error,
        created_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
