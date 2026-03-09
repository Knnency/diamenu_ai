import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { GoogleGenAI } from "@google/genai";
import { UserProfile } from '../types';
import { Icons } from '../constants';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Juan Dela Cruz',
    age: 45,
    type: 'Type 2',
    dietaryPreferences: ['Low Carb', 'Less Sodium'],
    allergens: [],
    diagnosis: '',
    medicalDetails: {
      hba1c: '',
      fbs: '',
      medications: '',
      restrictions: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicalDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      medicalDetails: {
        ...prev.medicalDetails,
        [name]: value
      }
    }));
  };

  const handlePreferenceChange = (preference: string) => {
    setProfile(prev => {
      const newPreferences = prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference];
      return { ...prev, dietaryPreferences: newPreferences };
    });
  };

  const handleAllergenChange = (allergen: string) => {
    setProfile(prev => {
      const newAllergens = prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen];
      return { ...prev, allergens: newAllergens };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);
      setOcrProgress(0);

      try {
        // 1. Extract text using Tesseract
        const result = await Tesseract.recognize(
          file,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrProgress(Math.round(m.progress * 100));
              }
            }
          }
        );
        
        const extractedText = result.data.text;
        
        // 2. Use Gemini to parse the text
        if (process.env.GEMINI_API_KEY) {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
          
          const prompt = `
            Extract the following medical details from the text below. Return ONLY a JSON object with these keys: "hba1c", "fbs", "medications", "restrictions".
            If a value is not found, use an empty string.
            
            Text:
            ${extractedText}
          `;

          const aiResult = await model.generateContent(prompt);
          const responseText = aiResult.response.text();
          
          try {
            // Clean up markdown code blocks if present
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedDetails = JSON.parse(jsonStr);
            
            setProfile(prev => ({
              ...prev,
              diagnosis: (prev.diagnosis ? prev.diagnosis + '\n\n' : '') + extractedText,
              medicalDetails: {
                hba1c: parsedDetails.hba1c || prev.medicalDetails?.hba1c || '',
                fbs: parsedDetails.fbs || prev.medicalDetails?.fbs || '',
                medications: parsedDetails.medications || prev.medicalDetails?.medications || '',
                restrictions: parsedDetails.restrictions || prev.medicalDetails?.restrictions || ''
              }
            }));
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            // Fallback: just save the text
             setProfile(prev => ({ 
              ...prev, 
              diagnosis: (prev.diagnosis ? prev.diagnosis + '\n\n' : '') + extractedText 
            }));
          }
        } else {
          // Fallback if no API key
          setProfile(prev => ({ 
            ...prev, 
            diagnosis: (prev.diagnosis ? prev.diagnosis + '\n\n' : '') + extractedText 
          }));
        }

      } catch (error) {
        console.error('OCR/AI Error:', error);
        alert('Failed to process the document. Please try again.');
      } finally {
        setIsProcessing(false);
        setOcrProgress(0);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 1000);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsChangingPassword(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    }, 1000);
  };

  const preferencesOptions = [
    'Low Carb', 'Vegetarian', 'Pescatarian', 'Gluten-Free', 'Less Sodium', 'Dairy-Free'
  ];

  const allergenOptions = [
    'Peanuts', 'Tree Nuts', 'Milk', 'Egg', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame'
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">User Settings</h1>
        <p className="text-gray-500">Manage your profile, dietary preferences, and allergens.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={profile.age}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            {/* Diabetes Type */}
            <div className="md:col-span-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Diabetes Type</label>
              <select
                id="type"
                name="type"
                value={profile.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              >
                <option value="Type 1">Type 1</option>
                <option value="Type 2">Type 2</option>
                <option value="Pre-diabetic">Pre-diabetic</option>
              </select>
              <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {profile.type === 'Type 1' && "Type 1 diabetes is an autoimmune condition where the pancreas produces little or no insulin. It usually appears in childhood or adolescence but can develop in adults."}
                {profile.type === 'Type 2' && "Type 2 diabetes is a chronic condition that affects the way the body processes blood sugar (glucose). It is the most common form of diabetes."}
                {profile.type === 'Pre-diabetic' && "Pre-diabetes means you have a higher than normal blood sugar level. It's not high enough to be considered type 2 diabetes yet, but without lifestyle changes, adults and children with prediabetes are more likely to develop type 2 diabetes."}
              </p>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {preferencesOptions.map(option => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.dietaryPreferences.includes(option)}
                    onChange={() => handlePreferenceChange(option)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allergenOptions.map(option => (
                <label key={option} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.allergens.includes(option)}
                    onChange={() => handleAllergenChange(option)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Doctor's Diagnosis */}
          <div className="border-t border-gray-100 pt-6">
            <label className="block text-lg font-medium text-gray-900 mb-2">Doctor's Diagnosis</label>
            <p className="text-sm text-gray-500 mb-4">
              Upload a photo of your doctor's diagnostic analysis or prescription. 
              Our AI will extract the text to help personalize your meal plan.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="diagnosis-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isProcessing ? (
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm text-gray-500">Processing... {ocrProgress}%</p>
                      </div>
                    ) : (
                      <>
                        <Icons.Upload />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG or PDF (MAX. 5MB)</p>
                      </>
                    )}
                  </div>
                  <input 
                    id="diagnosis-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
                <h3 className="font-medium text-blue-900">Key Medical Details</h3>
                <p className="text-sm text-blue-700">
                  Our AI has extracted the following details from your document. Please verify and edit if necessary.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hba1c" className="block text-sm font-medium text-gray-700">HbA1c Level</label>
                    <input
                      type="text"
                      id="hba1c"
                      name="hba1c"
                      placeholder="e.g., 6.5%"
                      value={profile.medicalDetails?.hba1c || ''}
                      onChange={handleMedicalDetailChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="fbs" className="block text-sm font-medium text-gray-700">Fasting Blood Sugar</label>
                    <input
                      type="text"
                      id="fbs"
                      name="fbs"
                      placeholder="e.g., 120 mg/dL"
                      value={profile.medicalDetails?.fbs || ''}
                      onChange={handleMedicalDetailChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="medications" className="block text-sm font-medium text-gray-700">Current Medications</label>
                    <input
                      type="text"
                      id="medications"
                      name="medications"
                      placeholder="e.g., Metformin 500mg, Insulin Glargine"
                      value={profile.medicalDetails?.medications || ''}
                      onChange={handleMedicalDetailChange}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="restrictions" className="block text-sm font-medium text-gray-700">Doctor's Dietary Instructions</label>
                    <textarea
                      id="restrictions"
                      name="restrictions"
                      rows={3}
                      placeholder="e.g., Limit carbs to 45g per meal, low potassium diet"
                      value={profile.medicalDetails?.restrictions || ''}
                      onChange={handleMedicalDetailChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm mt-1"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">
              {successMessage}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-70"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>
          </div>

          {passwordMessage.text && (
            <div className={`p-3 rounded-lg text-sm text-center ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {passwordMessage.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-70"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
