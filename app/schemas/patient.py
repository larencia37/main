from pydantic import BaseModel
from datetime import date

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    document_type: str | None = None
    document_number: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None

class PatientRead(BaseModel):
    id: int
    tenant_id: int
    first_name: str
    last_name: str
    document_type: str | None = None
    document_number: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None

    class Config:
        orm_mode = True
