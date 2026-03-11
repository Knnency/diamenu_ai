import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult, UserProfile } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const modelName = "gemini-3-flash-preview";

export const generateMealPlan = async (userProfile?: UserProfile): Promise<Record<string, Record<string, string>>> => {
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
      
      CRITICAL: You MUST strictly adhere to the user's allergens and dietary preferences. Do not include any ingredients they are allergic to.
    `;
  }

  const systemInstruction = `
    You are DiaMenu's core engine, a dual-agent system designed to help Filipino diabetics manage their diet.
    Generate a 7-day meal plan for a diabetic patient in the Philippines.
    Include Breakfast, Lunch, Dinner, and Snack for each day (Mon, Tue, Wed, Thu, Fri, Sat, Sun).
    Focus on low glycemic index, Filipino cuisine, and healthy swaps.
    ${profileContext}
    Return ONLY a JSON object where the keys are the days of the week ('Mon', 'Tue', etc.) and the values are objects with keys 'Breakfast', 'Lunch', 'Dinner', 'Snack' and string values representing the meal.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      Mon: {
        type: Type.OBJECT,
        properties: {
          Breakfast: { type: Type.STRING },
          Lunch: { type: Type.STRING },
          Dinner: { type: Type.STRING },
          Snack: { type: Type.STRING }
        }
      },
      Tue: {
        type: Type.OBJECT,
        properties: {
          Breakfast: { type: Type.STRING },
          Lunch: { type: Type.STRING },
          Dinner: { type: Type.STRING },
          Snack: { type: Type.STRING }
        }
      },
      Wed: {
        type: Type.OBJECT,
        properties: {
          Breakfast: { type: Type.STRING },
          Lunch: { type: Type.STRING },
          Dinner: { type: Type.STRING },
          Snack: { type: Type.STRING }
        }
      },
      Thu: {
        type: Type.OBJECT,
        properties: {
          Breakfast: { type: Type.STRING },
          Lunch: { type: Type.STRING },
          Dinner: { type: Type.STRING },
          Snack: { type: Type.STRING }
        }
      },
      Fri: {
        type: Type.OBJECT,
        properties: {
          Breakfast: { type: Type.STRING },
          Lunch: { type: Type.STRING },
          Dinner: { type: Type.STRING },
          Snack: { type: Type.STRING }
        }
      },
      Sat: {
        type: Type.OBJECT,
        properties: {
          Breakfast: { type: Type.STRING },
          Lunch: { type: Type.STRING },
          Dinner: { type: Type.STRING },
          Snack: { type: Type.STRING }
        }
      },
      Sun: {
        type: Type.OBJECT,
        properties: {
          Breakfast: { type: Type.STRING },
          Lunch: { type: Type.STRING },
          Dinner: { type: Type.STRING },
          Snack: { type: Type.STRING }
        }
      }
    }
  };

  const textPrompt = `Generate a concise 7-day diabetic-friendly Filipino meal plan. Keep meal descriptions short (e.g., "Oatmeal with Chia Seeds"). Do not include any extra text or explanations.`;

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
    
    return JSON.parse(text) as Record<string, Record<string, string>>;
  } catch (error) {
    console.error("Gemini Meal Plan Error:", error);
    throw error;
  }
};

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
