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
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

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

export const generateHealthAdvice = async (logs: any[]): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // Take up to the last 10 logs to give the AI context without overloading it
  const recentLogs = logs.slice(0, 10);

  if (recentLogs.length === 0) {
    return "No blood sugar logs available yet. Start logging your readings to receive personalized AI health advice!";
  }

  const systemInstruction = `
    You are a supportive, knowledgeable endocrinologist and AI health assistant inside the DiaMenu app.
    Your goal is to briefly analyze the user's recent blood sugar logs and provide a short, actionable, and encouraging 2-3 sentence piece of advice.
    Look for trends like consistently high morning fasting sugars, spikes after meals, or dangerous lows.
    Do NOT give explicit medical prescriptions. Suggest lifestyle or dietary adjustments (like trying more fiber, drinking water, taking a walk after dinner).
    Keep it friendly, empathetic, and concise. Only return the plain text paragraph. No markdown formatting.
  `;

  const textPrompt = `Here are the user's most recent blood sugar readings (latest first):\n${JSON.stringify(recentLogs, null, 2)}\n\nPlease provide a short supportive piece of advice based on these trends.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: textPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    if (!response.text) return "Keep up the great work tracking your health!";

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return "Unable to generate advice at this moment. Keep tracking your health!";
  }
};

export const generateGroceryList = async (
  plan: Record<string, Record<string, string>>,
  savedRecipes: any[]
): Promise<{ name: string; category: string; quantity: string; isHighGI: boolean }[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // Flatten the meal plan into an array of meal names
  const mealNames = Object.values(plan).flatMap(day => Object.values(day)).filter(name => name && name !== '-');

  if (mealNames.length === 0) return [];

  // Find which ones are saved recipes to provide exact ingredients
  const contextRecipes = mealNames.map(meal => {
    const found = savedRecipes.find(r => r.title === meal);
    return found ? { title: found.title, ingredients: found.ingredients } : { title: meal };
  });

  const systemInstruction = `
    You are an expert nutritionist and grocery planner for a diabetic patient in the Philippines.
    You will receive a list of upcoming meals along with their ingredients (if known).
    1. Extract and combine all raw ingredients needed to cook these meals over the week.
    2. Consolidate duplicates (e.g. if two recipes need Garlic, combine their quantities).
    3. Categorize them into standard grocery aisles (Produce, Meat, Dairy, Pantry, Spices, etc).
    4. MUST Flag any ingredient that has a High Glycemic Index (isHighGI: true), like white rice, sugar, white bread, pasta, potatoes, etc.
    
    Return ONLY a valid JSON array of objects.
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        category: { type: Type.STRING },
        quantity: { type: Type.STRING },
        isHighGI: { type: Type.BOOLEAN }
      }
    }
  };

  const textPrompt = `Generate a consolidated grocery list for these planned meals:\n${JSON.stringify(contextRecipes)}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: textPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      }
    });

    let text = response.text;
    if (!text) return [];
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as { name: string; category: string; quantity: string; isHighGI: boolean }[];
  } catch (error) {
    console.error("Gemini Grocery List Error:", error);
    return [];
  }
};
