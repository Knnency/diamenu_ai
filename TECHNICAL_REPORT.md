# Project Report: DiaMenu Development Log

> **Note:** This report reflects the journey and current status of DiaMenu from a developer's perspective.

## 🚀 Current Development Status
DiaMenu is currently in its core MVP (Minimum Viable Product) stage. I have established a full-stack bridge between the React frontend and the Django REST API. The core AI functionality (Doc Chef) is now fully operational, and the backend database schema has been successfully migrated and tested locally.

## ✨ Implemented Features and Functionalities
1.  **AI Recipe Auditor (Doc Chef):** A Gemini-powered chatbot that analyzes recipes and suggests "Smart Swaps" based on the user's diabetic profile.
2.  **Smart Pantry & Inventory:** A management system to track current kitchen stock.
3.  **Automated Grocery Lists:** Intelligent generation of shopping checklists based on missing pantry ingredients.
4.  **Health Tracking:** Functional blood sugar logging (FBS and post-prandial) with persistent storage.
5.  **Enhanced Security:** Multi-Factor Authentication (MFA) and a custom registration flow.
6.  **Admin Dashboard:** A centralized interface for super-admin user management and CRUD operations.

## 🏗️ System Architecture / Workflow
- **Frontend Architecture:** I used React + Vite + TypeScript. This combination is great because Vite is lightning fast, and TypeScript helps me catch errors while I'm coding.
- **Backend Architecture:** I chose Django with a PostgreSQL database. It's solid for handling medical data relationships and user authentication.
- **AI Workflow:** The app takes the user's dietary restrictions (e.g., "Egg Allergy", "Low-FODMAP") and injects them into the Gemini AI prompt. This ensures the suggestions are medically safe and relevant.
- **Data Flow:** React (Frontend) ↔ Django REST Framework (API) ↔ PostgreSQL (Database).

## 🚩 Challenges Encountered
1.  **The "Missing Relation" Error:** I spent way too much time debugging a `django_session` error. The server kept crashing because it couldn't find the necessary database tables.
2.  **Silent AI Failures:** My chatbot was failing with a "Missing API Key" message, even though I was sure I had configured my environment variables correctly. 
3.  **Stale UI States:** A big issue I faced was the UI not updating when I changed settings. I would click "Save" or "Add" but nothing would happen visually until I refreshed the whole page.

## 💡 Solutions / Workarounds Applied
1.  **Migration Check:** I discovered that the database hadn't been initialized locally. Applying all pending migrations with `python manage.py migrate` fixed the relation errors immediately.
2.  **Vite Env Accessor:** I realized that Vite doesn't recognize `process.env`. I had to update my service objects to use `import.meta.env.VITE_GEMINI_API_KEY` to correctly pull the key into the frontend.
3.  **Forced Re-renders (State Bumping):** Since my settings manager was a vanilla class, React didn't "see" the internal mutations. I implemented a `settingsVersion` state in the component and incremented it on every change. This forced React to re-draw the UI every time I hit a button, making the app feel much more responsive.

---
*Generated: March 2026*
