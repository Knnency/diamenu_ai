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
  HOME,
  AUDITOR,
  MEAL_PLAN,
  PROFILE,
  COMMUNITY,
  LOGIN,
  REGISTER,
  FORGOT_PASSWORD,
  SETTINGS
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
