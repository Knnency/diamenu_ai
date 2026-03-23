import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult, UserProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const modelName = "gemini-3-flash-preview";


export const evaluateWeeklyPlan = async (plan: Record<string, Record<string, string>>): Promise<Record<string, Record<string, { status: 'good' | 'warning' | 'bad', reason: string }>>> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const systemInstruction = `
    You are a strict Endocrinologist evaluating a 7-day meal plan for a diabetic patient in the Philippines.
    For each meal provided, evaluate if it is 'good', 'warning', or 'bad' for a diabetic based on glycemic index and sugar content.
    Provide a short 1-sentence reason for your evaluation.
    Return ONLY a JSON object matching the structure of the input plan, where the value for each meal is an object with 'status' and 'reason'.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      Mon: { type: Type.OBJECT, properties: { Breakfast: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Lunch: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Dinner: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Snack: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } } } },
      Tue: { type: Type.OBJECT, properties: { Breakfast: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Lunch: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Dinner: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Snack: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } } } },
      Wed: { type: Type.OBJECT, properties: { Breakfast: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Lunch: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Dinner: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Snack: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } } } },
      Thu: { type: Type.OBJECT, properties: { Breakfast: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Lunch: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Dinner: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Snack: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } } } },
      Fri: { type: Type.OBJECT, properties: { Breakfast: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Lunch: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Dinner: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Snack: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } } } },
      Sat: { type: Type.OBJECT, properties: { Breakfast: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Lunch: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Dinner: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Snack: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } } } },
      Sun: { type: Type.OBJECT, properties: { Breakfast: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Lunch: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Dinner: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } }, Snack: { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING } } } } }
    }
  };

  const textPrompt = `Evaluate this meal plan: ${JSON.stringify(plan)}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: textPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text) as Record<string, Record<string, { status: 'good' | 'warning' | 'bad', reason: string }>>;
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    throw error;
  }
};

export const auditRecipeWithAI = async (recipeInput: string, userProfile?: UserProfile): Promise<AuditResult> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  let profileContext = "";
  if (userProfile) {
    profileContext = `
      User Profile Context:
      - Age: ${userProfile.age}
      - Diabetes Type: ${userProfile.type}
      - Dietary Preferences: ${userProfile.dietaryPreferences.join(', ') || 'None'}
      - Allergens: ${userProfile.allergens.join(', ') || 'None'}
      - Medical Restrictions: ${userProfile.medicalDetails?.restrictions || 'None'}
      
      CRITICAL: You MUST strictly adhere to the user's allergens and dietary preferences. Do not suggest any ingredients they are allergic to.
    `;
  }

  const systemInstruction = `
    You are DiaMenu's core engine, a dual-agent system designed to help Filipino diabetics manage their diet.
    
    Agent 1: The Doctor (Endocrinologist)
    - Strict, focuses on glycemic index, sugar content, and long-term health risks.
    - Identifies "red flags" in ingredients (e.g., white rice, refined sugar, excessive sodium).
    
    Agent 2: The Chef (Filipino Home Cook)
    - Creative, practical, and culturally aware.
    - Suggests realistic "Smart Swaps" available in a typical Philippines 'palengke' or supermarket.
    - Focuses on flavor preservation while lowering GI.
    - Suggests Adlai, Brown Rice, Cauliflower Rice, Stevia, Monkfruit, Tofu, Monggo, Malunggay, etc.

    ${profileContext}

    Your Output MUST be strictly valid JSON matching the schema provided.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      safetyScore: { type: Type.NUMBER, description: "0 to 100, where 100 is perfectly safe for a diabetic." },
      portionWeight: { type: Type.STRING, description: "Estimated total portion weight or serving size (e.g., '250g', '1 bowl (300g)')." },
      ingredientsList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of all identified ingredients in the food." },
      doctorAnalysis: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, description: "A short professional verdict (e.g., 'High Risk', 'Moderate', 'Approved')." },
          concerns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific health concerns." },
          glycemicIndexEstimate: { type: Type.STRING, description: "Estimated GI (Low/Medium/High)." }
        }
      },
      chefSwaps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            originalIngredient: { type: Type.STRING },
            suggestedSwap: { type: Type.STRING },
            reason: { type: Type.STRING },
            localContext: { type: Type.STRING, description: "Where to buy or how it fits Filipino cuisine." }
          }
        }
      },
      nutritionalInfo: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          fat: { type: Type.NUMBER }
        }
      }
    }
  };

  const textPrompt = `Audit this recipe/meal for a Type 2 Diabetic patient in the Philippines: ${recipeInput}. Keep your analysis concise and strictly follow the JSON schema.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: textPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text) as AuditResult;
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
};

export const extractLabResultsFromImage = async (base64Data: string, mimeType: string): Promise<{ hba1c: string, fbs: string, total_cholesterol: string }> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const systemInstruction = `
    You are a medical data extraction assistant.
    Extract the following lab results from the provided image:
    1. HbA1c Level (%)
    2. Fasting Blood Sugar or Fasting Plasma Glucose (mg/dL)
    3. Total Cholesterol (mg/dL)

    Return ONLY a valid JSON object. If a value is not found, return an empty string. Only extract the numerical values and units.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      hba1c: { type: Type.STRING, description: "HbA1c Level, e.g., '7.2%'" },
      fbs: { type: Type.STRING, description: "Fasting Blood Sugar / Fasting Plasma Glucose, e.g., '120 mg/dL'" },
      total_cholesterol: { type: Type.STRING, description: "Total Cholesterol, e.g., '180 mg/dL'" }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: "Extract the lab results from this image." }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      }
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text) as { hba1c: string, fbs: string, total_cholesterol: string };
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
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
