from pydantic import BaseModel
from datetime import datetime

class AppointmentCreate(BaseModel):
    patient_id: int
    provider_id: int
    scheduled_at: datetime
    duration_minutes: int = 30
    notes: str | None = None

class AppointmentRead(BaseModel):
    id: int
    tenant_id: int
    patient_id: int
    provider_id: int
    scheduled_at: datetime
    duration_minutes: int
    status: str
    notes: str | None = None

    class Config:
        orm_mode = True
