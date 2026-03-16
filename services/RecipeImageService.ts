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
   * Get a recipe image URL using the Pixabay API directly
   */
  public async generateRecipeImage(recipeTitle: string, recipeDescription: string, tags: string[]): Promise<string> {
    try {
      const apiKey = this.getPixabayApiKey();
      if (!apiKey) {
         console.warn("Pixabay API key not found. Please set VITE_PIXABAY_API_KEY in your .env. Falling back to placeholder.");
         return this.getSmartPlaceholderUrl(recipeTitle, tags);
      }

      // Encode the recipe title for the URL query
      const encodedQuery = encodeURIComponent(recipeTitle);
      const pixabayUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodedQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3`;

      const response = await fetch(pixabayUrl);

      if (response.ok) {
        const data = await response.json();
        
        // Return the first image result's webformatURL
        if (data && data.hits && data.hits.length > 0) {
          return data.hits[0].webformatURL;
        }
      }
      
      console.warn(`No images found on Pixabay or request failed (status: ${response.status}). Falling back to placeholder.`);
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