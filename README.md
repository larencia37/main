# VeneHealth SaaS Starter

## Hospital & Clinical Management SaaS Starter

This repository contains the initial foundation for a Venezuelan hospital and clinic management SaaS.

### Included components
- `docker-compose.yml` with PostgreSQL, Redis, MinIO, and FastAPI backend.
- Backend starter app in `app/`.
- Multi-tenant models for tenants, users, patients, and appointments.
- Authentication and basic API structure.

### Run locally
1. Start services:
   ```bash
   docker compose up --build
   ```

2. Visit the API docs:
   ```
   http://localhost:8000/docs
   ```

3. Create a tenant and register users using the API.

### API endpoints
- `POST /api/v1/tenants/` - create a tenant.
- `GET /api/v1/tenants/` - list tenants.
- `POST /api/v1/auth/register` - register a user.
- `POST /api/v1/auth/token` - obtain JWT access token.
- `POST /api/v1/patients/` - create a patient (requires `x-tenant-id`).
- `GET /api/v1/patients/` - list patients.
- `POST /api/v1/appointments/` - create an appointment.
- `GET /api/v1/appointments/` - list appointments.

### Notes
- This is a starting point for Phase 0 of the roadmap.
- The backend is designed to separate infrastructure from business logic.
