import React from 'react';
import { Icons } from '../constants';

export interface BaseRecipe {
  id: string | number;
  title: string;
  description: string;
  imageUrl: string;
  ingredients?: string[];
  preparation?: string[];
  tags: string[];
  servings?: string | number;
  country?: string;
  created_at?: string;
}

interface RecipePreviewModalProps {
  recipe: BaseRecipe;
  onClose: () => void;
  onImageError?: () => void;
}

const RecipePreviewModal: React.FC<RecipePreviewModalProps> = ({ recipe, onClose, onImageError }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{recipe.title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <img 
              src={recipe.imageUrl} 
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-xl mb-4"
              onError={onImageError}
              referrerPolicy="no-referrer"
            />
            <p className="text-gray-600 mb-4">{recipe.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      {ingredient}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">No ingredients listed.</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Preparation</h3>
              <ol className="space-y-1 text-sm text-gray-600">
                {recipe.preparation && recipe.preparation.length > 0 ? (
                  recipe.preparation.map((step, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="font-medium text-primary">{index + 1}.</span>
                      {step}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">No preparation steps listed.</li>
                )}
              </ol>
            </div>
          </div>
          
          <div>
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                {recipe.instructions && recipe.instructions.length > 0 ? (
                  recipe.instructions.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="font-medium text-orange-500 whitespace-nowrap">{index + 1}.</span>
                      {step}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">No instructions listed.</li>
                )}
              </ol>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.tags && recipe.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                {recipe.servings && (
                  <div className="flex items-center gap-1">
                    <Icons.User className="w-4 h-4" />
                    {recipe.servings}
                  </div>
                )}
                {recipe.country && (
                  <div className="flex items-center gap-1">
                    <Icons.Globe className="w-4 h-4" />
                    {recipe.country}
                  </div>
                )}
              </div>
              {recipe.created_at && (
                <div className="text-xs text-gray-400">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipePreviewModal;
