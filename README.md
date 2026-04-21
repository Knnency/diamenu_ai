<div align="center">


# DiaMenu AI

### Smart Diabetic Management for Filipinos

AI-powered recipe auditing, meal planning, pantry tracking, and health analytics — built for the Filipino context.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud_Run-Deployed-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)

</div>

---

## 📖 Overview

**DiaMenu AI** is a full-stack web application designed to transform diabetic management from a clinical burden into a seamless lifestyle. It combines the power of Google's Gemini AI with culturally relevant Filipino dietary knowledge to help patients make informed food decisions every day.

The platform provides real-time recipe auditing with diabetic safety scores, AI-generated weekly meal planning, smart pantry management, blood sugar trend analytics, and a full-featured admin panel — all within a responsive Progressive Web App interface.

> **Disclaimer:** DiaMenu AI is a decision-support tool. It is **not a substitute for professional medical advice**. Always consult your physician or registered dietitian.

---

## 🎯 Project Objectives

DiaMenu is built around four clinical and cultural pillars:

### 🩺 1. Clinical & Health Management
- **Glycemic Control** — Empower users to maintain stable blood sugar through AI-audited, low-GI meal planning backed by ADA/WHO clinical guidelines.
- **Data-Driven Insights** — Visualize blood sugar trends over time alongside HbA1c history and link readings to specific dietary choices.
- **Medication Adherence** — Integrate health profile tracking to help users stay aware of their care protocols.

### 🇵🇭 2. Cultural & Local Relevance
- **Filipino Culinary Integration** — Support authentic Filipino recipes (adobo, sinigang, arroz caldo) and make them medically safe through AI ingredient swaps.
- **Palengke Accessibility** — Suggest affordable local-market alternatives (tokwa, monggo, malunggay) that fit both health requirements and budget constraints.

### 🛒 3. Smart Automation
- **Pantry Automation** — Automate inventory tracking and generate a consolidated grocery list directly from the weekly meal plan.
- **Proactive Auditing** — Use AI to flag high-GI items and offer 1-click diabetic-friendly ingredient swaps.

### 🧠 4. Behavioral Change
- **Long-Term Adherence** — Foster healthy habits through education, gamification concepts (Dia-Streak), and privacy-first caregiver support.
- **Cognitive Load Reduction** — Automate the difficult parts of diet management so users focus on living, not calculating.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔬 **Recipe Auditor** | Paste any recipe — Gemini AI scores it for diabetic safety, flags dangerous ingredients, and suggests healthy Filipino swaps with nutritional data. |
| 📅 **Weekly Meal Planner** | Build a 7-day meal plan from saved recipes. AI evaluates each slot (🟢 Good / 🟡 Warning / 🔴 Bad) and auto-generates a consolidated grocery list. |
| 🩸 **Health Dashboard** | Log fasting and post-meal blood sugar readings. OCR-powered lab result extraction (HbA1c, FBS) from uploaded images. Trend charts via Recharts. |
| 🍱 **Saved Recipes** | Save, organize, and view all audited recipes with their diabetic safety scores, images, and nutrition breakdowns. |
| 🧺 **Smart Pantry** | Track pantry inventory with add/edit/delete support. Helps users cross-reference meal plans against what they already have. |
| 👤 **User Dashboard** | Personalized home view showing health snapshot, quick actions, and upcoming meal plan summary. |
| 🛡️ **Admin Panel** | Superuser-only dashboard for user management, activity analytics, and community review moderation. |
| 🔑 **Full Auth Suite** | Email + OTP verification, Google OAuth 2.0 login, TOTP-based MFA, forgot/reset password flow. |
| 🌓 **Dark Mode** | System-aware dark/light mode toggle persisted in `localStorage`. |
| ⭐ **Review System** | Floating review button for users to submit app feedback with star ratings and recommendations. |

---

## 🏗️ Architecture & Tech Stack

