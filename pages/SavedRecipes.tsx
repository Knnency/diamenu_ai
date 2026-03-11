import React, { useState } from 'react';
import { Icons } from '../constants';

// Mock data for saved recipes
const MOCK_SAVED_RECIPES = [
  {
    id: '1',
    title: 'Low-Carb Chicken Adobo',
    imageUrl: 'https://picsum.photos/seed/adobo/400/300',
    tags: ['Low Carb', 'High Protein', 'Filipino'],
    prepTime: '45 mins',
    calories: 320,
    safetyScore: 92
  },
  {
    id: '2',
    title: 'Cauliflower Fried Rice',
    imageUrl: 'https://picsum.photos/seed/cauliflower/400/300',
    tags: ['Vegetarian', 'Low GI', 'Quick'],
    prepTime: '20 mins',
    calories: 180,
    safetyScore: 95
  },
  {
    id: '3',
    title: 'Baked Salmon with Asparagus',
    imageUrl: 'https://picsum.photos/seed/salmon/400/300',
    tags: ['Pescatarian', 'Heart Healthy'],
    prepTime: '30 mins',
    calories: 410,
    safetyScore: 88
  },
  {
    id: '4',
    title: 'Diabetic-Friendly Sinigang',
    imageUrl: 'https://picsum.photos/seed/sinigang/400/300',
    tags: ['Soup', 'Filipino', 'Low Sodium'],
    prepTime: '50 mins',
    calories: 250,
    safetyScore: 90
  }
];

const SavedRecipes: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState(MOCK_SAVED_RECIPES);

  const filteredRecipes = recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const removeRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Recipes</h1>
        <p className="text-gray-600">Your personal collection of diabetes-friendly meals.</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="text"
            placeholder="Search saved recipes or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>
        <button className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filter
        </button>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative h-48">
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm font-bold text-emerald-700 shadow-sm flex items-center gap-1">
                  <Icons.Check /> {recipe.safetyScore}
                </div>
                <button 
                  onClick={() => removeRecipe(recipe.id)}
                  className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from saved"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{recipe.title}</h3>
                
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {recipe.prepTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Icons.Chart />
                    {recipe.calories} kcal
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Icons.Bookmark />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchQuery ? "We couldn't find any saved recipes matching your search." : "You haven't saved any recipes yet. Start auditing recipes to build your collection!"}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-primary font-medium hover:text-teal-700"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;
