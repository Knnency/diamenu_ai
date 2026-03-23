import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Icons } from '../constants';
import { UserProfile } from '../types';
import { RecipeAuditorService, RecipeIdea } from '../services/RecipeAuditorService';
import { SettingsManager } from '../services/SettingsManager';
import { ChatManager } from '../services/ChatManager';
import { UIComponentManager } from '../services/UIComponentManager';

// Constants for dietary options and allergies
const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher', 'Pescatarian', 'Low-FODMAP'
];

const ALLERGY_OPTIONS = [
  'Dairy', 'Soy', 'Tree Nuts', 'Shellfish', 'Peanuts', 'Gluten', 'Eggs', 'Fish', 'Wheat', 'Sesame'
];

const SERVING_OPTIONS = [
  '1 person', '2 people', '3 people', '4 people', '5+ people'
];

const COUNTRY_OPTIONS = [
  'Philippines', 'United States', 'Japan', 'Other'
];

const Auditor: React.FC = () => {
  // Core service instances
  const chatManager = useRef(new ChatManager()).current;
  const uiManager = useRef(new UIComponentManager()).current;
  
  // User profile and settings
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    age: 30,
    type: 'Type 2',
    dietaryPreferences: [],
    allergens: []
  });

  const [settingsManager] = useState(() => new SettingsManager(userProfile));
  const [recipeService] = useState(() => new RecipeAuditorService(userProfile, settingsManager.getSettings()));
  
  // Local state for UI updates
  const [messages, setMessages] = useState(() => chatManager.getMessages());
  const [recipeIdeas, setRecipeIdeas] = useState<RecipeIdea[]>(() => {
    const stored = sessionStorage.getItem('auditor_recipe_ideas');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeIdea | null>(null);
  
  // Load real user settings into Auditor context
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Use 'current' as key per the settingsService singleton logic used elsewhere
        const { settingsService } = await import('../services/settingsService');
        const settings = await settingsService.getSettings('current');
        if (settings) {
          const loadedProfile = {
            name: settings.name || 'User',
            age: settings.age || 30,
            type: settings.diabetes_type || 'Type 2',
            dietaryPreferences: settings.dietary_preferences || [],
            allergens: settings.allergens || []
          };
          setUserProfile(loadedProfile);
          
          // Re-initialize manager settings to flush empty arrays down the pipeline
          settingsManager.updateSettings({
            dietaryOptions: [...loadedProfile.dietaryPreferences],
            allergies: [...loadedProfile.allergens]
          });
        }
      } catch (e) {
        console.error("Failed to load user settings into Auditor:", e);
      }
    };
    fetchSettings();
  }, [settingsManager]);
  
  // UI state from manager
  const [uiState, setUIState] = useState(() => uiManager.getState());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize UI manager subscription
  useEffect(() => {
    const unsubscribe = uiManager.subscribe((newState) => {
      setUIState(newState);
    });
    return unsubscribe;
  }, [uiManager]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update settings in recipe service when settings change
  useEffect(() => {
    recipeService.updateSettings(settingsManager.getSettings());
  }, [recipeService, settingsManager]);

  const handleSendMessage = async (e?: React.FormEvent, predefinedText?: string) => {
    e?.preventDefault();
    const textToSend = predefinedText || inputText;
    if (!textToSend.trim()) return;

    // Add user message to chat
    chatManager.addUserMessage(textToSend);
    setMessages(chatManager.getMessages());
    
    if (!predefinedText) {
      setInputText('');
    }
    
    setIsTyping(true);

    try {
      const result = await recipeService.generateSmartSwapRecipe(textToSend);
      
      // Add bot response
      chatManager.addBotMessage(result.message);
      setMessages(chatManager.getMessages());
      
      // Update recipe ideas
      if (result.recipes && result.recipes.length > 0) {
        setRecipeIdeas(result.recipes);
        sessionStorage.setItem('auditor_recipe_ideas', JSON.stringify(result.recipes));
      }
    } catch (error) {
      console.error("Error generating smart swap:", error);
      chatManager.addBotMessage("Sorry, I encountered an error while trying to process that recipe. Please try again.");
      setMessages(chatManager.getMessages());
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Settings management methods
  const handleSaveSettings = () => {
    const currentSettings = settingsManager.getSettings();
    setUserProfile(prev => ({
      ...prev,
      dietaryPreferences: currentSettings.dietaryOptions,
      allergens: currentSettings.allergies
    }));
    uiManager.setSettingsOpen(false);
  };

  const handleClearSettings = () => {
    settingsManager.clearSettings();
    uiManager.setSettingsOpen(false);
  };

  const handleResetToUserProfile = () => {
    settingsManager.resetToUserProfile();
    uiManager.setSettingsOpen(false);
  };

  // Settings form handlers
  const handleServingsChange = (servings: string) => {
    settingsManager.updateServings(servings);
  };

  const handleCountryChange = (country: string) => {
    settingsManager.updateCountry(country);
  };

  const handleDietaryOptionAdd = (option: string) => {
    settingsManager.addDietaryOption(option);
  };

  const handleDietaryOptionRemove = (option: string) => {
    settingsManager.removeDietaryOption(option);
  };

  const handleAllergyAdd = (allergy: string) => {
    settingsManager.addAllergy(allergy);
  };

  const handleAllergyRemove = (allergy: string) => {
    settingsManager.removeAllergy(allergy);
  };

  const handleIngredientAdd = (ingredient: string) => {
    settingsManager.addIngredientToAvoid(ingredient);
    uiManager.setNewIngredientText('');
    uiManager.setAddIngredientOpen(false);
  };

  const handleIngredientRemove = (ingredient: string) => {
    settingsManager.removeIngredientToAvoid(ingredient);
  };

  // Recipe management methods
  const handleRecipePreview = (recipe: RecipeIdea) => {
    setSelectedRecipe(recipe);
    uiManager.setPreviewOpen(true);
  };

  const handleRecipeSave = async (recipe: RecipeIdea) => {
    try {
      await recipeService.saveRecipe(recipe);
      // Show success message or feedback
      chatManager.addBotMessage(`Recipe "${recipe.title}" has been saved to your collection!`);
      setMessages(chatManager.getMessages());
      uiManager.setPreviewOpen(false);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      chatManager.addBotMessage(`Sorry, I couldn't save the recipe "${recipe.title}". Please try again.`);
      setMessages(chatManager.getMessages());
    }
  };

  // UI state management
  const handleSettingsOpen = () => {
    uiManager.setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    uiManager.setSettingsOpen(false);
  };

  const handleAddIngredientOpen = () => {
    uiManager.setAddIngredientOpen(true);
  };

  const handleAddIngredientClose = () => {
    uiManager.setAddIngredientOpen(false);
    uiManager.setNewIngredientText('');
  };

  const handlePreviewClose = () => {
    uiManager.setPreviewOpen(false);
    setSelectedRecipe(null);
  };

  const handlePreviewServingsChange = (servings: number) => {
    uiManager.setPreviewServings(servings);
  };

  const handlePreviewTextSizeChange = (size: number) => {
    uiManager.setPreviewTextSize(size);
  };

  const handleNewIngredientTextChange = (text: string) => {
    uiManager.setNewIngredientText(text);
  };

  const handleNewIngredientSubmit = () => {
    const text = uiState.newIngredientText.trim();
    if (text) {
      handleIngredientAdd(text);
    }
  };

  const handleClearChat = () => {
    chatManager.clearChat();
    setMessages(chatManager.getMessages());
    setRecipeIdeas([]);
    sessionStorage.removeItem('auditor_recipe_ideas');
  };

  const handleSuggestMoreRecipes = () => {
    handleSendMessage(undefined, "Suggest More Recipes");
  };

  const handleNotQuiteRight = () => {
    handleSendMessage(undefined, "Not quite what I had in mind");
  };

  // Get current settings for rendering
  const currentSettings = settingsManager.getSettings();

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in-up relative">
      {/* Left Panel: Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header & Tags */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Icons.Chef />
              </div>
              Doc Chef
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleSettingsOpen}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <Icons.User /> Settings
              </button>
              <button
                onClick={handleClearChat}
                className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5"
              >
                <Icons.Leaf /> New chat
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full">
              Servings: {currentSettings.servings}
            </span>
            {userProfile.dietaryPreferences.map(diet => (
              <span key={diet} className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full">
                Diet: {diet}
              </span>
            ))}
            {userProfile.allergens.map(allergy => (
              <span key={allergy} className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full">
                Allergy: {allergy}
              </span>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <Icons.Chef />
                </div>
              )}

              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${msg.sender === 'user'
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm'
                }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0 mt-1">
                  <Icons.User />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-1">
                <Icons.Chef />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the recipe you'd like to create..."
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:focus:border-accent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none text-sm"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center text-white bg-primary rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel: Recipe Ideas */}
      <div className="w-full lg:w-96 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icons.Leaf /> Recipe Ideas
          </h2>
          <span className="bg-primary/10 text-primary dark:text-accent text-xs font-bold px-2.5 py-1 rounded-full">
            {recipeIdeas.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {recipeIdeas.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Icons.Chart />
              <p className="text-sm text-center">Tell Doc Chef what you're craving to see recipe ideas here.</p>
            </div>
          ) : (
            recipeIdeas.map((recipe, index) => (
              <div key={recipe.id || `recipe-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-primary/50 dark:hover:border-accent/50 transition-colors bg-white dark:bg-gray-800 shadow-md">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{recipe.title}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {recipe.tags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs font-medium rounded-md flex items-center gap-1 whitespace-nowrap">
                      {tag === 'Soup' ? <Icons.Leaf /> : <Icons.User />} {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                  {recipe.description}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRecipePreview(recipe)}
                    className="flex-1 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Icons.Chart /> Preview
                  </button>
                  <button
                    onClick={() => handleRecipeSave(recipe)}
                    className="flex-1 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Icons.Bookmark /> Save
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-2">
          <button className="w-full py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
            <Icons.Check /> Bulk Save
          </button>
          <button
            onClick={handleNotQuiteRight}
            className="w-full py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Not quite what I had in mind
          </button>
          <button
            onClick={handleSuggestMoreRecipes}
            className="w-full py-2.5 text-sm font-medium text-primary dark:text-accent hover:text-teal-700 dark:hover:text-lime-300 transition-colors flex items-center justify-center gap-2"
          >
            <Icons.Leaf /> Suggest More Recipes
          </button>
        </div>
      </div>

      {/* Settings Modal Overlay */}
      {uiState.isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recipe Settings</h2>
              <button
                onClick={handleSettingsClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                  <Icons.User /> Basic Info
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servings</label>
                    <select
                      value={currentSettings.servings}
                      onChange={(e) => handleServingsChange(e.target.value)}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary dark:focus:border-accent focus:ring focus:ring-primary dark:focus:ring-accent focus:ring-opacity-20 py-2.5 px-3"
                    >
                      {SERVING_OPTIONS.map(serving => (
                        <option key={serving} value={serving}>{serving}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <select
                      value={currentSettings.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary dark:focus:border-accent focus:ring focus:ring-primary dark:focus:ring-accent focus:ring-opacity-20 py-2.5 px-3"
                    >
                      {COUNTRY_OPTIONS.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Dietary Preferences */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                  <Icons.Leaf /> Dietary Preferences
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dietary Options</label>
                    <div className="w-full min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 flex flex-wrap gap-1.5 items-center bg-white dark:bg-gray-700">
                      {currentSettings.dietaryOptions.map((option, idx) => (
                        <span key={`${option}-${idx}`} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium rounded-md flex items-center gap-1">
                          {option}
                          <button onClick={() => handleDietaryOptionRemove(option)} className="hover:text-emerald-900 dark:hover:text-emerald-100 ml-0.5">
                            &times;
                          </button>
                        </span>
                      ))}
                      <select
                        className="flex-1 min-w-[120px] border-none focus:ring-0 text-sm py-1 px-2 text-gray-500 dark:text-gray-300 bg-transparent dark:[&>option]:bg-gray-800"
                        onChange={(e) => {
                          if (e.target.value && !currentSettings.dietaryOptions.includes(e.target.value)) {
                            handleDietaryOptionAdd(e.target.value);
                          }
                          e.target.value = "";
                        }}
                      >
                        <option value="">Add option...</option>
                        {DIETARY_OPTIONS.filter(option => !currentSettings.dietaryOptions.includes(option)).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allergies to Avoid</label>
                    <div className="w-full min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-lg p-1.5 flex flex-wrap gap-1.5 items-center bg-white dark:bg-gray-700">
                      {currentSettings.allergies.map((allergy, idx) => (
                        <span key={`${allergy}-${idx}`} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium rounded-md flex items-center gap-1">
                          {allergy}
                          <button onClick={() => handleAllergyRemove(allergy)} className="hover:text-emerald-900 dark:hover:text-emerald-100 ml-0.5">
                            &times;
                          </button>
                        </span>
                      ))}
                      <select
                        className="flex-1 min-w-[120px] border-none focus:ring-0 text-sm py-1 px-2 text-gray-500 dark:text-gray-300 bg-transparent dark:[&>option]:bg-gray-800"
                        onChange={(e) => {
                          if (e.target.value && !currentSettings.allergies.includes(e.target.value)) {
                            handleAllergyAdd(e.target.value);
                          }
                          e.target.value = "";
                        }}
                      >
                        <option value="">No Allergies</option>
                        {ALLERGY_OPTIONS.filter(allergy => !currentSettings.allergies.includes(allergy)).map(allergy => (
                          <option key={allergy} value={allergy}>{allergy}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ingredients to Avoid</label>
                      <button
                        onClick={handleAddIngredientOpen}
                        className="text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        + Add Ingredient
                      </button>
                    </div>
                    <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500 dark:text-gray-400 min-h-[46px] flex flex-wrap gap-2">
                      {currentSettings.ingredientsToAvoid.length === 0 ? (
                        <span>No ingredients added</span>
                      ) : (
                        currentSettings.ingredientsToAvoid.map((ingredient, idx) => (
                          <span key={`${ingredient}-${idx}`} className="px-2.5 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-md flex items-center gap-1">
                            {ingredient}
                            <button onClick={() => handleIngredientRemove(ingredient)} className="hover:text-gray-900 dark:hover:text-white ml-0.5">
                              &times;
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handleSettingsClose}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearSettings}
                className="px-5 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear All
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal Overlay */}
      {uiState.isAddIngredientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Ingredient to Avoid</h2>
              <button
                onClick={handleAddIngredientClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Ingredient</label>
                <input
                  type="text"
                  value={uiState.newIngredientText}
                  onChange={(e) => handleNewIngredientTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNewIngredientSubmit();
                    }
                  }}
                  autoFocus
                  className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-500 focus:ring-opacity-20 py-2.5 px-3"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handleAddIngredientClose}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNewIngredientSubmit}
                disabled={!uiState.newIngredientText.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Ingredient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal Overlay */}
      {uiState.isPreviewOpen && selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#111] text-gray-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-800 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#1a1a1a]">
              <div className="flex items-center gap-2 text-orange-500 font-medium">
                <Icons.User /> Servings
              </div>
              <div className="flex items-center bg-black rounded-lg border border-gray-800 overflow-hidden">
                <span className="px-4 py-1 text-white font-medium">{uiState.previewServings}</span>
              </div>
              <button
                onClick={handlePreviewClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors bg-gray-900/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <p className="text-gray-400 text-lg leading-relaxed">
                {selectedRecipe.description}
              </p>

              {/* Ingredients */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Ingredients</h3>
                  <div className="flex items-center bg-black rounded-lg border border-gray-800 overflow-hidden">
                    <span className="px-3 py-1 text-orange-500 font-serif italic">T</span>
                    <button
                      onClick={() => handlePreviewTextSizeChange(Math.max(80, uiState.previewTextSize - 10))}
                      className="px-3 py-1 hover:bg-gray-800 transition-colors text-gray-400 border-l border-gray-800"
                    >-</button>
                    <span className="px-3 py-1 border-x border-gray-800 text-gray-300 text-sm">{uiState.previewTextSize}%</span>
                    <button
                      onClick={() => handlePreviewTextSizeChange(Math.min(150, uiState.previewTextSize + 10))}
                      className="px-3 py-1 hover:bg-gray-800 transition-colors text-gray-400"
                    >+</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8" style={{ fontSize: `${uiState.previewTextSize}%` }}>
                  {selectedRecipe.ingredients?.map((ingredient, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500/50 mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{ingredient}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparation */}
              {selectedRecipe.preparation && selectedRecipe.preparation.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Preparation</h3>
                  <div className="space-y-4" style={{ fontSize: `${uiState.previewTextSize}%` }}>
                    {selectedRecipe.preparation.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-orange-500 font-bold min-w-[1.5rem]">{idx + 1}.</span>
                        <p className="text-gray-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Instructions</h3>
                  <div className="space-y-6" style={{ fontSize: `${uiState.previewTextSize}%` }}>
                    {selectedRecipe.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-orange-500 font-bold min-w-[1.5rem]">{idx + 1}.</span>
                        <p className="text-gray-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-[#1a1a1a]">
              <button
                onClick={() => handleRecipeSave(selectedRecipe)}
                className="w-full py-3.5 text-base font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Icons.Bookmark /> Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auditor;