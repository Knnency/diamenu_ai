import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { UserSettings } from '../services/authService';
import { settingsService } from '../services/settingsService';
import MfaSetupModal from './auth/MfaSetupModal';
import ProfileSettingsModal from '../components/settings/ProfileSettingsModal';
import MedicalSettingsModal from '../components/settings/MedicalSettingsModal';
import PreferencesSettingsModal from '../components/settings/PreferencesSettingsModal';

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<UserSettings>({
    email: '',
    name: '',
    age: null,
    diabetes_type: 'Type 2',
    dietary_preferences: [],
    allergens: [],
    diagnosis: '',
    hba1c: '',
    fbs: '',
    total_cholesterol: '',
    medications: '',
    restrictions: '',
    mfa_enabled: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [isDisableMfaMode, setIsDisableMfaMode] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const settings = await settingsService.getSettings('current');
      
      if (settings) {
        setFormData({
          email: settings.email ?? '',
          name: settings.name ?? '',
          age: settings.age ?? null,
          diabetes_type: settings.diabetes_type ?? 'Type 2',
          dietary_preferences: settings.dietary_preferences ?? [],
          allergens: settings.allergens ?? [],
          diagnosis: settings.diagnosis ?? '',
          hba1c: settings.hba1c ?? '',
          fbs: settings.fbs ?? '',
          total_cholesterol: settings.total_cholesterol ?? '',
          medications: settings.medications ?? '',
          restrictions: settings.restrictions ?? '',
          mfa_enabled: settings.mfa_enabled ?? false,
          profile_picture: settings.profile_picture ?? undefined
        });
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user settings');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSuccess = (updatedSettings: UserSettings) => {
    setFormData(updatedSettings);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-48 mb-6 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  const pictureUrl = formData.profile_picture ? `${API_BASE}${formData.profile_picture}` : null;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your profile, medical details, and configurations.</p>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
        
        {/* User Profile Card (Spans 1 Column) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors focus:outline-none bg-gray-50 dark:bg-gray-700 p-2 rounded-full"
            aria-label="Edit Profile"
          >
            <Icons.Edit className="w-4 h-4" />
          </button>

          <div className="w-28 h-28 rounded-full border-4 border-gray-50 dark:border-gray-700 mb-4 overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center shadow-inner">
            {pictureUrl ? (
              <img src={pictureUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Icons.User className="w-12 h-12 text-gray-300 dark:text-gray-500" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formData.name || 'Anonymous User'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{formData.email}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            <span className="px-3 py-1 bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent rounded-full text-sm font-medium">
              {formData.diabetes_type || 'Type 2'}
            </span>
            {formData.age && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                {formData.age} years old
              </span>
            )}
          </div>
        </div>

        {/* Medical Info Card (Spans 2 Columns) */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-200 dark:border-gray-700 p-6 relative">
          <button 
            onClick={() => setShowMedicalModal(true)}
            className="absolute top-6 right-6 text-gray-400 hover:text-primary transition-colors focus:outline-none bg-gray-50 dark:bg-gray-700 p-2 rounded-full"
            aria-label="Edit Medical Info"
          >
            <Icons.Edit className="w-4 h-4" />
          </button>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Icons.Heart className="w-5 h-5 text-red-500" /> Medical Overview
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">HbA1c</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formData.hba1c || '--'}%</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fasting BG</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formData.fbs || '--'}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cholesterol</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formData.total_cholesterol || '--'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Medications</p>
              <p className="text-sm text-gray-900 dark:text-gray-200 line-clamp-2">
                {formData.medications || 'None recorded.'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Diagnosis / Notes</p>
              <p className="text-sm text-gray-900 dark:text-gray-200 line-clamp-2">
                {formData.diagnosis || 'None recorded.'}
              </p>
            </div>
          </div>
        </div>

        {/* Dietary Preferences Card */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-200 dark:border-gray-700 p-6 relative">
          <button 
            onClick={() => setShowPrefModal(true)}
            className="absolute top-6 right-6 text-gray-400 hover:text-primary transition-colors focus:outline-none bg-gray-50 dark:bg-gray-700 p-2 rounded-full"
            aria-label="Edit Preferences"
          >
            <Icons.Edit className="w-4 h-4" />
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Icons.MonitorPlay className="w-5 h-5 text-green-500" /> Dietary Preferences & Allergies
          </h3>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Dietary Styles</p>
              <div className="flex flex-wrap gap-2">
                {formData.dietary_preferences?.length ? (
                  formData.dietary_preferences.map(pref => (
                    <span key={pref} className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50 rounded-lg text-sm">
                      {pref}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">None selected</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Allergens</p>
              <div className="flex flex-wrap gap-2">
                {formData.allergens?.length ? (
                  formData.allergens.map(allergen => (
                    <span key={allergen} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 rounded-lg text-sm">
                      {allergen}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">None selected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icons.Shield className="w-5 h-5 text-blue-500" /> Security
          </h3>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${formData.mfa_enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-200 dark:bg-gray-600'}`}>
              <Icons.Shield className={`w-8 h-8 ${formData.mfa_enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-400'}`} />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Two-Factor Auth</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {formData.mfa_enabled ? 'Your account is secured with an extra layer of protection.' : 'Add an extra layer of security to your account.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsDisableMfaMode(!!formData.mfa_enabled);
                setShowMfaModal(true);
              }}
              className={`w-full py-2.5 px-4 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                formData.mfa_enabled
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'bg-primary text-white hover:bg-primary-dark focus:ring-primary'
              }`}
            >
              {formData.mfa_enabled ? 'Disable MFA' : 'Enable MFA'}
            </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        settings={formData}
        onSuccess={handleModalSuccess}
      />
      
      <MedicalSettingsModal
        isOpen={showMedicalModal}
        onClose={() => setShowMedicalModal(false)}
        settings={formData}
        onSuccess={handleModalSuccess}
      />

      <PreferencesSettingsModal
        isOpen={showPrefModal}
        onClose={() => setShowPrefModal(false)}
        settings={formData}
        onSuccess={handleModalSuccess}
      />

      <MfaSetupModal
        isOpen={showMfaModal}
        isDisableMode={isDisableMfaMode}
        onClose={() => setShowMfaModal(false)}
        onSuccess={() => {
          setFormData(prev => ({ ...prev, mfa_enabled: !isDisableMfaMode }));
        }}
      />
    </div>
  );
};

export default Settings;