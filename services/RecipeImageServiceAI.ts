import { recipeImageService } from "./RecipeImageService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * RecipeImageServiceAI
 *
 * PRIMARY: Generates photorealistic food images using Google's Gemini
 *   image generation model via our Django backend proxy.
 *
 * FALLBACK: If AI generation fails, falls back to the Pixabay
 *   RecipeImageService.
 */
export class RecipeImageServiceAI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // ✅ Correct model — this is the only Gemini model that outputs images
  // gemini-2.5-flash is a TEXT model and cannot generate images
  private readonly imageModel = "gemini-2.0-flash-preview-image-generation";

  constructor() {
    // No initialization needed since we use backend proxy
  }

  /**
   * Build a detailed, descriptive food photography prompt.
   * Detects Filipino dishes and adjusts the styling accordingly.
   */
  private buildImagePrompt(recipeTitle: string, tags: string[]): string {
    const isFilipino =
      tags.some((t) =>
        ["filipino", "pinoy", "pilipino"].some((kw) =>
          t.toLowerCase().includes(kw)
        )
      ) ||
      /sinigang|adobo|kare.?kare|lechon|tinola|sisig|monggo|bangus|bulalo|menudo|mechado|caldereta|pinakbet|bistek|nilaga|afritada|pochero|pakbet|ginataan|laing|dinuguan/i.test(
        recipeTitle
      );

    const dishContext = isFilipino
      ? "traditional Filipino dish served in a clay or ceramic bowl on a rustic wooden table, authentic Filipino food photography style"
      : "dish served on a clean white plate with professional food styling against a neutral background";

    // Strip medical/health modifiers from the title before using it in the prompt
    // to help the model focus on the food itself
    const foodFocusedTitle = recipeTitle
      .replace(
        /\b(diabetes-friendly|diabetic|low-carb|low-fat|low-gi|high-protein|sugar-free|healthy|whole wheat|lean)\b/gi,
        ""
      )
      .replace(/\([^)]*\)/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      `Professional close-up food photograph of "${foodFocusedTitle}".`,
      `A beautifully plated, realistic, and appetizing ${dishContext}.`,
      "Warm, soft studio lighting. Shallow depth of field. Sharp focus on the dish.",
      "Overhead or 45-degree angle shot. Clean background. No humans, no text, no watermarks.",
      "Highly detailed, restaurant-quality, mouth-watering food photography.",
    ].join(" ");
  }

  /**
   * Returns a base64 data URL (data:image/jpeg;base64,...) that works
   * everywhere — no external image URL dependency.
   *
   * Falls back to Pixabay (RecipeImageService) if generation fails.
   */
  public async generateRecipeImage(
    recipeTitle: string,
    recipeDescription: string,
    tags: string[]
  ): Promise<string> {
    try {
      const prompt = this.buildImagePrompt(recipeTitle, tags);
      console.log(`[RecipeImageServiceAI] Generating image for: "${recipeTitle}"`);
      
      const res = await fetch(`${API_BASE}/api/ai/generate-image/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        throw new Error(`AI Image API returned status: ${res.status}`);
      }

      const data = await res.json();
      if (!data.image) {
        throw new Error("No image data returned from AI");
      }

      return data.image;
    } catch (error) {
      console.error("[RecipeImageServiceAI] Gemini image generation failed, falling back to Pixabay:", error);
      return recipeImageService.generateRecipeImage(
        recipeTitle,
        recipeDescription,
        tags
      );
    }
  }

  /**
   * Regenerate an image — useful for a "Refresh Image" button.
   */
  public async regenerateRecipeImage(
    recipeTitle: string,
    tags: string[]
  ): Promise<string> {
    return this.generateRecipeImage(recipeTitle, "", tags);
  }
}

// Singleton
export const recipeImageServiceAI = new RecipeImageServiceAI();
