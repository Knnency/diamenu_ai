import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { UserSettings } from '../services/authService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiabetesTypeOption {
  value: string;
  label: string;
  emoji: string;
  description: string;
  color: string;
  border: string;
  bg: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIABETES_TYPES: DiabetesTypeOption[] = [
  {
    value: 'Type 1',
    label: 'Type 1',
    emoji: '💉',
    description: 'Insulin-dependent diabetes (autoimmune)',
    color: 'text-blue-600 dark:text-blue-400',
    border: 'border-gray-200 dark:border-gray-600',
    bg: 'bg-white dark:bg-gray-800',
    selectedBg: 'bg-blue-50 dark:bg-blue-900/30',
    selectedBorder: 'border-blue-500',
    selectedText: 'text-blue-700 dark:text-blue-300',
  },
  {
    value: 'Type 2',
    label: 'Type 2',
    emoji: '🩺',
    description: 'Most common form, often lifestyle-related',
    color: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-gray-200 dark:border-gray-600',
    bg: 'bg-white dark:bg-gray-800',
    selectedBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    selectedBorder: 'border-emerald-500',
    selectedText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'Pre-diabetic',
    label: 'Pre-diabetic',
    emoji: '⚠️',
    description: 'Blood sugar is elevated but not diabetic yet',
    color: 'text-amber-600 dark:text-amber-400',
    border: 'border-gray-200 dark:border-gray-600',
    bg: 'bg-white dark:bg-gray-800',
    selectedBg: 'bg-amber-50 dark:bg-amber-900/30',
    selectedBorder: 'border-amber-500',
    selectedText: 'text-amber-700 dark:text-amber-300',
  },
];

const TOTAL_STEPS = 3;

// ─── Step Components ──────────────────────────────────────────────────────────

const StepWelcome: React.FC<{
  name: string;
  onChange: (v: string) => void;
}> = ({ name, onChange }) => (
  <div className="text-center space-y-6">
    <div className="flex justify-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40">
        <span className="text-4xl">👋</span>
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
        Welcome to DiaMenu!
      </h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
        Let's set up your health profile so Doc Chef can give you personalized, 
        diabetes-safe recipe recommendations.
      </p>
    </div>
    <div className="text-left pt-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        What should we call you?
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your name"
        autoFocus
        className="w-full bg-gray-50 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base"
      />
    </div>
  </div>
);

const StepAge: React.FC<{
  name: string;
  age: number | null;
  onChange: (v: number | null) => void;
}> = ({ name, age, onChange }) => (
  <div className="text-center space-y-6">
    <div className="flex justify-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-200 dark:shadow-violet-900/40">
        <span className="text-4xl">🎂</span>
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
        Nice to meet you, {name || 'there'}!
      </h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
        Your age helps us calibrate nutritional guidance more accurately.
      </p>
    </div>
    <div className="text-left pt-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        How old are you?
      </label>
      <input
        type="number"
        min={1}
        max={120}
        value={age ?? ''}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          onChange(isNaN(val) ? null : val);
        }}
        placeholder="Your age"
        autoFocus
        className="w-full bg-gray-50 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  </div>
);

const StepDiabetesType: React.FC<{
  selected: string;
  onChange: (v: string) => void;
}> = ({ selected, onChange }) => (
  <div className="space-y-5">
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-red-600 flex items-center justify-center shadow-xl shadow-rose-200 dark:shadow-rose-900/40">
          <span className="text-4xl">🏥</span>
        </div>
      </div>
      <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
        Your Diabetes Profile
      </h3>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
        Select the option that best describes your condition.
      </p>
    </div>

    <div className="grid gap-3 pt-2">
      {DIABETES_TYPES.map((type) => {
        const isSelected = selected === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left
              transition-all duration-200 cursor-pointer group
              ${isSelected
                ? `${type.selectedBg} ${type.selectedBorder} shadow-md`
                : `${type.bg} ${type.border} hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm`
              }
            `}
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl
              transition-all duration-200
              ${isSelected ? 'bg-white/70 dark:bg-black/20 shadow-inner' : 'bg-gray-100 dark:bg-gray-700'}
            `}>
              {type.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-base transition-colors ${isSelected ? type.selectedText : 'text-gray-800 dark:text-white'}`}>
                {type.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                {type.description}
              </div>
            </div>
            {isSelected && (
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${type.selectedBorder.replace('border-', 'bg-')}`}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressDots: React.FC<{ currentStep: number; total: number }> = ({ currentStep, total }) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-300 ${
          i < currentStep
            ? 'w-6 h-2 bg-emerald-500'
            : i === currentStep
            ? 'w-6 h-2 bg-emerald-400'
            : 'w-2 h-2 bg-gray-200 dark:bg-gray-600'
        }`}
      />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const OnboardingModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0: welcome/name, 1: age, 2: diabetes type

  const [formData, setFormData] = useState<Partial<UserSettings>>({
    name: '',
    age: null,
    diabetes_type: '',
    dietary_preferences: [],
    allergens: [],
  });

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await settingsService.getSettings('current');
        if (!settings.age || !settings.diabetes_type) {
          setFormData((prev) => ({
            ...prev,
            name: settings.name || '',
            age: settings.age || null,
            diabetes_type: settings.diabetes_type || '',
            dietary_preferences: settings.dietary_preferences || [],
            allergens: settings.allergens || [],
          }));
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSettings();
  }, []);

  const updateField = (field: keyof UserSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canAdvance = (): boolean => {
    if (step === 0) return !!(formData.name && formData.name.trim().length > 0);
    if (step === 1) return !!(formData.age && formData.age > 0 && formData.age <= 120);
    if (step === 2) return !!(formData.diabetes_type);
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!canAdvance()) return;
    setIsSaving(true);
    setError(null);
    try {
      const currentSettings = await settingsService.getSettings('current');
      const updatedSettings: UserSettings = {
        ...currentSettings,
        name: formData.name!,
        age: formData.age!,
        diabetes_type: formData.diabetes_type!,
      };
      await settingsService.updateSettings('current', updatedSettings);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step < TOTAL_STEPS - 1 && canAdvance()) handleNext();
      else if (step === TOTAL_STEPS - 1 && canAdvance()) handleSubmit();
    }
  };

  if (isLoading || !isOpen) return null;

  const stepLabels = ['Your Name', 'Your Age', 'Your Profile'];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        .step-enter { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .modal-enter { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div
        key="modal"
        className="modal-enter bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700/50 overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden rounded-t-3xl">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Step {step + 1} of {TOTAL_STEPS}
            </span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-0.5">
              {stepLabels[step]}
            </span>
          </div>
          <ProgressDots currentStep={step} total={TOTAL_STEPS} />
        </div>

        {/* Step content */}
        <div className="px-6 py-5 flex-1" key={step}>
          <div className="step-enter">
            {step === 0 && (
              <StepWelcome
                name={formData.name || ''}
                onChange={(v) => updateField('name', v)}
              />
            )}
            {step === 1 && (
              <StepAge
                name={formData.name || ''}
                age={formData.age ?? null}
                onChange={(v) => updateField('age', v)}
              />
            )}
            {step === 2 && (
              <StepDiabetesType
                selected={formData.diabetes_type || ''}
                onChange={(v) => updateField('diabetes_type', v)}
              />
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex gap-2 items-start">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-5 py-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : (
            <div /> // spacer
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={handleNext}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAdvance() || isSaving}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Get Started! 🚀
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
