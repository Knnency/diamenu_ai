import { GoogleGenAI } from "@google/genai";
import { recipeImageService } from "./RecipeImageService";

/**
 * RecipeImageServiceAI
 *
 * Generates photorealistic food images using Google's Gemini image generation model.
 * Produces exact, AI-generated images of the dish — far more accurate than a
 * Pixabay keyword search.
 *
 * Falls back to the standard RecipeImageService (Pixabay) if AI generation fails
 * or if the API key is not available.
 */
export class RecipeImageServiceAI {
  private ai: GoogleGenAI;
  private readonly imageModel = "gemini-2.0-flash-preview-image-generation";

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Build a detailed, descriptive food photography prompt from a recipe title.
   * More descriptive prompts = more accurate and appetizing images.
   */
  private buildImagePrompt(recipeTitle: string, tags: string[]): string {
    const isFilipino = tags.some(t =>
      t.toLowerCase().includes('filipino') ||
      t.toLowerCase().includes('pinoy') ||
      t.toLowerCase().includes('pilipino')
    ) || /sinigang|adobo|kare|lechon|tinola|sisig|monggo|bangus|bulalo|menudo|mechado|caldereta|pinakbet|bistek/i.test(recipeTitle);

    const dishContext = isFilipino
      ? "traditional Filipino dish served in a clay or ceramic bowl on a wooden table, authentic Filipino food photography style"
      : "authentic dish served on a clean white plate with professional food styling";

    return [
      `Professional food photography of "${recipeTitle}".`,
      `A beautifully plated, appetizing, and realistic ${dishContext}.`,
      "Soft natural lighting from the side, shallow depth of field, sharp focus on the food.",
      "Close-up overhead or 45-degree angle shot. Restaurant-quality presentation.",
      "No text, no watermarks, no people. Only the food.",
    ].join(" ");
  }

  /**
   * Generate a photorealistic food image using Gemini's image generation.
   *
   * Returns a base64 data URL (data:image/png;base64,...) that can be used
   * directly in an <img> src attribute.
   *
   * Falls back to Pixabay (RecipeImageService) if generation fails.
   */
  public async generateRecipeImage(
    recipeTitle: string,
    recipeDescription: string,
    tags: string[]
  ): Promise<string> {
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("[RecipeImageServiceAI] No Gemini API key found. Falling back to Pixabay.");
        return recipeImageService.generateRecipeImage(recipeTitle, recipeDescription, tags);
      }

      const prompt = this.buildImagePrompt(recipeTitle, tags);
      console.log(`[RecipeImageServiceAI] Generating image for: "${recipeTitle}"`);
      console.log(`[RecipeImageServiceAI] Prompt: ${prompt}`);

      const response = await this.ai.models.generateContent({
        model: this.imageModel,
        contents: prompt,
        config: {
          responseModalities: ["Image"],
          numberOfImages: 1,
        } as any,
      });

      // Find the image part in the response
      const candidates = (response as any).candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data && part.inlineData?.mimeType) {
              const { data, mimeType } = part.inlineData;
              const dataUrl = `data:${mimeType};base64,${data}`;
              console.log(`[RecipeImageServiceAI] ✅ Image generated for: "${recipeTitle}"`);
              return dataUrl;
            }
          }
        }
      }

      // If we got a response but no image part, fall back
      console.warn("[RecipeImageServiceAI] No image in response. Falling back to Pixabay.");
      return recipeImageService.generateRecipeImage(recipeTitle, recipeDescription, tags);

    } catch (error: any) {
      console.error("[RecipeImageServiceAI] Image generation failed:", error?.message || error);
      console.warn("[RecipeImageServiceAI] Falling back to Pixabay search.");
      return recipeImageService.generateRecipeImage(recipeTitle, recipeDescription, tags);
    }
  }

  /**
   * Regenerate an image — useful for a "Refresh Image" button.
   * Each call produces a freshly generated, unique image.
   */
  public async regenerateRecipeImage(
    recipeTitle: string,
    tags: string[]
  ): Promise<string> {
    return this.generateRecipeImage(recipeTitle, "", tags);
  }
}

// Export singleton instance
export const recipeImageServiceAI = new RecipeImageServiceAI();
