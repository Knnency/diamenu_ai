import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../constants';
import { getUserSettings, updateUserSettings, UserSettings } from '../services/authService';
import { settingsService } from '../services/settingsService';
import { extractLabResultsFromImage } from '../services/geminiService';

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

const Settings: React.FC = () => {
  // Form state management
  const [formData, setFormData] = useState<UserSettings>({
    age: null,
    diabetes_type: 'Type 2',
    dietary_preferences: [],
    allergens: [],
    diagnosis: '',
    hba1c: '',
    fbs: '',
    total_cholesterol: '',
    medications: '',
    restrictions: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, []);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user ID for caching (you might need to get this from auth context)
      const userId = 'current'; // Replace with actual user ID from auth
      
      // Use cached settings service for better performance
      const settings = await settingsService.getSettings(userId);
      
      // Handle null or undefined profile data
      if (settings) {
        // Ensure all fields have valid values
        setFormData({
          age: settings.age ?? null,
          diabetes_type: settings.diabetes_type ?? 'Type 2',
          dietary_preferences: settings.dietary_preferences ?? [],
          allergens: settings.allergens ?? [],
          diagnosis: settings.diagnosis ?? '',
          hba1c: settings.hba1c ?? '',
          fbs: settings.fbs ?? '',
          total_cholesterol: settings.total_cholesterol ?? '',
          medications: settings.medications ?? '',
          restrictions: settings.restrictions ?? ''
        });
      } else {
        // Use default values if no profile exists
        setFormData({
          age: null,
          diabetes_type: 'Type 2',
          dietary_preferences: [],
          allergens: [],
          diagnosis: '',
          hba1c: '',
          fbs: '',
          total_cholesterol: '',
          medications: '',
          restrictions: ''
        });
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user settings');
      
      // Use default values on error
      setFormData({
        age: null,
        diabetes_type: 'Type 2',
        dietary_preferences: [],
        allergens: [],
        diagnosis: '',
        hba1c: '',
        fbs: '',
        total_cholesterol: '',
        medications: '',
        restrictions: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-save on field change with debouncing (optimistic update)
    if (field !== 'age' && field !== 'hba1c' && field !== 'fbs' && field !== 'total_cholesterol') {
      setSaving(true);
      debouncedSave({ ...formData, [field]: value });
    }
  };

  const handleCheckboxChange = (field: 'dietary_preferences' | 'allergens', value: string, checked: boolean) => {
    setFormData(prev => {
      if (!prev) return prev; // Safety check
      const currentArray = prev[field] as string[] || [];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  // Debounced save function to prevent excessive API calls
  const debouncedSave = React.useCallback(
    debounce(async (settings: UserSettings) => {
      try {
        const userId = 'current'; // Replace with actual user ID from auth
        const updatedSettings = await settingsService.updateSettings(userId, settings);
        setFormData(updatedSettings);
        setSuccess(true);
        setError(null);
      } catch (err) {
        console.error('Failed to save user settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to save user settings');
      } finally {
        setSaving(false);
      }
    }, 1000), // 1 second debounce
    []
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    
    // Immediate UI feedback with optimistic update
    setSuccess(false);
    setError(null);
    
    // Call debounced save function
    debouncedSave(formData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setError(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const results = await extractLabResultsFromImage(base64Data, file.type);
          
          setFormData(prev => ({
            ...prev,
            hba1c: results.hba1c || prev.hba1c,
            fbs: results.fbs || prev.fbs,
            total_cholesterol: results.total_cholesterol || prev.total_cholesterol
          }));
          
          setSuccess(true);
          // Trigger save
          setSaving(true);
          debouncedSave({
            ...formData,
            hba1c: results.hba1c || formData.hba1c,
            fbs: results.fbs || formData.fbs,
            total_cholesterol: results.total_cholesterol || formData.total_cholesterol
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to extract data from image.');
        } finally {
          setExtracting(false);
          // Clear input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error reading file.');
      setExtracting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your diabetes profile and dietary preferences</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Icons.Check className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Settings saved successfully!</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <Icons.Alert className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData?.age ?? ''}
                    onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter your age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diabetes Type
                  </label>
                  <select
                    value={formData?.diabetes_type ?? 'Type 2'}
                    onChange={(e) => handleInputChange('diabetes_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Type 1">Type 1 Diabetes</option>
                    <option value="Type 2">Type 2 Diabetes</option>
                    <option value="Pre-diabetic">Pre-diabetic</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extracting}
                  className="px-4 py-2 bg-secondary/10 text-secondary font-medium rounded-lg hover:bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {extracting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Icons.Image className="w-4 h-4" />
                      Scan Lab Result
                    </>
                  )}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HbA1c Level (%)
                  </label>
                  <input
                    type="text"
                    value={formData?.hba1c ?? ''}
                    onChange={(e) => handleInputChange('hba1c', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 7.2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fasting Blood Sugar (mg/dL)
                  </label>
                  <input
                    type="text"
                    value={formData?.fbs ?? ''}
                    onChange={(e) => handleInputChange('fbs', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Cholesterol (mg/dL)
                  </label>
                  <input
                    type="text"
                    value={formData?.total_cholesterol ?? ''}
                    onChange={(e) => handleInputChange('total_cholesterol', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., 180"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <textarea
                  value={formData?.medications ?? ''}
                  onChange={(e) => handleInputChange('medications', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="List your current diabetes medications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Diagnosis
                </label>
                <textarea
                  value={formData?.diagnosis ?? ''}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe your medical diagnosis"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <textarea
                  value={formData?.restrictions ?? ''}
                  onChange={(e) => handleInputChange('restrictions', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="List any dietary restrictions or limitations"
                />
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Dietary Preferences</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Gluten-Free', 'Dairy-Free', 'Vegan', 'Vegetarian', 'Keto', 'Low-Carb', 'Halal', 'Kosher'].map(pref => (
                  <label key={pref} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData?.dietary_preferences?.includes(pref) ?? false}
                      onChange={(e) => handleCheckboxChange('dietary_preferences', pref, e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{pref}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Allergens & Sensitivities</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Gluten', 'Sesame'].map(allergen => (
                  <label key={allergen} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData?.allergens?.includes(allergen) ?? false}
                      onChange={(e) => handleCheckboxChange('allergens', allergen, e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{allergen}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Icons.Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;