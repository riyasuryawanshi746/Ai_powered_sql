"""
Upload Router: handles CSV file uploads, creates SQLite tables,
and returns the inferred schema.
"""
import os
import shutil
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db, UploadedTable
from app.services.csv_service import ingest_csv, get_schema_from_db
from app.models.upload import UploadResponse, TableSchema, TableListItem
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["upload"])
settings = get_settings()


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV file.
    - Saves file temporarily
    - Reads with Pandas
    - Creates SQLite table
    - Returns schema
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # Check file size
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size_mb} MB.",
        )

    # Save to uploads directory
    os.makedirs(settings.upload_dir, exist_ok=True)
    temp_filename = f"{uuid.uuid4().hex}_{file.filename}"
    temp_path = os.path.join(settings.upload_dir, temp_filename)

    try:
        with open(temp_path, "wb") as f:
            f.write(content)

        schema = ingest_csv(temp_path, file.filename, db)
        return UploadResponse(
            success=True,
            message=f"Successfully uploaded '{file.filename}' with {schema.row_count} rows.",
            schema=schema,
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/tables", response_model=list[TableListItem])
def list_tables(db: Session = Depends(get_db)):
    """List all uploaded tables."""
    records = db.query(UploadedTable).order_by(UploadedTable.created_at.desc()).all()
    return [
        TableListItem(
            table_id=r.id,
            table_name=r.table_name,
            original_filename=r.original_filename,
            row_count=r.row_count,
            column_count=r.column_count,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/schema/{table_id}", response_model=TableSchema)
def get_schema(table_id: str, db: Session = Depends(get_db)):
    """Get schema for a specific uploaded table."""
    schema = get_schema_from_db(table_id, db)
    if not schema:
        raise HTTPException(status_code=404, detail="Table not found.")
    return schema
