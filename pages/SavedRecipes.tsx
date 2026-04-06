import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { SavedRecipe, getSavedRecipes, deleteSavedRecipe } from '../services/authService';
import { getMealPlan, saveMealPlan } from '../services/mealPlanService';

import RecipePreviewModal from '../components/RecipePreviewModal';
import { toast } from 'sonner';

interface RecipeWithImage extends SavedRecipe {
  imageUrl: string;
  isImageLoading: boolean;
  imageError: boolean;
}

const SavedRecipes: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<RecipeWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // --- Add to Meal Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedMealType, setSelectedMealType] = useState('Dinner');
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [addingRecipeError, setAddingRecipeError] = useState<string | null>(null);

  // Load saved recipes from database
  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const savedRecipes = await getSavedRecipes();
      
      // Recipes now have image_url from the backend
      const recipesWithImages = savedRecipes.map((recipe) => {
        const imageUrl = recipe.image_url 
          ? (import.meta.env.DEV ? `http://127.0.0.1:8000${recipe.image_url}` : recipe.image_url) 
          : `https://picsum.photos/seed/recipe-${recipe.id}/400/300`;
        
        return {
          ...recipe,
          imageUrl,
          isImageLoading: false,
          imageError: false
        };
      });
      
      setRecipes(recipesWithImages);
    } catch (err) {
      console.error('Failed to load saved recipes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load saved recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      setDeletingId(recipeId);
      await deleteSavedRecipe(parseInt(recipeId));
      
      // Remove from local state
      setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
    } catch (err) {
      console.error('Failed to delete recipe:', err);
      toast.error('Failed to delete recipe. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageError = (recipeId: string) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === recipeId 
        ? { ...recipe, imageError: true, imageUrl: `https://picsum.photos/seed/fallback-${recipeId}/400/300` }
        : recipe
    ));
  };

  const handleRetryImage = async (recipe: RecipeWithImage) => {
    // This function is now only for placeholder fallbacks, not regeneration
    // In the future, we could add a DB update here to persist the new image
    setRecipes(prev => prev.map(r => 
      r.id === recipe.id 
        ? { ...r, imageUrl: `https://picsum.photos/seed/retry-${recipe.id}/400/300`, imageError: false }
        : r
    ));
  };

  const handlePreviewRecipe = (recipe: RecipeWithImage) => {
    setSelectedRecipe(recipe);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedRecipe(null);
  };

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    recipe.dietary_options.some(option => option.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate recipe statistics
  const totalRecipes = recipes.length;
  const avgSafetyScore = recipes.length > 0 
    ? Math.round(recipes.reduce((sum, recipe) => sum + (recipe.tags.length * 10), 0) / recipes.length)
    : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-16 bg-red-50 dark:bg-red-900/30 rounded-2xl border border-red-100 dark:border-red-800">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
            <Icons.Alert />
          </div>
          <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">Failed to Load Recipes</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button 
            onClick={loadSavedRecipes}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // --- Add to Meal Modal Logic ---

  const handleOpenModal = (recipe: RecipeWithImage) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
    setAddingRecipeError(null);
  };

  const closeMealModal = () => {
    setIsModalOpen(false);
    if (!showPreview) {
      setSelectedRecipe(null);
    }
  };

  const handleConfirmAddToMeal = async () => {
    if (!selectedRecipe) return;

    setIsAddingRecipe(true);
    setAddingRecipeError(null);

    try {
      // 1. Fetch current plan
      let currentPlan: Record<string, Record<string, string>> = {};
      try {
        currentPlan = await getMealPlan();
      } catch (err: any) {
        if (err.message !== 'PLAN_NOT_FOUND') throw err;
        // If not found, use default empty structure
      }

      // 2. Update the specific slot
      const updatedPlan = {
        ...currentPlan,
        [selectedDay]: {
          ...(currentPlan[selectedDay] || {}),
          [selectedMealType]: selectedRecipe.title
        }
      };

      // 3. Save it back
      await saveMealPlan(updatedPlan);
      
      // Close and show success
      closeMealModal();
      toast.success(`Successfully added "${selectedRecipe.title}" to ${selectedDay} ${selectedMealType}!`);
      
    } catch (err: any) {
       console.error("Failed to add recipe to meal plan", err);
       setAddingRecipeError("Failed to update meal plan. Please try again.");
    } finally {
       setIsAddingRecipe(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with Statistics */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Saved Recipes</h1>
            <p className="text-gray-600 dark:text-gray-400">Your personal collection of diabetes-friendly meals.</p>
          </div>
          {totalRecipes > 0 && (
            <div className="flex gap-4 mt-4 sm:mt-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalRecipes}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Recipes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{avgSafetyScore}%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg Score</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search saved recipes, tags, or dietary options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>
        <button 
          onClick={() => setSearchQuery('')}
          className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Icons.Refresh />
          Clear
        </button>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Recipe Image */}
              <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                {recipe.isImageLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recipe.imageError ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Icons.Image className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Image not available</p>
                      <button 
                        onClick={() => handleRetryImage(recipe)}
                        className="mt-2 text-xs text-primary dark:text-accent hover:text-teal-700 dark:hover:text-lime-300"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={recipe.imageUrl} 
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(recipe.id)}
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {/* Delete Button */}
                <button 
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  disabled={deletingId === recipe.id}
                  className="absolute top-3 left-3 w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 dark:text-gray-300 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Remove from saved"
                >
                  {deletingId === recipe.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

                {/* Recipe Stats */}
                <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                  {recipe.tags.length} tags
                </div>
                <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 shadow-sm">
                  {recipe.ingredients?.length || 0} ingredients
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{recipe.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{recipe.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {recipe.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md">
                      {tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md">
                      +{recipe.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Recipe Details */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1" title="Servings">
                      <Icons.User className="w-4 h-4" />
                      {recipe.servings}
                    </div>
                    <div className="flex items-center gap-1" title="Country">
                      <Icons.Globe className="w-4 h-4" />
                      {recipe.country}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500" title="Created date">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Dietary Options */}
                {recipe.dietary_options.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap gap-1">
                      {recipe.dietary_options.slice(0, 2).map(option => (
                        <span key={option} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded">
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handlePreviewRecipe(recipe)}
                    className="flex-1 px-4 py-2 border border-primary dark:border-accent text-primary dark:text-accent rounded-lg hover:bg-primary dark:hover:bg-accent hover:text-white dark:hover:text-gray-900 transition-colors font-medium"
                    title="Preview recipe details"
                  >
                    Preview
                  </button>
                  <button 
                    onClick={() => handleOpenModal(recipe)}
                    className="flex-1 px-4 py-2 bg-primary dark:bg-accent text-white dark:text-gray-900 rounded-lg hover:bg-teal-700 dark:hover:bg-lime-400 transition-colors font-medium"
                    title="Add to meal plan"
                  >
                    Add to Meal
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <Icons.Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {searchQuery ? "No recipes found" : "No saved recipes yet"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            {searchQuery 
              ? "We couldn't find any saved recipes matching your search. Try different keywords."
              : "You haven't saved any recipes yet. Start auditing recipes in the Auditor to build your collection!"
            }
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-primary dark:text-accent font-medium hover:text-teal-700 dark:hover:text-lime-300"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Add to Meal Modal */}
      {isModalOpen && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl">
             <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Add to Meal Plan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Select when you want to eat <span className="font-semibold">{selectedRecipe.title}</span>.</p>
                
                {addingRecipeError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-100 dark:border-red-800">
                    {addingRecipeError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Week</label>
                    <select 
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-primary dark:focus:border-accent outline-none"
                    >
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meal Time</label>
                    <select 
                      value={selectedMealType}
                      onChange={(e) => setSelectedMealType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary dark:focus:ring-accent focus:border-primary dark:focus:border-accent outline-none"
                    >
                      {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(meal => (
                        <option key={meal} value={meal}>{meal}</option>
                      ))}
                    </select>
                  </div>
                </div>
             </div>
             
             <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex gap-3 rounded-b-2xl">
               <button 
                 onClick={closeMealModal}
                 disabled={isAddingRecipe}
                 className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleConfirmAddToMeal}
                 disabled={isAddingRecipe}
                 className="flex-1 px-4 py-2 bg-primary dark:bg-accent text-white dark:text-gray-900 rounded-xl hover:bg-teal-700 dark:hover:bg-lime-400 font-medium transition-colors flex justify-center items-center shadow-sm"
               >
                 {isAddingRecipe ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   'Confirm'
                 )}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Recipe Preview Modal */}
      {showPreview && selectedRecipe && (
        <RecipePreviewModal
          recipe={selectedRecipe}
          onClose={closePreview}
          onImageError={() => handleImageError(selectedRecipe.id.toString())}
        />
      )}
    </div>
  );
};

export default SavedRecipes;