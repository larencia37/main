from fastapi import FastAPI
from api.v1 import auth, patients, appointments, tenants
from database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title='VeneHealth SaaS',
    description='Backend foundation for a Venezuelan hospital and clinic management SaaS.',
    version='0.1.0',
)

app.include_router(auth.router, prefix='/api/v1/auth', tags=['auth'])
app.include_router(tenants.router, prefix='/api/v1/tenants', tags=['tenants'])
app.include_router(patients.router, prefix='/api/v1/patients', tags=['patients'])
app.include_router(appointments.router, prefix='/api/v1/appointments', tags=['appointments'])
