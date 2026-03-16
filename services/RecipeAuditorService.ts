import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export interface RecipeIdea {
  id: string;
  title: string;
  tags: string[];
  description: string;
  ingredients?: string[];
  preparation?: string[];
  instructions?: string[];
}

export interface RecipeSettings {
  servings: string;
  country: string;
  dietaryOptions: string[];
  allergies: string[];
  ingredientsToAvoid: string[];
}

export class RecipeAuditorService {
  private ai: GoogleGenAI | null = null;
  private userProfile: UserProfile;
  private settings: RecipeSettings;

  constructor(userProfile: UserProfile, settings: RecipeSettings) {
    this.userProfile = userProfile;
    this.settings = settings;
    this.initializeAI();
  }

  private initializeAI(): void {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  public async generateSmartSwapRecipe(userInput: string): Promise<{ message: string; recipes: RecipeIdea[] }> {
    if (!this.ai) {
      throw new Error("AI service not initialized - missing API key");
    }

    const prompt = this.buildSmartSwapPrompt(userInput);
    
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: {
                type: Type.STRING,
                description: "A friendly message explaining the smart swaps made based on the user's profile."
              },
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    preparation: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "description", "tags", "ingredients", "instructions"]
                }
              }
            },
            required: ["message", "recipes"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from AI service");
      }

      const parsed = JSON.parse(responseText);
      if (parsed.recipes && Array.isArray(parsed.recipes)) {
        parsed.recipes = parsed.recipes.map((r: any) => ({
          ...r,
          id: r.id || Math.random().toString(36).substring(2, 11)
        }));
      }
      return parsed;
    } catch (error) {
      console.error("Error generating smart swap recipe:", error);
      throw new Error("Failed to generate recipe suggestions");
    }
  }

  private buildSmartSwapPrompt(userInput: string): string {
    return `
      The user wants to make: "${userInput}".
      
      User Profile:
      - Diabetes Type: ${this.userProfile.type}
      - Dietary Preferences: ${this.settings.dietaryOptions.join(', ')}
      - Allergies: ${this.settings.allergies.join(', ')}
      - Ingredients to Avoid: ${this.settings.ingredientsToAvoid.join(', ')}
      - Servings: ${this.settings.servings}
      - Country/Cuisine Context: ${this.settings.country}

      Apply the "Smart Swap" technique: 
      1. Identify ingredients in the traditional recipe that are unhealthy for this user's profile (e.g., high glycemic index, allergens, non-compliant with diet).
      2. Swap them with healthier, compliant alternatives (e.g., white rice -> cauliflower rice, sugar -> stevia/monk fruit, pork -> chicken/beef if Halal).
      3. Provide a friendly chat message explaining the specific smart swaps you made and why they are better for their profile.
      4. Provide 1 to 2 modified recipe ideas incorporating these smart swaps.
    `;
  }

  public updateUserProfile(profile: UserProfile): void {
    this.userProfile = profile;
  }

  public updateSettings(settings: RecipeSettings): void {
    this.settings = settings;
  }

  public getSettings(): RecipeSettings {
    return { ...this.settings };
  }

  public getUserProfile(): UserProfile {
    return { ...this.userProfile };
  }

  public async saveRecipe(recipe: RecipeIdea): Promise<RecipeIdea> {
    try {
      // Import the saveRecipe function from authService
      const { saveRecipe } = await import('./authService');
      
      const savedRecipe = await saveRecipe(recipe, this.settings);
      return savedRecipe;
    } catch (error) {
      console.error("Error saving recipe:", error);
      throw new Error("Failed to save recipe to database");
    }
  }

  public async getSavedRecipes(): Promise<RecipeIdea[]> {
    try {
      const { getSavedRecipes } = await import('./authService');
      
      const savedRecipes = await getSavedRecipes();
      return savedRecipes;
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      throw new Error("Failed to fetch saved recipes from database");
    }
  }

  public async deleteSavedRecipe(recipeId: number): Promise<void> {
    try {
      const { deleteSavedRecipe } = await import('./authService');
      
      await deleteSavedRecipe(recipeId);
    } catch (error) {
      console.error("Error deleting saved recipe:", error);
      throw new Error("Failed to delete saved recipe from database");
    }
  }
}