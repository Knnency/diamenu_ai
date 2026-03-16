export interface UIState {
  isSettingsOpen: boolean;
  isAddIngredientOpen: boolean;
  isPreviewOpen: boolean;
  previewServings: number;
  previewTextSize: number;
  newIngredientText: string;
}

export class UIComponentManager {
  private state: UIState;
  private listeners: Array<(state: UIState) => void> = [];

  constructor() {
    this.state = {
      isSettingsOpen: false,
      isAddIngredientOpen: false,
      isPreviewOpen: false,
      previewServings: 2,
      previewTextSize: 100,
      newIngredientText: ''
    };
  }

  public getState(): UIState {
    return { ...this.state };
  }

  public setSettingsOpen(isOpen: boolean): void {
    this.state.isSettingsOpen = isOpen;
    this.notifyListeners();
  }

  public setAddIngredientOpen(isOpen: boolean): void {
    this.state.isAddIngredientOpen = isOpen;
    this.notifyListeners();
  }

  public setPreviewOpen(isOpen: boolean): void {
    this.state.isPreviewOpen = isOpen;
    this.notifyListeners();
  }

  public setPreviewServings(servings: number): void {
    this.state.previewServings = Math.max(1, servings);
    this.notifyListeners();
  }

  public setPreviewTextSize(size: number): void {
    this.state.previewTextSize = Math.max(80, Math.min(150, size));
    this.notifyListeners();
  }

  public setNewIngredientText(text: string): void {
    this.state.newIngredientText = text;
    this.notifyListeners();
  }

  public incrementServings(): void {
    this.setPreviewServings(this.state.previewServings + 1);
  }

  public decrementServings(): void {
    this.setPreviewServings(this.state.previewServings - 1);
  }

  public incrementTextSize(): void {
    this.setPreviewTextSize(this.state.previewTextSize + 10);
  }

  public decrementTextSize(): void {
    this.setPreviewTextSize(this.state.previewTextSize - 10);
  }

  public resetPreviewSettings(): void {
    this.state.previewServings = 2;
    this.state.previewTextSize = 100;
    this.notifyListeners();
  }

  public subscribe(listener: (state: UIState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}