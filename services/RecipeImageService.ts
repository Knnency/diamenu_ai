export interface RecipeImage {
  url: string;
  title: string;
  description?: string;
  confidence: number;
}

export class RecipeImageService {
  private getPixabayApiKey(): string {
    return (import.meta as any).env?.VITE_PIXABAY_API_KEY
      || (process as any).env?.REACT_APP_PIXABAY_API_KEY
      || (process as any).env?.PIXABAY_API_KEY
      || '';
  }

  /**
   * Extract the core food/dish name from a verbose recipe title.
   * e.g. "Diabetes-Friendly Chicken Adobo (1 Serving)" → "Chicken Adobo"
   * e.g. "Filipino-Inspired Low-Carb Chicken Adobo Pizza" → "Chicken Adobo Pizza"
   */
  private extractFoodName(title: string): string {
    let cleaned = title;

    // Remove parenthetical content like "(1 Serving)", "(Diabetes-Friendly)"
    cleaned = cleaned.replace(/\([^)]*\)/g, '');

    // Remove common health/diet modifier words (case-insensitive)
    const modifiersToRemove = [
      'diabetes-friendly', 'diabetic-friendly', 'diabetic',
      'low-carb', 'low-fat', 'low-sodium', 'low-sugar', 'low-calorie', 'low-gi',
      'high-protein', 'high-fiber',
      'sugar-free', 'gluten-free', 'dairy-free', 'grain-free',
      'heart-healthy', 'gut-friendly',
      'keto', 'paleo', 'vegan', 'vegetarian',
      'filipino-inspired', 'asian-inspired', 'mediterranean-inspired',
      'healthy', 'nutritious', 'wholesome', 'guilt-free',
      'smart-swap', 'modified', 'revamped', 'reimagined', 're-imagined',
      'type 1', 'type 2', 'pre-diabetic',
    ];

    for (const modifier of modifiersToRemove) {
      cleaned = cleaned.replace(new RegExp(`\\b${modifier}\\b`, 'gi'), '');
    }

    // Remove serving info like "1 Serving", "2 Servings", "for 4"
    cleaned = cleaned.replace(/\b\d+\s*servings?\b/gi, '');
    cleaned = cleaned.replace(/\bfor\s+\d+\b/gi, '');
    cleaned = cleaned.replace(/\bserves?\s+\d+\b/gi, '');

    // Collapse multiple spaces and trim
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

    // Remove leading/trailing hyphens or dashes left over
    cleaned = cleaned.replace(/^[\s\-–—]+|[\s\-–—]+$/g, '').trim();

