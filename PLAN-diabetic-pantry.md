# Project Plan: Diabetic Pantry & Smart Grocery Tracker

## Overview
**Goal:** Create a smart inventory and grocery management system tailored for diabetic patients.
**Why:** Following a diabetic diet is challenging without the right ingredients on hand. This feature reduces friction by automatically generating safe shopping lists from meal plans and auditing the user's pantry/grocery list for high Glycemic Index (GI) items.

## Project Type
**WEB** (React frontend + Django backend addition)

## Success Criteria
1. Users can access a dedicated `/pantry` page from the sidebar navigation.
2. Users can manually add/remove items to their digital pantry inventory.
3. The system automatically generates a "Grocery List" based on upcoming planned meals (from the `MealPlan` page) minus what is already in their pantry.
4. An AI "Audit" system flags high-GI ingredients in the grocery list and suggests 1-click lower-GI alternatives.

## Tech Stack
- **Frontend Framework:** React + TypeScript (Vite setup)
- **Styling:** Tailwind CSS (adhering to DiaMenu's premium, soft geometry, non-purple constraint)
- **Icons:** Lucide React
- **State Management:** React Context or local state for the Pantry/Grocery inventory.
- **Backend:** Django ORM and Django REST Framework endpoints for saving pantry states.

## File Structure
```text
/pages/
  ├── Pantry.tsx                # Main Pantry & Grocery List page
/components/
  ├── pantry/
  │   ├── InventoryList.tsx     # Displays current pantry items
  │   ├── GroceryList.tsx       # Auto-generated shopping list
  │   └── GIAuditCard.tsx       # AI Glycemic Index suggestions component
```

## Task Breakdown

### 1. Setup Pantry Page Structure
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Priority:** P1
- **Dependencies:** None
- **INPUT:** Create a new `/pages/Pantry.tsx` file and integrate it into `App.tsx` routing and sidebar navigation. Use an asymmetrical split layout (Inventory on left, Grocery List on right).
- **OUTPUT:** A responsive, empty state layout matching DiaMenu's design language.
- **VERIFY:** Navigate to `/pantry` and ensure the layout renders correctly on Desktop and Mobile without visual issues.

### 2. Implement Inventory Management UI
- **Agent:** `frontend-specialist`
- **Skill:** `react-best-practices`
- **Priority:** P2
- **Dependencies:** Task 1
- **INPUT:** Build the `InventoryList` and an inline 'Add Item' form to manually add or subtract ingredients.
- **OUTPUT:** Users can visually add, search, edit, and delete items from their pantry list UI.
- **VERIFY:** Add "Almond Flour" and verify it appears. Click delete and verify it vanishes.

### 3. Implement Smart Grocery Auto-Generation Logic
- **Agent:** `frontend-specialist`
- **Skill:** `clean-code`
- **Priority:** P2
- **Dependencies:** Task 1, Task 2
- **INPUT:** Build the `GroceryList` component. It should cross-reference a mock `MealPlan`'s required ingredients against the `InventoryList`.
- **OUTPUT:** A functional grocery checklist component (Required - Current Inventory = Grocery List).
- **VERIFY:** If a meal requires "Eggs" and "Eggs" is absent from the Pantry, verify "Eggs" appears on the Grocery List.

### 4. Implement GI (Glycemic Index) Audit AI Card
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-design`
- **Priority:** P3
- **Dependencies:** Task 3
- **INPUT:** Create an AI-styled widget (`GIAuditCard.tsx`) that scans the generated Grocery List for high GI items (e.g., White Bread, Potatoes).
- **OUTPUT:** A floating card with visual warnings and 1-click swap buttons (e.g., Swap White Rice -> Cauliflower Rice).
- **VERIFY:** Add "White Rice" to the list, verify the AI card pops up suggesting a diabetic-friendly alternative.

### 5. Backend API Integration (Data Persistence)
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **Priority:** P4
- **Dependencies:** Task 2, Task 3
- **INPUT:** Create Django models (`PantryItem`, `GroceryItem`) and Views to store the specific user's pantry layout.
- **OUTPUT:** REST API endpoints (`GET /api/pantry`, `POST /api/pantry/add`, etc.).
- **VERIFY:** Refreshing the `/pantry` page fetches data from the backend and retains the user's inventory.

---

## ✅ Phase X: Verification Checklist
- [ ] No purple/violet hex codes used in the new UI.
- [ ] UI utilizes DiaMenu's established component style (soft `shadow-md`, `border-gray-200`, light mode meshes).
- [ ] Run `npm run lint` && `npx tsc --noEmit`. Must exit with Code 0.
- [ ] Ensure all `Playwright` e2e tests (if applicable) pass for the new routing.
- [ ] Final visual check against the `ux_audit.py` script.
