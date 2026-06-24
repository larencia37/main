from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models.patient import Patient
from schemas.patient import PatientCreate, PatientRead
from api.v1.dependencies import get_current_user, require_tenant

router = APIRouter()

@router.post('/', response_model=PatientRead)
def create_patient(patient_in: PatientCreate, tenant_id: int = Depends(require_tenant), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    patient = Patient(tenant_id=tenant_id, **patient_in.dict())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.get('/', response_model=list[PatientRead])
def list_patients(tenant_id: int = Depends(require_tenant), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Patient).filter(Patient.tenant_id == tenant_id).all()

@router.get('/{patient_id}', response_model=PatientRead)
def get_patient(patient_id: int, tenant_id: int = Depends(require_tenant), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.tenant_id == tenant_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail='Patient not found')
    return patient
