import { UserProfile } from '../types';
import { RecipeSettings } from './RecipeAuditorService';

export class SettingsManager {
  private settings: RecipeSettings;
  private userProfile: UserProfile;

  constructor(userProfile: UserProfile) {
    this.userProfile = userProfile;
    this.settings = this.initializeSettings();
  }

  private initializeSettings(): RecipeSettings {
    return {
      servings: '1 person',
      country: 'Philippines',
      dietaryOptions: [...this.userProfile.dietaryPreferences],
      allergies: [...this.userProfile.allergens],
      ingredientsToAvoid: []
    };
  }

  public getSettings(): RecipeSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<RecipeSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public updateServings(servings: string): void {
    this.settings.servings = servings;
  }

  public updateCountry(country: string): void {
    this.settings.country = country;
  }

  public addDietaryOption(option: string): void {
    if (!this.settings.dietaryOptions.includes(option)) {
      this.settings.dietaryOptions.push(option);
    }
  }

  public removeDietaryOption(option: string): void {
    this.settings.dietaryOptions = this.settings.dietaryOptions.filter(o => o !== option);
  }

  public addAllergy(allergy: string): void {
    if (!this.settings.allergies.includes(allergy)) {
      this.settings.allergies.push(allergy);
    }
  }

  public removeAllergy(allergy: string): void {
    this.settings.allergies = this.settings.allergies.filter(a => a !== allergy);
  }

  public addIngredientToAvoid(ingredient: string): void {
    const trimmedIngredient = ingredient.trim();
    if (trimmedIngredient && !this.settings.ingredientsToAvoid.includes(trimmedIngredient)) {
      this.settings.ingredientsToAvoid.push(trimmedIngredient);
    }
  }

  public removeIngredientToAvoid(ingredient: string): void {
    this.settings.ingredientsToAvoid = this.settings.ingredientsToAvoid.filter(i => i !== ingredient);
  }

  public clearSettings(): void {
    this.settings = {
      servings: '1 person',
      country: 'Philippines',
      dietaryOptions: [],
      allergies: [],
      ingredientsToAvoid: []
    };
  }

  public resetToUserProfile(): void {
    this.settings = {
      servings: '2 people',
      country: 'Philippines',
      dietaryOptions: [...this.userProfile.dietaryPreferences],
      allergies: [...this.userProfile.allergens],
      ingredientsToAvoid: []
    };
  }

  public getAvailableDietaryOptions(): string[] {
    return [
      'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher', 'Pescatarian', 'Low-FODMAP'
    ];
  }

  public getAvailableAllergies(): string[] {
    return [
      'Dairy', 'Soy', 'Tree Nuts', 'Shellfish', 'Peanuts', 'Gluten', 'Eggs', 'Fish', 'Wheat', 'Sesame'
    ];
  }

  public getAvailableServings(): string[] {
    return [
      '1 person', '2 people', '3 people', '4 people', '5+ people'
    ];
  }

  public getAvailableCountries(): string[] {
    return [
      'Philippines', 'United States', 'Japan', 'Other'
    ];
  }
}