"""
CSV Service: reads uploaded CSV files using Pandas,
infers column types, and creates SQLite tables dynamically.
"""
import pandas as pd
import re
import json
import uuid
import os
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_data_engine
from app.models.upload import ColumnInfo, TableSchema


# ─── Type Mapping ─────────────────────────────────────────────────────────────

def _infer_sql_type(pandas_dtype: str, series: pd.Series) -> str:
    """Map a pandas dtype to a SQLite affinity type."""
    dtype_str = str(pandas_dtype)
    if "int" in dtype_str:
        return "INTEGER"
    if "float" in dtype_str:
        return "REAL"
    if "datetime" in dtype_str or "date" in dtype_str:
        return "TEXT"  # SQLite stores dates as TEXT
    # Try to detect date-like string columns
    if dtype_str == "object":
        sample = series.dropna().head(5).astype(str)
        date_pattern = re.compile(r"\d{4}[-/]\d{2}[-/]\d{2}")
        if sample.apply(lambda v: bool(date_pattern.match(v))).all():
            return "TEXT"  # date stored as TEXT in SQLite
    return "TEXT"


def _sanitize_table_name(filename: str) -> str:
    """Convert a filename like 'My Sales 2024.csv' → 'my_sales_2024'."""
    stem = os.path.splitext(filename)[0]
    name = re.sub(r"[^a-zA-Z0-9_]", "_", stem).lower()
    name = re.sub(r"_+", "_", name).strip("_")
    if name[0].isdigit():
        name = "tbl_" + name
    return name


def _sanitize_column_name(col: str) -> str:
    """Normalize column names to safe SQL identifiers."""
    col = re.sub(r"[^a-zA-Z0-9_]", "_", str(col)).lower()
    col = re.sub(r"_+", "_", col).strip("_")
    if col[0].isdigit():
        col = "col_" + col
    return col


# ─── Main Service ─────────────────────────────────────────────────────────────

def ingest_csv(file_path: str, original_filename: str, db: Session) -> TableSchema:
    """
    Read a CSV file, create a SQLite table, and return the schema.

    Steps:
    1. Read CSV with Pandas (auto-detect separator and encoding)
    2. Clean column names
    3. Infer SQL types for each column
    4. Write data into SQLite (replace if exists)
    5. Return structured schema
    """
    # ── 1. Read CSV ──────────────────────────────────────────────────────────
    try:
        df = pd.read_csv(file_path, encoding="utf-8", sep=None, engine="python")
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding="latin-1", sep=None, engine="python")

    if df.empty:
        raise ValueError("CSV file is empty or could not be parsed.")

    # ── 2. Sanitize columns ──────────────────────────────────────────────────
    original_columns = df.columns.tolist()
    sanitized = {col: _sanitize_column_name(col) for col in original_columns}
    # Avoid duplicate sanitized names
    seen: dict[str, int] = {}
    final_cols: dict[str, str] = {}
    for orig, san in sanitized.items():
        if san in seen:
            seen[san] += 1
            san = f"{san}_{seen[san]}"
        else:
            seen[san] = 0
        final_cols[orig] = san

    df.rename(columns=final_cols, inplace=True)

    # ── 3. Generate unique table name ────────────────────────────────────────
    base_name = _sanitize_table_name(original_filename)
    # Add a short uuid suffix to avoid collisions
    table_name = f"{base_name}_{uuid.uuid4().hex[:6]}"
    table_id = str(uuid.uuid4())

    # ── 4. Build column info ─────────────────────────────────────────────────
    columns: list[ColumnInfo] = []
    for col in df.columns:
        dtype = df[col].dtype
        sql_type = _infer_sql_type(str(dtype), df[col])
        sample_values = df[col].dropna().head(3).tolist()
        # Convert numpy types to native Python for JSON serialization
        sample_values = [
            v.item() if hasattr(v, "item") else v for v in sample_values
        ]
        columns.append(
            ColumnInfo(
                name=col,
                dtype=str(dtype),
                sql_type=sql_type,
                nullable=bool(df[col].isnull().any()),
                sample_values=sample_values,
            )
        )

    # ── 5. Write to SQLite ───────────────────────────────────────────────────
    data_engine = get_data_engine()
    df.to_sql(table_name, data_engine, if_exists="replace", index=False)

    # ── 6. Save metadata ─────────────────────────────────────────────────────
    schema_json = json.dumps([col.model_dump() for col in columns])
    from app.database import UploadedTable
    record = UploadedTable(
        id=table_id,
        original_filename=original_filename,
        table_name=table_name,
        row_count=len(df),
        column_count=len(df.columns),
        schema_json=schema_json,
    )
    db.add(record)
    db.commit()

    return TableSchema(
        table_id=table_id,
        table_name=table_name,
        original_filename=original_filename,
        row_count=len(df),
        column_count=len(df.columns),
        columns=columns,
        created_at=datetime.utcnow(),
    )


def get_schema_from_db(table_id: str, db: Session) -> TableSchema | None:
    """Retrieve a stored schema by table_id."""
    from app.database import UploadedTable
    record = db.query(UploadedTable).filter(UploadedTable.id == table_id).first()
    if not record:
        return None
    columns = [ColumnInfo(**c) for c in json.loads(record.schema_json)]
    return TableSchema(
        table_id=record.id,
        table_name=record.table_name,
        original_filename=record.original_filename,
        row_count=record.row_count,
        column_count=record.column_count,
        columns=columns,
        created_at=record.created_at,
    )
