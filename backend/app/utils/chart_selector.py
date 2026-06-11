"""
Chart Selector: automatically determines the best chart type
for a given query result set based on column types and cardinality.
"""
from typing import Any, Optional
from app.models.query import ChartConfig


def _is_numeric(values: list) -> bool:
    """Check if a column's values are primarily numeric."""
    non_null = [v for v in values if v is not None]
    if not non_null:
        return False
    try:
        [float(v) for v in non_null[:10]]
        return True
    except (ValueError, TypeError):
        return False


def _is_date_like(values: list) -> bool:
    """Heuristic: check if values look like dates."""
    import re
    pattern = re.compile(r"\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4}")
    non_null = [str(v) for v in values if v is not None]
    if not non_null:
        return False
    matches = sum(1 for v in non_null[:10] if pattern.match(v))
    return matches >= len(non_null[:10]) * 0.6


def _column_values(rows: list[dict], key: str) -> list:
    return [row.get(key) for row in rows]


def select_chart(
    results: list[dict[str, Any]],
) -> tuple[str, Optional[ChartConfig]]:
    """
    Analyze query results and pick the best chart type.

    Returns:
        (chart_type, chart_config) where chart_type is one of:
        "bar" | "line" | "pie" | "scatter" | "none"
    """
    if not results or len(results) < 2:
        return "none", None

    keys = list(results[0].keys())

    if len(keys) < 2:
        return "none", None

    # Classify each column
    numeric_cols = []
    text_cols = []
    date_cols = []

    for key in keys:
        vals = _column_values(results, key)
        if _is_date_like(vals):
            date_cols.append(key)
        elif _is_numeric(vals):
            numeric_cols.append(key)
        else:
            text_cols.append(key)

    # ── Pattern matching ──────────────────────────────────────────────────────

    # Date + numeric → Line chart (time series)
    if date_cols and numeric_cols:
        return "line", ChartConfig(x_key=date_cols[0], y_key=numeric_cols[0])

    # Categorical + numeric:
    if text_cols and numeric_cols:
        x_key = text_cols[0]
        y_key = numeric_cols[0]
        unique_cats = len(set(_column_values(results, x_key)))

        # Few categories with percentages or proportions → Pie chart
        y_vals = [v for v in _column_values(results, y_key) if v is not None]
        total = sum(float(v) for v in y_vals if _is_numeric([v]))
        looks_like_percent = (
            unique_cats <= 8
            and total > 90
            and total <= 110  # roughly sums to 100
        )

        if looks_like_percent or (unique_cats <= 6 and "percent" in y_key.lower()):
            return "pie", ChartConfig(x_key=x_key, y_key=y_key, label_key=x_key)

        # Bar chart otherwise
        return "bar", ChartConfig(x_key=x_key, y_key=y_key)

    # Two numeric columns → Scatter
    if len(numeric_cols) >= 2:
        return "scatter", ChartConfig(x_key=numeric_cols[0], y_key=numeric_cols[1])

    return "none", None
