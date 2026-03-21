import React, { useState, useEffect, useRef } from 'react';
import { UserSettings } from '../../services/authService';
import { settingsService } from '../../services/settingsService';
import { extractLabResultsFromImage } from '../../services/geminiService';
import { Icons } from '../../constants';

interface MedicalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSuccess: (updatedSettings: UserSettings) => void;
}

const MedicalSettingsModal: React.FC<MedicalSettingsModalProps> = ({ isOpen, onClose, settings, onSuccess }) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setError(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const finalSettings = await settingsService.updateSettings('current', formData);
      onSuccess(finalSettings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save medical information');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setError(null);

    try {
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
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to extract data from image.');
        } finally {
          setExtracting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error reading file.');
      setExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Medical Information</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-secondary/5 border-b border-secondary/10 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-medium text-secondary-dark dark:text-secondary mb-1">Auto-fill from Lab Results</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Upload a picture of your lab results and AI will fill the fields below.</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={extracting}
            className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg shadow-sm hover:bg-secondary-dark focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {extracting ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Extracting...</>
            ) : (
              <><Icons.Image className="w-4 h-4" /> Scan Result</>
            )}
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">HbA1c (%)</label>
              <input
                type="text"
                value={formData.hba1c || ''}
                onChange={e => setFormData({ ...formData, hba1c: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 7.2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fasting BG (mg/dL)</label>
              <input
                type="text"
                value={formData.fbs || ''}
                onChange={e => setFormData({ ...formData, fbs: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Cholesterol</label>
              <input
                type="text"
                value={formData.total_cholesterol || ''}
                onChange={e => setFormData({ ...formData, total_cholesterol: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., 180"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Medications</label>
            <textarea
              value={formData.medications || ''}
              onChange={e => setFormData({ ...formData, medications: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="List your current diabetes medications"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Medical Diagnosis</label>
            <textarea
              value={formData.diagnosis || ''}
              onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dietary Restrictions</label>
            <textarea
              value={formData.restrictions || ''}
              onChange={e => setFormData({ ...formData, restrictions: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
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
            {loading ? 'Saving...' : 'Save Medical Info'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalSettingsModal;
