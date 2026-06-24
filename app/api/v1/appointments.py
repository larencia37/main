from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.appointment import Appointment
from schemas.appointment import AppointmentCreate, AppointmentRead
from api.v1.dependencies import get_current_user, require_tenant

router = APIRouter()

@router.post('/', response_model=AppointmentRead)
def create_appointment(appointment_in: AppointmentCreate, tenant_id: int = Depends(require_tenant), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    appointment = Appointment(tenant_id=tenant_id, **appointment_in.dict())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get('/', response_model=list[AppointmentRead])
def list_appointments(tenant_id: int = Depends(require_tenant), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Appointment).filter(Appointment.tenant_id == tenant_id).all()

@router.get('/{appointment_id}', response_model=AppointmentRead)
def get_appointment(appointment_id: int, tenant_id: int = Depends(require_tenant), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail='Appointment not found')
    return appointment