### Frontend
| Technology | Role |
|---|---|
| **React 19** + **TypeScript 5.8** | Core UI framework with strict typing |
| **Vite 6** | Build tool and dev server |
| **Framer Motion** | Page transitions and UI micro-animations |
| **Recharts** | Blood sugar trend charts and health analytics |
| **Tesseract.js** | Client-side OCR for lab result image extraction |
| **jsPDF + AutoTable** | PDF generation for meal plan exports |
| **qrcode.react** | QR code generation for MFA setup (TOTP) |
| **Sonner** | Toast notifications |
| **@react-oauth/google** | Google OAuth 2.0 integration |

### Backend
| Technology | Role |
|---|---|
| **Django 5.0** + **Django REST Framework** | REST API and server-side logic |
| **PostgreSQL 16** | Primary relational database |
| **SimpleJWT** | JWT-based access/refresh token authentication |
| **PyOTP** + **qrcode** | TOTP MFA implementation |
| **Google Gen AI (`google-genai`)** | Gemini AI integration for recipe auditing & meal evaluation |
| **Google Auth** | Server-side Google OAuth token verification |
| **Django Storages** + **GCS** | Production media file storage on Google Cloud Storage |
| **WhiteNoise** | Static file serving in production |
| **Pillow** | Image processing utilities |

### Infrastructure
| Technology | Role |
|---|---|
| **Docker** | Containerized deployments for both frontend and backend |
| **Google Cloud Run** | Serverless container hosting (scales to zero) |
| **Nginx** | Reverse proxy for the production frontend container |
| **GitHub Actions** | CI/CD pipeline for automated deploys on push to `main` |

---

## 🗂️ Project Structure

```
diamenu_ai/
├── 📁 pages/              # React page components (Auditor, MealPlan, HealthDashboard, etc.)
│   └── 📁 admin/          # Admin-only pages (Dashboard, User Management, Reviews)
├── 📁 components/         # Reusable UI components (ReviewModal, OnboardingModal, etc.)
├── 📁 services/           # API call abstractions (authService, recipeService, etc.)
├── 📁 contexts/           # React Context providers (MealPlanContext)
├── 📁 utils/              # Utility helpers (urlUtils, etc.)
├── 📁 backend/            # Django REST API
│   └── 📁 apps/
│       ├── accounts/      # User auth, profiles, MFA, admin
│       ├── auditor/       # Recipe auditing logic & Gemini integration
│       ├── mealplan/      # Meal plan CRUD and AI evaluation
│       ├── bloodsugar/    # Blood sugar log endpoints
│       ├── pantry/        # Pantry item management
│       └── ai/            # Shared AI service layer
├── 📁 MDfiles/            # Project documentation (DFD, Security, Roadmap, etc.)
├── App.tsx                # Root component with routing and navigation
├── constants.ts           # App-wide constants and icon library
├── types.ts               # TypeScript type definitions and ViewState enum
├── Dockerfile.web         # Frontend container definition
└── backend/Dockerfile     # Backend container definition
```

---

