"""
Gemini Service: integrates with Google's Gemini 1.5 Flash API.
Handles SQL generation and business insight generation.
"""
import google.generativeai as genai
import json
import re

from app.config import get_settings
from app.models.upload import ColumnInfo

settings = get_settings()

# Configure Gemini once at module level
genai.configure(api_key=settings.gemini_api_key)
_model = genai.GenerativeModel("gemini-1.5-flash")


# ─── Prompt Builders ──────────────────────────────────────────────────────────

def _build_schema_context(table_name: str, columns: list[ColumnInfo]) -> str:
    """Build a readable schema string for the Gemini prompt."""
    lines = [f"Table: {table_name}", "Columns:"]
    for col in columns:
        samples = ", ".join(str(s) for s in col.sample_values[:3])
        lines.append(
            f"  - {col.name} ({col.sql_type}) — sample values: [{samples}]"
        )
    return "\n".join(lines)


def _extract_sql_from_response(text: str) -> str:
    """
    Extract just the SQL query from Gemini's response.
    Handles both raw SQL and markdown code blocks.
    """
    # Try to extract from ```sql ... ``` block
    code_block = re.search(r"```(?:sql)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if code_block:
        return code_block.group(1).strip()
    # Otherwise return the whole response stripped
    return text.strip()


# ─── SQL Generation ───────────────────────────────────────────────────────────

def generate_sql(
    table_name: str,
    columns: list[ColumnInfo],
    question: str,
) -> str:
    """
    Use Gemini 1.5 Flash to generate a SQL query from a natural language question.

    Returns the raw SQL string.
    Raises ValueError if generation fails.
    """
    schema_context = _build_schema_context(table_name, columns)

    prompt = f"""You are an expert SQL analyst. Given a SQLite database schema and a user question,
generate a precise, efficient SQL query.

RULES:
- Use only SELECT statements (no INSERT, UPDATE, DELETE, DROP, etc.)
- Use the exact table name: {table_name}
- Use the exact column names from the schema
- Return ONLY the SQL query, no explanations
- Use SQLite-compatible syntax
- Limit results to 1000 rows maximum unless the user asks for all
- For aggregations, always include GROUP BY where needed

SCHEMA:
{schema_context}

USER QUESTION:
{question}

SQL QUERY:"""

    try:
        response = _model.generate_content(prompt)
        sql = _extract_sql_from_response(response.text)
        return sql
    except Exception as e:
        raise ValueError(f"Gemini SQL generation failed: {str(e)}")


# ─── Insight Generation ───────────────────────────────────────────────────────

def generate_insights(
    question: str,
    sql: str,
    results: list[dict],
    table_name: str,
) -> list[str]:
    """
    Use Gemini 1.5 Flash to generate 2-3 business insights from query results.

    Returns a list of insight strings.
    """
    if not results:
        return ["No data returned — try a different question or check your dataset."]

    # Summarize results for the prompt (avoid sending huge payloads)
    sample_rows = results[:20]
    results_preview = json.dumps(sample_rows, indent=2, default=str)
    total_rows = len(results)

    prompt = f"""You are a senior business analyst. A user asked a question about their data and received results.
Generate exactly 3 concise, actionable business insights based on the data.

USER QUESTION: {question}

SQL USED:
{sql}

QUERY RESULTS (showing {min(20, total_rows)} of {total_rows} rows):
{results_preview}

INSTRUCTIONS:
- Each insight should be 1-2 sentences
- Focus on trends, anomalies, top performers, or business implications
- Be specific and reference actual values from the data
- Do NOT repeat the question back
- Return a JSON array of exactly 3 strings, like: ["insight1", "insight2", "insight3"]

INSIGHTS:"""

    try:
        response = _model.generate_content(prompt)
        text = response.text.strip()

        # Try to parse JSON array
        json_match = re.search(r"\[.*?\]", text, re.DOTALL)
        if json_match:
            insights = json.loads(json_match.group(0))
            if isinstance(insights, list):
                return [str(i) for i in insights[:3]]

        # Fallback: split by newlines and take first 3 non-empty lines
        lines = [l.strip().lstrip("•-123. ") for l in text.split("\n") if l.strip()]
        return lines[:3] if lines else ["Analysis complete. Review the results above."]

    except Exception as e:
        return [f"Insight generation unavailable: {str(e)}"]
