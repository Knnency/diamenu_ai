import { GoogleGenAI } from "@google/genai";
import { recipeImageService } from "./RecipeImageService";

/**
 * RecipeImageServiceAI
 *
 * PRIMARY: Generates photorealistic food images using Google's Gemini
 *   image generation model (gemini-2.0-flash-preview-image-generation).
 *   Returns a base64 data URL, so it works in any environment without
 *   needing a separate Pixabay API key.
 *
 * FALLBACK: If AI generation fails, falls back to the Pixabay
 *   RecipeImageService which requires VITE_PIXABAY_API_KEY.
 */
export class RecipeImageServiceAI {
  private ai: GoogleGenAI;

  // ✅ Correct model — this is the only Gemini model that outputs images
  // gemini-2.5-flash is a TEXT model and cannot generate images
  private readonly imageModel = "gemini-2.0-flash-preview-image-generation";

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    this.ai = new GoogleGenAI({ apiKey });
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
   * Generate a photorealistic food image using Gemini's image generation model.
   *
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
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn(
        "[RecipeImageServiceAI] VITE_GEMINI_API_KEY not found. Falling back to Pixabay."
      );
      return recipeImageService.generateRecipeImage(
        recipeTitle,
        recipeDescription,
        tags
      );
    }

    try {
      const prompt = this.buildImagePrompt(recipeTitle, tags);
      console.log(`[RecipeImageServiceAI] Generating image for: "${recipeTitle}"`);

      const response = await this.ai.models.generateContent({
        model: this.imageModel,
        contents: prompt,
        config: {
          // NOTE: responseModalities MUST include "Image" for image generation
          responseModalities: ["Image", "Text"],
          numberOfImages: 1,
        } as any,
      });

      // Safely navigate the response to find the image inline data
      const candidates = (response as any)?.candidates;
      if (Array.isArray(candidates) && candidates.length > 0) {
        const parts = candidates[0]?.content?.parts;
        if (Array.isArray(parts)) {
          for (const part of parts) {
            if (part?.inlineData?.data && part?.inlineData?.mimeType) {
              const { data, mimeType } = part.inlineData;
              console.log(
                `[RecipeImageServiceAI] ✅ AI image generated for: "${recipeTitle}" (${mimeType})`
              );
              return `data:${mimeType};base64,${data}`;
            }
          }
        }
      }

      // Response came back but had no image — fall back
      console.warn(
        `[RecipeImageServiceAI] Response had no image part for "${recipeTitle}". Falling back to Pixabay.`
      );
      return recipeImageService.generateRecipeImage(
        recipeTitle,
        recipeDescription,
        tags
      );
    } catch (error: any) {
      console.error(
        `[RecipeImageServiceAI] Image generation failed for "${recipeTitle}":`,
        error?.message || error
      );
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