## ⚙️ Local Development Setup

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **PostgreSQL** 16
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- A **Google OAuth Client ID** from [Google Cloud Console](https://console.cloud.google.com/)

---

### 1. Clone & Configure Environment

```bash
git clone https://github.com/your-org/diamenu_ai.git
cd diamenu_ai

# Copy and fill in the environment variables
cp .env.example .env
```

Open `.env` and fill in all required values (see [Environment Variables](#-environment-variables) below).

---

### 2. Backend Setup (Django)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create a superuser (for Admin Panel access)
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

> Backend runs at **http://127.0.0.1:8000**

---

### 3. Frontend Setup (React + Vite)

```bash
# From the project root
npm install
npm run dev
```

> Frontend runs at **http://localhost:5173**

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and populate the following:

```env
# Django
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True

# PostgreSQL
DB_NAME=diamenu_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

# Google OAuth (used by both Django and Vite)
GOOGLE_CLIENT_ID=your_google_client_id

# Vite / Frontend
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Google Cloud Storage (Production only)
GS_BUCKET_NAME=your_gcs_bucket_name
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-credentials.json
```

> ⚠️ **Never commit `.env` to version control.** It is already listed in `.gitignore`.

---

## 🚀 Deployment

DiaMenu AI is designed for **Google Cloud Run** — a fully managed serverless platform that scales to zero, keeping costs minimal.

### Architecture
```
GitHub (main branch push)
    └── GitHub Actions CI/CD
         ├── Build & push frontend Docker image → Google Artifact Registry
         │    └── Deploy to Cloud Run (Frontend Service)
         └── Build & push backend Docker image → Google Artifact Registry
              └── Deploy to Cloud Run (Backend Service) ← PostgreSQL on Cloud SQL
```

### Build Docker Images Locally

```bash
# Frontend
docker build -f Dockerfile.web -t diamenu-web .

# Backend
docker build -f backend/Dockerfile -t diamenu-backend ./backend
```

### Production Environment Variables

For Cloud Run, set all variables from `.env.example` as **Cloud Run environment variables** or mount them as **Secret Manager secrets**. Key production changes:

| Variable | Production Value |
|---|---|
| `DEBUG` | `False` |
| `SECRET_KEY` | A long, random, unique key |
| `DB_HOST` | Your Cloud SQL private IP |
| `VITE_API_BASE_URL` | Your backend Cloud Run service URL |

> See [`MDfiles/PLAN-gcp-deployment.md`](./MDfiles/PLAN-gcp-deployment.md) for the full deployment runbook.

---

## 🔒 Security

DiaMenu implements a layered security posture for its authentication and data processing pipelines:

- **JWT Authentication** — Short-lived access tokens + refresh token rotation via SimpleJWT.
- **Google OAuth 2.0** — Server-side token verification; no client-side trust of user-supplied identity.
- **Email OTP Verification** — 6-digit OTP flow for registration and password reset via Django email backend.
- **TOTP Multi-Factor Authentication** — Optional TOTP-based MFA (RFC 6238) with QR code setup and PyOTP verification.
- **CORS Policy** — Strict `django-cors-headers` configuration allowing only whitelisted frontend origins.
- **Rate Limiting** — Applied to OTP generation and verification endpoints to prevent brute-force attacks.
- **Server-side Authorization** — All admin endpoints verify `is_superuser` on the server; role checks are never trusted from the client.
- **IDOR Protection** — All resource detail views scope querysets to `request.user` to prevent unauthorized cross-user data access.

> For the full threat model (STRIDE/DREAD analysis), see [`MDfiles/SECURITY-STRIDE-DREAD.md`](./MDfiles/SECURITY-STRIDE-DREAD.md).

---

## 📚 Documentation

| Document | Description |
|---|---|
| [`OBJECTIVES.md`](./MDfiles/OBJECTIVES.md) | Detailed project goals and clinical motivations |
| [`PROJECT_SYSTEM_DOCUMENTATION.md`](./MDfiles/PROJECT_SYSTEM_DOCUMENTATION.md) | Full data flow diagrams (Level 0, 1, 2) and system architecture |
| [`SECURITY-STRIDE-DREAD.md`](./MDfiles/SECURITY-STRIDE-DREAD.md) | Comprehensive STRIDE + DREAD threat model |
| [`SECURITY-analysis.md`](./MDfiles/SECURITY-analysis.md) | Penetration testing scenarios and defense mechanisms |
| [`ROADMAP.md`](./MDfiles/ROADMAP.md) | Planned features and product improvement roadmap |
| [`CHANGELOG.md`](./MDfiles/CHANGELOG.md) | History of application changes |
| [`PLAN-gcp-deployment.md`](./MDfiles/PLAN-gcp-deployment.md) | Google Cloud Run deployment runbook |

---

## 📄 License

This project was developed as part of an academic project. All rights reserved by the authors.

---

<div align="center">

**DiaMenu AI** — *Designed for Impact. Built for Filipinos.*

Not a substitute for professional medical advice. Always consult your doctor.

</div>
