import { RecipeIdea } from './RecipeAuditorService';

export class RecipeManager {
  private recipes: RecipeIdea[] = [];

  public addRecipes(newRecipes: RecipeIdea[]): void {
    this.recipes.push(...newRecipes);
  }

  public getRecipes(): RecipeIdea[] {
    return [...this.recipes];
  }

  public clearRecipes(): void {
    this.recipes = [];
  }

  public getRecipeById(id: string): RecipeIdea | undefined {
    return this.recipes.find(recipe => recipe.id === id);
  }

  public removeRecipeById(id: string): boolean {
    const initialLength = this.recipes.length;
    this.recipes = this.recipes.filter(recipe => recipe.id !== id);
    return this.recipes.length !== initialLength;
  }

  public getRecipeCount(): number {
    return this.recipes.length;
  }

  public hasRecipes(): boolean {
    return this.recipes.length > 0;
  }

  public getRecipesByTag(tag: string): RecipeIdea[] {
    return this.recipes.filter(recipe => recipe.tags.includes(tag));
  }

  public getUniqueTags(): string[] {
    const tags = new Set<string>();
    this.recipes.forEach(recipe => {
      recipe.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }

  public generateRecipeId(): string {
    return `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public createRecipeFromAIResponse(aiRecipes: any[]): RecipeIdea[] {
    return aiRecipes.map((r, idx) => ({
      id: this.generateRecipeId(),
      title: r.title || '',
      description: r.description || '',
      tags: r.tags || [],
      ingredients: r.ingredients || [],
      preparation: r.preparation || [],
      instructions: r.instructions || []
    }));
  }
}