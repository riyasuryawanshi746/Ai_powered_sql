"""
SQL Service: validates and executes SQL queries against the SQLite database.
Enforces read-only access and serializes results to JSON-safe dicts.
"""
import time
import re
import math
from typing import Any

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_data_engine


# ─── SQL Safety Validation ────────────────────────────────────────────────────

# Blocked keywords that could mutate or destroy data
_BLOCKED_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|ATTACH|DETACH"
    r"|PRAGMA|VACUUM|REINDEX|ANALYZE|GRANT|REVOKE)\b",
    re.IGNORECASE,
)


def validate_sql(sql: str) -> tuple[bool, str]:
    """
    Check that a SQL query is safe to execute (SELECT-only).

    Returns (is_valid, error_message).
    """
    stripped = sql.strip()

    if not stripped:
        return False, "SQL query is empty."

    if not stripped.upper().startswith("SELECT"):
        return False, "Only SELECT queries are permitted."

    if _BLOCKED_KEYWORDS.search(stripped):
        return False, "Query contains forbidden keywords (INSERT, DROP, etc.)."

    # Check for multiple statements
    if ";" in stripped[:-1]:  # allow trailing semicolon
        return False, "Multiple SQL statements are not allowed."

    return True, ""


# ─── Result Serialization ─────────────────────────────────────────────────────

def _serialize_value(v: Any) -> Any:
    """Convert non-JSON-serializable types to Python native types."""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    if hasattr(v, "item"):  # numpy scalar
        return v.item()
    if hasattr(v, "isoformat"):  # datetime / date
        return v.isoformat()
    return v


def _rows_to_dicts(rows, keys: list[str]) -> list[dict[str, Any]]:
    return [
        {k: _serialize_value(row[i]) for i, k in enumerate(keys)}
        for row in rows
    ]


# ─── Execution ────────────────────────────────────────────────────────────────

def execute_sql(sql: str) -> tuple[list[dict[str, Any]], int, str | None]:
    """
    Execute a validated SQL query against the data engine.

    Returns:
        (results, execution_time_ms, error_message)
        - results: list of row dicts (empty on error)
        - execution_time_ms: query duration
        - error_message: None on success, string on failure
    """
    engine = get_data_engine()

    # Clean trailing semicolon
    clean_sql = sql.strip().rstrip(";")

    start = time.time()
    try:
        with engine.connect() as conn:
            result = conn.execute(text(clean_sql))
            keys = list(result.keys())
            rows = result.fetchmany(1000)  # cap at 1000 rows
            data = _rows_to_dicts(rows, keys)
        elapsed = int((time.time() - start) * 1000)
        return data, elapsed, None

    except SQLAlchemyError as e:
        elapsed = int((time.time() - start) * 1000)
        return [], elapsed, str(e)
    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        return [], elapsed, f"Unexpected error: {str(e)}"