    // If we stripped everything, fall back to the original title
    if (!cleaned || cleaned.length < 3) {
      cleaned = title.replace(/\([^)]*\)/g, '').trim();
    }

    return cleaned;
  }

  /**
   * Try a Pixabay search with the given query. Returns the image URL or null.
   */
  private async tryPixabaySearch(apiKey: string, query: string): Promise<string | null> {
    const encodedQuery = encodeURIComponent(query);
    const pixabayUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodedQuery}&image_type=photo&category=food&orientation=horizontal&safesearch=true&per_page=5`;

    const response = await fetch(pixabayUrl);
    if (response.ok) {
      const data = await response.json();
      if (data?.hits?.length > 0) {
        return data.hits[0].webformatURL;
      }
    }
    return null;
  }

  /**
   * Get a recipe image URL using the Pixabay API directly.
   * Uses a smart query extraction strategy to find the most relevant food image.
   */
  public async generateRecipeImage(recipeTitle: string, recipeDescription: string, tags: string[]): Promise<string> {
    try {
      const apiKey = this.getPixabayApiKey();
      if (!apiKey) {
        console.warn("Pixabay API key not found. Please set VITE_PIXABAY_API_KEY in your .env. Falling back to placeholder.");
        return this.getSmartPlaceholderUrl(recipeTitle, tags);
      }

      // Extract the core food name for a concise, accurate search
      const foodName = this.extractFoodName(recipeTitle);
      console.log(`[RecipeImageService] Title: "${recipeTitle}" → Search query: "${foodName}"`);

      // Strategy 1: Search with the extracted food name
      let imageUrl = await this.tryPixabaySearch(apiKey, foodName);
      if (imageUrl) return imageUrl;

      // Strategy 2: Try with just the last 2-3 significant words (the dish name)
      const words = foodName.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 2) {
        const shortQuery = words.slice(-3).join(' ');
        console.log(`[RecipeImageService] Retrying with shorter query: "${shortQuery}"`);
        imageUrl = await this.tryPixabaySearch(apiKey, shortQuery);
        if (imageUrl) return imageUrl;
      }

      // Strategy 3: Use the first relevant tag + "food" as a last resort
      if (tags.length > 0) {
        const tagQuery = `${tags[0]} food`;
        console.log(`[RecipeImageService] Retrying with tag query: "${tagQuery}"`);
        imageUrl = await this.tryPixabaySearch(apiKey, tagQuery);
        if (imageUrl) return imageUrl;
      }

      console.warn(`No images found on Pixabay for "${foodName}". Falling back to placeholder.`);
      return this.getSmartPlaceholderUrl(recipeTitle, tags);

    } catch (error) {
      console.error("Error fetching recipe image from Pixabay:", error);
      return this.getFallbackImageUrl(recipeTitle);
    }
  }

  /**
   * Get a smart placeholder URL based on recipe title and tags
   */
  private getSmartPlaceholderUrl(title: string, tags: string[]): string {
    // Create a seed based on title and tags for consistent images
    const seed = this.generateSeed(title, tags);

    // Use different placeholder services based on recipe type
    if (tags.some(tag => tag.toLowerCase().includes('filipino'))) {
      return `https://picsum.photos/seed/filipino-${seed}/400/300`;
    } else if (tags.some(tag => tag.toLowerCase().includes('healthy'))) {
      return `https://picsum.photos/seed/healthy-${seed}/400/300`;
    } else if (tags.some(tag => tag.toLowerCase().includes('low-carb'))) {
      return `https://picsum.photos/seed/lowcarb-${seed}/400/300`;
    } else if (tags.some(tag => tag.toLowerCase().includes('vegetarian'))) {
      return `https://picsum.photos/seed/vegetarian-${seed}/400/300`;
    } else if (tags.some(tag => tag.toLowerCase().includes('soup'))) {
      return `https://picsum.photos/seed/soup-${seed}/400/300`;
    }

    // Default placeholder
    return `https://picsum.photos/seed/recipe-${seed}/400/300`;
  }

  /**
   * Generate a consistent seed for placeholder images
   */
  private generateSeed(title: string, tags: string[]): string {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const tagString = tags.slice(0, 2).join('-').toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${cleanTitle}-${tagString}`.substring(0, 50);
  }


  /**
   * Get fallback image URL when AI generation fails
   */
  private getFallbackImageUrl(title: string): string {
    const seed = title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
    return `https://picsum.photos/seed/${seed}/400/300`;
  }

  /**
   * Search for real recipe images using external APIs (future implementation)
   */
  public async searchRecipeImages(recipeTitle: string, tags: string[]): Promise<RecipeImage[]> {
    // This would integrate with services like:
    // - Unsplash API for food photography
    // - Spoonacular API for recipe images
    // - Edamam API for food images
    // - Custom trained model for recipe image recognition

    // For now, return smart placeholders
    const mainImage = await this.generateRecipeImage(recipeTitle, '', tags);

    return [{
      url: mainImage,
      title: recipeTitle,
      description: `Image for ${recipeTitle}`,
      confidence: 0.8
    }];
  }

  /**
   * Validate if an image URL is accessible
   */
  public async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch {
      return false;
    }
  }

  /**
   * Get multiple image options for a recipe
   */
  public async getRecipeImageOptions(recipeTitle: string, description: string, tags: string[]): Promise<string[]> {
    const primaryImage = await this.generateRecipeImage(recipeTitle, description, tags);

    // Generate fallback options
    const fallbackImages = [
      this.getSmartPlaceholderUrl(recipeTitle, tags),
      this.getFallbackImageUrl(recipeTitle),
      `https://picsum.photos/seed/recipe-${Date.now()}/400/300`
    ];

    // Validate and filter accessible images
    const validImages = [primaryImage];

    for (const imageUrl of fallbackImages) {
      if (imageUrl !== primaryImage && await this.validateImageUrl(imageUrl)) {
        validImages.push(imageUrl);
        if (validImages.length >= 3) break;
      }
    }

    return validImages;
  }
}

// Export singleton instance
export const recipeImageService = new RecipeImageService();