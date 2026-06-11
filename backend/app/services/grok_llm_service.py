"""
LLM Service: centralized interface for all AI model calls.
Currently backed by Groq. To swap models/providers, edit ONLY this file.

Recommended models:
  - SQL generation:   llama-3.3-70b-versatile  (best reasoning + SQL accuracy)
  - Insight gen:      llama-3.1-8b-instant      (fast, cheap, sufficient)
  - Fallback/backup:  mixtral-8x7b-32768        (strong alt, large context)

All prompts, model names, and API logic live here.
"""

import json
import os
import re
from groq import Groq

from app.models.upload import ColumnInfo

# ─── Client (singleton) ───────────────────────────────────────────────────────

# ─── Client (singleton) ───────────────────────────────────────────────────────

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        # Import your centralized settings framework
        from app.config import get_settings
        settings = get_settings()
        
        # Read the key that Pydantic loaded from your .env file
        api_key = settings.groq_api_key
        
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set in your .env file.")
        _client = Groq(api_key=api_key)
    return _client

# ─── Model constants ──────────────────────────────────────────────────────────

# Best for structured SQL generation — strongest reasoning in Groq's lineup
SQL_MODEL = "llama-3.3-70b-versatile"

# Fast + cheap for short insight text — 8b is more than capable here
INSIGHT_MODEL = "llama-3.1-8b-instant"

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_schema_context(table_name: str, columns: list[ColumnInfo]) -> str:
    """Produce a compact schema block for injection into prompts."""
    lines = [f"Table: {table_name}", "Columns:"]
    for col in columns:
        samples = ", ".join(str(s) for s in col.sample_values[:3])
        lines.append(f"  - {col.name} ({col.sql_type}) — e.g. [{samples}]")
    return "\n".join(lines)


def _extract_sql(text: str) -> str:
    """Pull SQL out of a markdown code block or raw text."""
    block = re.search(r"```(?:sql)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if block:
        return block.group(1).strip()
    select = re.search(r"\bSELECT\b.*", text, re.IGNORECASE | re.DOTALL)
    if select:
        return select.group(0).strip()
    return text.strip()


def _chat(model: str, system: str, user: str, max_tokens: int = 1024) -> str:
    """
    Single-turn chat completion. All Groq calls go through here.
    Raises ValueError on API errors so callers can handle gracefully.
    """
    client = _get_client()
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=0.1,   # Low temp = more deterministic SQL/structured output
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        raise ValueError(f"Groq API error ({model}): {e}") from e


# ─── Public API ───────────────────────────────────────────────────────────────

def generate_sql(
    table_name: str,
    columns: list[ColumnInfo],
    question: str,
) -> str:
    """
    Translate a natural language question into a SQLite SELECT query.

    Uses SQL_MODEL (llama-3.3-70b-versatile) for maximum accuracy.
    Returns the raw SQL string.
    Raises ValueError if generation fails.
    """
    schema = _build_schema_context(table_name, columns)

    system = (
        "You are an expert SQLite analyst. "
        "Your ONLY output is a single valid SQL SELECT statement — no explanation, "
        "no markdown, no commentary. Just the SQL."
    )

    user = f"""\
SCHEMA:
{schema}

RULES:
- SELECT only (no INSERT, UPDATE, DELETE, DROP, CREATE, etc.)
- Use exact table name: {table_name}
- Use exact column names from schema
- SQLite-compatible syntax only
- LIMIT 1000 rows unless user asks for all
- Add GROUP BY when aggregating

QUESTION: {question}

SQL:"""

    raw = _chat(SQL_MODEL, system, user, max_tokens=512)
    return _extract_sql(raw)


def generate_insights(
    question: str,
    sql: str,
    results: list[dict],
    table_name: str,
) -> list[str]:
    """
    Generate 2–3 concise business insights from query results.

    Uses INSIGHT_MODEL (llama-3.1-8b-instant) — fast and sufficient for prose.
    Returns a list of insight strings.
    Falls back gracefully on errors.
    """
    if not results:
        return ["No rows returned — try broadening your question or checking the data."]

    # Skip LLM for trivially small result sets where stats say everything
    if len(results) == 1 and len(results[0]) <= 2:
        vals = list(results[0].values())
        return [f"Result: {vals[0]}" + (f" for {vals[1]}" if len(vals) > 1 else "")]

    preview = json.dumps(results[:20], indent=2, default=str)
    total = len(results)

    system = (
        "You are a concise business analyst. "
        "Respond ONLY with a JSON array of exactly 3 strings — no preamble, "
        "no markdown, just the raw JSON array."
    )

    user = f"""\
Question: {question}
Table: {table_name}
SQL: {sql}
Results ({min(20, total)} of {total} rows shown):
{preview}

Return exactly 3 short (1-2 sentence) actionable insights referencing specific values. 
Format: ["insight1", "insight2", "insight3"]"""

    try:
        raw = _chat(INSIGHT_MODEL, system, user, max_tokens=400)
        # Strip accidental markdown fences
        raw = raw.replace("```json", "").replace("```", "").strip()
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
            if isinstance(parsed, list):
                return [str(i) for i in parsed[:3]]
        # Fallback: split by newlines
        lines = [l.strip().lstrip("•-123. ") for l in raw.split("\n") if l.strip()]
        return lines[:3] or ["Analysis complete — review the results above."]
    except Exception as e:
        return [f"Insight generation unavailable: {e}"]