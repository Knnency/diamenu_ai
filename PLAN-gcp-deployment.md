# GCP Deployment Plan (Django + React + PostgreSQL)

This plan outlines the steps to migrate and deploy the **DiaMenu** application to Google Cloud Platform using Cloud Run, Cloud SQL, and static hosting.

## 🛑 Socratic Gate (User Review Required)

Before we proceed with the technical implementation, please provide details on the following:

> [!IMPORTANT]
> **Action Required**: Please answer these questions to finalize the architecture.
> 1. **GCP Project**: Do you already have a GCP Project ID and a preferred region (e.g., `asia-southeast1` or `us-central1`)?
> 2. **Frontend Hosting**: Do you prefer **Firebase Hosting** (recommended for React SPAs) or **Cloud Run**?
> 3. **Database Scale**: Is this for a small MVP/test (using the smallest Cloud SQL instance) or do you need high availability/scaling immediately?
> 4. **Automation**: Should I include a **GitHub Actions** or **Cloud Build** pipeline in the plan to automate future deployments?
> 5. **Domain**: Do you have a custom domain ready, or should we use the default GCP/Firebase provided URLs for now?

---

## Proposed Architecture (Target)

| Component | GCP Service | Rationale |
|-----------|-------------|-----------|
| **Backend** | Cloud Run (Serverless) | Cost-effective, scales to zero when not in use. |
| **Frontend** | Cloud Storage + Cloud CDN / Firebase Hosting | Fast, distributed, and highly available for static React apps. |
| **Database** | Cloud SQL (PostgreSQL) | Managed database service with automated backups. |
| **Secrets** | Google Secret Manager | Securely store environment variables (`SECRET_KEY`, `DB_PASSWORD`). |
| **Images** | Cloud Storage | For user profile pictures and recipe images. |

---

## Proposed Changes

### [Backend]
#### [NEW] [Dockerfile](file:///c:/Users/admin/diamenu_ai/backend/Dockerfile)
- Create a production-ready Dockerfile for the Django application.
#### [NEW] [docker-compose.yml](file:///c:/Users/admin/diamenu_ai/backend/docker-compose.yml)
- For local testing of the production image.
#### [MODIFY] [settings.py](file:///c:/Users/admin/diamenu_ai/backend/diamenu/settings.py)
- Refine settings for production (CSRF_TRUSTED_ORIGINS, Secure Cookies).

### [Frontend]
#### [NEW] [Dockerfile.web](file:///c:/Users/admin/diamenu_ai/Dockerfile.web)
- Multi-stage build for Nginx + React.
#### [NEW] [firebase.json](file:///c:/Users/admin/diamenu_ai/firebase.json)
- Config for Firebase Hosting (if selected).

---

## Verification Plan

### Automated Tests
- `docker build` to verify images.
- Cloud Run health checks.
- DB migration verification via `python manage.py showmigrations`.

### Manual Verification
1. Access the Cloud Run public URL suffix.
2. Verify Admin login works with the Cloud SQL database.
3. Test profile picture upload to Cloud Storage bucket.
