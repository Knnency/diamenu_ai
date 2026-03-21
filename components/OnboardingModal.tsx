import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { UserSettings } from '../services/authService';
import { Icons } from '../constants';

const DIABETES_TYPES = ['Type 1', 'Type 2', 'Gestational', 'Prediabetes', 'None'];

const OnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<UserSettings>>({
    name: '',
    age: null,
    diabetes_type: '',
    dietary_preferences: [],
    allergens: []
  });

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await settingsService.getSettings('current');
        
        // Modal triggers if age is missing OR diabetes_type is missing
        if (!settings.age || !settings.diabetes_type) {
          setFormData(prev => ({
            ...prev,
            name: settings.name || '',
            age: settings.age || null,
            diabetes_type: settings.diabetes_type || '',
            dietary_preferences: settings.dietary_preferences || [],
            allergens: settings.allergens || []
          }));
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSettings();
  }, []);

  const handleInputChange = (field: keyof UserSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.diabetes_type) {
      setError("Please fill out your name, age, and diabetes type.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get the rest of the existing settings so we don't accidentally overwrite them with nulls
      const currentSettings = await settingsService.getSettings('current');
      
      const updatedSettings: UserSettings = {
        ...currentSettings,
        name: formData.name,
        age: formData.age,
        diabetes_type: formData.diabetes_type,
      };

      await settingsService.updateSettings('current', updatedSettings);
      setIsOpen(false);
    } catch (err: any) {
      console.error("Failed to save onboarding settings:", err);
      setError(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-emerald-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-2xl font-extrabold relative z-10">Welcome to DiaMenu! 👋</h2>
          <p className="text-emerald-50 mt-2 relative z-10 text-sm leading-relaxed">
            Let's personalize your experience. We need just a few details so Doc Chef can provide the best, safest meal recommendations for you.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex gap-3 items-start">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What should we call you?</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">How old are you?</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                placeholder="Age in years"
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What is your Diabetes context?</label>
              <select
                required
                value={formData.diabetes_type || ''}
                onChange={(e) => handleInputChange('diabetes_type', e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white appearance-none"
              >
                <option value="" disabled>Select a type...</option>
                {DIABETES_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
          <button
            type="submit"
            form="onboarding-form"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary dark:bg-accent text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:bg-emerald-800 dark:hover:bg-lime-400 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white flex-shrink-0 rounded-full animate-spin"></div>
                Saving Profile...
              </>
            ) : (
              <>
                Complete Setup
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
