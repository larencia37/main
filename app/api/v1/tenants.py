from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.tenant import Tenant
from schemas.tenant import TenantCreate, TenantRead

router = APIRouter()

@router.post('/', response_model=TenantRead)
def create_tenant(tenant_in: TenantCreate, db: Session = Depends(get_db)):
    existing = db.query(Tenant).filter(Tenant.name == tenant_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail='Tenant name already exists')
    tenant = Tenant(name=tenant_in.name, legal_name=tenant_in.legal_name)
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.get('/', response_model=list[TenantRead])
def list_tenants(db: Session = Depends(get_db)):
    return db.query(Tenant).all()
