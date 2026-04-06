import { AuditResult, UserProfile } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const evaluateWeeklyPlan = async (plan: Record<string, Record<string, string>>): Promise<Record<string, Record<string, { status: 'good' | 'warning' | 'bad', reason: string }>>> => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/evaluate-plan/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ plan })
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to evaluate plan');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    throw error;
  }
};

export const auditRecipeWithAI = async (recipeInput: string, userProfile?: UserProfile): Promise<AuditResult> => {
  // Mitigation for T-02: AI Prompt Injection length limits
  if (recipeInput.length > 2000) {
    throw new Error("Recipe input is too long. Please limit to 2000 characters.");
  }

  try {
    const res = await fetch(`${API_BASE}/api/ai/audit-recipe/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipeInput, userProfile })
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to audit recipe');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};

export const extractLabResultsFromImage = async (base64Data: string, mimeType: string): Promise<{ hba1c: string, fbs: string, total_cholesterol: string }> => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/extract-labs/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ base64Data, mimeType })
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to extract lab results');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Lab Extraction Error:", error);
    throw error;
  }
};

export const generateHealthAdvice = async (logs: any[], userProfile: UserProfile): Promise<string> => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/health-advice/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ logs, userProfile })
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to generate advice');
    }
    
    const data = await res.json();
    return data.advice || "Keep up the great work tracking your health!";
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Unable to generate advice at this moment. Keep tracking your health!";
  }
};

export const generateGroceryList = async (
  plan: Record<string, Record<string, string>>,
  savedRecipes: any[]
): Promise<{ name: string; category: string; quantity: string; isHighGI: boolean }[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/grocery-list/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ plan, savedRecipes })
    });
    
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to generate grocery list');
    }
    
    return await res.json();
  } catch (error) {
    console.error("Gemini Grocery List Error:", error);
    return [];
  }
};
