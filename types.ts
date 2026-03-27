export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  imageUrl?: string;
  isAudited: boolean;
  auditResult?: AuditResult;
}

export interface AuditResult {
  safetyScore: number; // 0-100
  portionWeight: string; // e.g., "250g" or "1 serving (300g)"
  ingredientsList: string[]; // List of identified ingredients
  doctorAnalysis: {
    verdict: string;
    concerns: string[];
    glycemicIndexEstimate: string;
  };
  chefSwaps: {
    originalIngredient: string;
    suggestedSwap: string;
    reason: string;
    localContext: string; // e.g., "Available at palengke"
  }[];
  nutritionalInfo: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

export enum ViewState {
  HOME = 'HOME',
  AUDITOR = 'AUDITOR',
  MEAL_PLAN = 'MEAL_PLAN',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  VERIFY_OTP = 'VERIFY_OTP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
  SETTINGS = 'SETTINGS',
  SAVED_RECIPES = 'SAVED_RECIPES',
  PANTRY = 'PANTRY',
  DASHBOARD = 'DASHBOARD',
  HEALTH_STATS = 'HEALTH_STATS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_USER_REPORTS = 'ADMIN_USER_REPORTS',
  ADMIN_REVIEWS = 'ADMIN_REVIEWS',
  TERMS_POLICY = 'TERMS_POLICY',
}

export interface BloodSugarLog {
  id: string | number;
  date: string; // ISO string or simple date
  time: string;
  value: number; // mg/dL
  context: 'Fasting' | 'Before Meal' | 'After Meal' | 'Bedtime';
  notes?: string;
}

export interface UserProfile {
  name: string;
  age: number;
  type: 'Type 1' | 'Type 2' | 'Pre-diabetic';
  dietaryPreferences: string[];
  allergens: string[];
  diagnosis?: string;
  medicalDetails?: {
    hba1c?: string;
    fbs?: string;
    medications?: string;
    restrictions?: string;
  };
}

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  isChecked: boolean;
  isHighGI?: boolean;
}
