# AI SQL Analytics Assistant

> Query any dataset in plain English and receive SQL, insights, and visualizations automatically.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![SQLite](https://img.shields.io/badge/SQLite-Analytics-orange)
![Gemini](https://img.shields.io/badge/LLM-Gemini-purple)

## Overview

Business users often know **what question they want answered**, but not **how to write SQL**.

AI SQL Analytics Assistant bridges that gap by allowing users to:

* Upload any CSV dataset
* Ask questions in plain English
* Automatically generate SQL
* Execute queries safely
* Visualize results
* Receive AI-generated insights
* Explore previous analyses through query history

The system converts natural language into an end-to-end analytics workflow without requiring SQL expertise.

---

## Demo Workflow

### 1. Upload Dataset

Upload any CSV file.

Examples:

* Sales Data
* HR Analytics
* Customer Churn
* Healthcare Records
* Financial Transactions

The backend:

* Reads CSV using Pandas
* Infers schema automatically
* Creates a SQLite analytics table
* Stores metadata and sample values

---

### 2. Ask Questions in Plain English

Examples:

```text
How many customers are in the dataset?

Show average revenue by region.

Which department has the highest attrition?

What percentage of patients have heart disease?
```

---

### 3. AI Generates SQL

Example:

Question:

```text
Show heart disease cases by gender
```

Generated SQL:

```sql
SELECT
    sex,
    COUNT(*) AS cases
FROM heart
WHERE target = 1
GROUP BY sex;
```

---

### 4. Execute Query

The generated SQL is:

* Validated
* Restricted to read-only operations
* Executed against SQLite

Results are returned as structured JSON.

---

### 5. Automatic Visualization

Charts are selected automatically based on result structure.

| Result Pattern    | Chart        |
| ----------------- | ------------ |
| Category + Count  | Bar Chart    |
| Date + Metric     | Line Chart   |
| Category + Share  | Pie Chart    |
| Numeric + Numeric | Scatter Plot |

---

### 6. AI Business Insights

Example output:

* Sales contributes 42% of total attrition.
* Engineering demonstrates the strongest retention.
* Attrition increases significantly among employees with overtime.

---

## Architecture

```text
                    ┌─────────────────┐
                    │    Next.js UI   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     FastAPI     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼

 ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
 │ CSV Upload  │    │ Gemini LLM   │    │ Query History│
 └─────────────┘    └──────────────┘    └─────────────┘
         │
         ▼
 ┌─────────────────┐
 │ Pandas + SQLite │
 └─────────────────┘
         │
         ▼
 ┌─────────────────┐
 │ SQL Execution   │
 └─────────────────┘
         │
         ▼
 ┌─────────────────┐
 │ Charts + Insights│
 └─────────────────┘
```

---

## Key Features

### CSV Upload & Schema Inference

* Dynamic table creation
* Automatic datatype detection
* Sample-value extraction
* Unique table generation

### Natural Language → SQL

* Schema-aware prompting
* Dynamic table support
* Read-only query generation

### SQL Validation Layer

Prevents:

* INSERT
* UPDATE
* DELETE
* DROP
* ALTER
* Multi-statement execution

Only SELECT queries are allowed.

### Query Execution Engine

* SQLAlchemy
* SQLite
* Result serialization
* Execution timing

### Automatic Chart Generation

* Bar charts
* Line charts
* Pie charts
* Scatter plots

### AI Insights

Generates:

* Trends
* Anomalies
* Top performers
* Business recommendations

### Query History

Stores:

* Question
* SQL
* Results
* Insights
* Execution time
* Timestamp

---

## Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* ShadCN UI
* Recharts

### Backend

* FastAPI
* SQLAlchemy
* Pandas
* Pydantic

### Database

* SQLite

### AI

* Google Gemini

### Deployment

* Vercel (Frontend)
* Render / Railway (Backend)

---

## Security Measures

### SQL Safety Validation

The application blocks:

```sql
INSERT
UPDATE
DELETE
DROP
ALTER
TRUNCATE
VACUUM
PRAGMA
```

Only read-only analytics queries are executed.

### Schema-Aware Prompting

The model only receives:

* Table name
* Actual columns
* Sample values

This reduces hallucinated SQL significantly.

---

## Example Dataset Testing

Tested using:

### Heart Disease Dataset

Sample Questions:

```text
How many patients are in the dataset?

Count patients by gender.

Show average cholesterol by gender.

Which chest pain type has the highest heart disease rate?

Compare cholesterol levels between healthy and diseased patients.
```

Generated SQL and results were validated against equivalent Pandas operations.

---

## Challenges Solved

### Dynamic Schema Handling

Every uploaded CSV generates:

* Unique table name
* Dynamic schema
* Independent query context

### Safe AI-Generated SQL

Implemented:

* Validation layer
* Read-only enforcement
* Execution safeguards

### Dataset-Agnostic Analytics

The system works across:

* Healthcare
* Finance
* HR
* Sales
* Operations

without hardcoded schemas.

---

## Future Improvements

* Multi-table joins
* Dashboard generation
* Saved reports
* DuckDB integration
* Groq/OpenAI support
* Advanced chart recommendations
* Role-based access control
* Export to PDF/Excel
