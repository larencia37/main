from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str | None = None
    password: str
    tenant_id: int
    role: str = 'staff'

class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_active: bool
    is_superuser: bool
    tenant_id: int
    role: str

    class Config:
        orm_mode = True
