import { UserProfile } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

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
  image_url?: string;
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
  private userProfile: UserProfile;
  private settings: RecipeSettings;

  constructor(userProfile: UserProfile, settings: RecipeSettings) {
    this.userProfile = userProfile;
    this.settings = settings;
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  /**
   * Checks whether the user's message is related to food, cooking, nutrition,
   * recipes, or diabetes-friendly diet topics.
   */
  private async isOnTopic(userInput: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/ai/check-topic/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ message: userInput })
      });
      if (!res.ok) return true; // fail open
      const data = await res.json();
      return data.on_topic === true;
    } catch {
      return true; // fail open on error
    }
  }

  public async generateSmartSwapRecipe(userInput: string): Promise<{ message: string; recipes: RecipeIdea[] }> {
    // --- Out-of-context guard ---
    const onTopic = await this.isOnTopic(userInput);
    if (!onTopic) {
      return {
        message:
          "Oops! That's a bit outside my kitchen! I'm Doc Chef, your personal cooking and nutrition assistant. " +
          "I can help you with recipes, smart ingredient swaps, diabetes-friendly meal ideas, and more. " +
          "Try asking me something like \"What can I make with chicken?\" or \"Give me a low-carb Filipino dish\".",
        recipes: []
      };
    }
    // --- End out-of-context guard ---

    const prompt = this.buildSmartSwapPrompt(userInput);
    
    try {
      const res = await fetch(`${API_BASE}/api/ai/smart-swap/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ prompt })
      });
      
      if (!res.ok) {
        if (res.status === 429) throw new Error('Too many requests. Please try again later.');
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to generate smart swap recipe');
      }

      const parsed = await res.json();
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
      const { RecipeImageServiceAI } = await import('./RecipeImageServiceAI');
      
      const imageService = new RecipeImageServiceAI();
      const imageUrl = await imageService.generateRecipeImage(recipe.title, recipe.description, recipe.tags);
      
      const recipeToSave = {
        ...recipe,
        image_url: imageUrl
      };
      
      const savedRecipe = await saveRecipe(recipeToSave, this.settings);
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

  /**
   * Generates a conversational response (e.g., brainstorming, modifying a recipe).
   */
  async sendMessage(message: string, history: ChatMessage[], settings: RecipeSettings): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/ai/recipe-chat/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ message, history, settings })
      });
      
      if (!res.ok) {
        if (res.status === 429) throw new Error('Too many requests. Please try again later.');
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to communicate with AI.');
      }
      
      const data = await res.json();
      return data.text;
    } catch (error) {
      console.error("AI Communication Error:", error);
      throw error;
    }
  }
}