# Deployment Prep

This repo is prepared so GitHub Actions can validate the app on `dev` and package it for deployment on `main`.

## Branch flow

- `dev`: CI branch for day-to-day integration
- `main`: production branch; pushes here trigger the deploy workflow

## Current workflow behavior

- `.github/workflows/ci.yml`
  - runs on pushes to `dev` and `main`
  - runs on pull requests targeting `dev` or `main`
  - builds/tests frontend
  - provisions PostgreSQL, loads `backend/data/314 db.sql`, and runs backend tests

- `.github/workflows/deploy.yml`
  - runs on pushes to `main`
  - builds release artifacts
  - deploys to Azure only when deployment secrets are configured
  - otherwise exits through a placeholder job so the workflow is still useful before Azure is ready

## Secrets to prepare

GitHub repository secrets:

- `AZURE_WEBAPP_NAME`
- `AZURE_WEBAPP_PUBLISH_PROFILE`

Azure app settings / environment variables:

- `DATABASE_URL`
- `SECRET_KEY`
- `CORS_ORIGIN`
- `UPLOAD_FOLDER`
- `MAX_CONTENT_LENGTH`
- `FLASK_DEBUG`
- `PORT`

## Database setup

For the first production deployment:

1. Create the PostgreSQL database.
2. Run `backend/data/314 db.sql` once.
3. Do not run `backend/data/seed_dummy_data.sql` in production.
4. Set `DATABASE_URL` for the deployed backend.

Keep schema initialization manual for the first deployment. Add incremental migration scripts later if the schema changes after go-live.

## Upload storage

The current app stores uploads on the backend filesystem via `backend/uploads/`.

That is acceptable for local development, but it is not a durable cloud storage strategy. Before production use, plan either:

- Azure Blob Storage
- or another persistent object store

## Backend startup

The backend now includes `backend/wsgi.py` so Azure or another WSGI host can target:

- `app` from `backend/wsgi.py`

Typical startup command examples:

```bash
gunicorn --chdir backend wsgi:app
```
