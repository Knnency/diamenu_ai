# DiaMenu - Product Roadmap & Improvement Plan

This document outlines strategic improvements and feature additions to make DiaMenu a more comprehensive, engaging, and medically useful tool for Filipino diabetics.

---

## 1. Core Health Tracking & Analytics
Currently, DiaMenu focuses on meal planning and auditing. To become a daily companion, it needs to track the *results* of those meals.

*   **Blood Sugar Logging:** 
    *   Allow users to log Fasting Blood Sugar (FBS) and post-prandial (after meal) readings.
    *   **Improvement:** Link these readings directly to the meals they ate from the Weekly Planner to identify trigger foods.
*   **Visual Dashboards:** 
    *   Create charts (using a library like Recharts) showing blood sugar trends over time alongside HbA1c history.
*   **Medication Reminders:** 
    *   Simple push notifications or in-app alerts reminding users to take their Metformin, Insulin, etc., based on the data in their Settings profile.

## 2. Enhanced AI Personalization
The AI currently uses a static prompt. We can make it much smarter by feeding it the user's actual profile data.

*   **Profile-Driven Prompts:** 
    *   When generating a meal plan or auditing a recipe, inject the user's specific `dietaryPreferences`, `allergens`, and `medicalDetails.restrictions` into the Gemini prompt.
    *   *Example:* If the user has "Less Sodium" checked, the Chef Agent should explicitly suggest low-sodium soy sauce or natural herbs instead of patis.
*   **Budget & Accessibility:** 
    *   Add a setting for "Budget Level" (e.g., Petsa de Peligro vs. Payday). The AI can then suggest cheaper protein sources (like tokwa or monggo) when the budget is tight.

## 3. Community & Social Features
Managing diabetes can be isolating. Building a community can increase app retention.

*   **Recipe Sharing:** 
    *   Allow users to publish their AI-audited, high-scoring recipes to a public "Community Cookbook" feed.
*   **Family/Caregiver Mode:** 
    *   Allow a secondary account (like a son or daughter) to view the meal plan and blood sugar logs to help monitor their elderly parent's health.

## 4. Practical Utility & E-Commerce Integration
Bridge the gap between planning a meal and actually cooking it.

*   **Automated Grocery Lists:** 
    *   Add a button to the Weekly Planner that extracts all ingredients from the 7-day plan and generates a consolidated, categorized shopping list (Produce, Meat, Pantry).
*   **Palengke/Supermarket Price Estimates:** 
    *   Use the AI to provide rough cost estimates for the weekly meal plan based on current Philippine market prices.

## 5. Gamification & Education
Encourage positive behavior through rewards and bite-sized learning.

*   **The "Dia-Streak":** 
    *   Reward users for logging their blood sugar or sticking to their meal plan for consecutive days.
*   **Daily Trivia/Myths:** 
    *   A small widget on the Home screen debunking common Filipino diabetes myths (e.g., "Is brown sugar really better than white sugar?").

## 6. Technical & UX Improvements
*   **PWA (Progressive Web App):** 
    *   Make the app installable on mobile home screens so it feels like a native app, which is crucial for daily logging.
*   **Offline Mode:** 
    *   Cache the current week's meal plan so users can view it even without an internet connection (e.g., while inside a supermarket with bad reception).
*   **Localization:** 
    *   Offer the interface and AI responses in Tagalog, Cebuano, or Taglish to make it more accessible to the elderly or those more comfortable in their native tongue.
