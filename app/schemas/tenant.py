from pydantic import BaseModel

class TenantCreate(BaseModel):
    name: str
    legal_name: str | None = None

class TenantRead(BaseModel):
    id: int
    name: str
    legal_name: str | None = None
    is_active: bool

    class Config:
        orm_mode = True
