import React, { useState, useEffect } from 'react';
import { UserSettings } from '../../services/authService';
import { settingsService } from '../../services/settingsService';
import { Icons } from '../../constants';

interface PreferencesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSuccess: (updatedSettings: UserSettings) => void;
}

const PreferencesSettingsModal: React.FC<PreferencesSettingsModalProps> = ({ isOpen, onClose, settings, onSuccess }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setError(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleCheckboxChange = (field: 'dietary_preferences' | 'allergens', value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[] || [];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalSettings = await settingsService.updateSettings('current', formData);
      onSuccess(finalSettings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dietary & Allergens</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Dietary Preferences</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Gluten-Free', 'Dairy-Free', 'Vegan', 'Vegetarian', 'Keto', 'Low-Carb', 'Halal', 'Kosher'].map(pref => (
                <label key={pref} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="checkbox"
                    checked={formData.dietary_preferences?.includes(pref) || false}
                    onChange={(e) => handleCheckboxChange('dietary_preferences', pref, e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{pref}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">Allergens & Sensitivities</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Gluten', 'Sesame'].map(allergen => (
                <label key={allergen} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="checkbox"
                    checked={formData.allergens?.includes(allergen) || false}
                    onChange={(e) => handleCheckboxChange('allergens', allergen, e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{allergen}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
        
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSettingsModal;
