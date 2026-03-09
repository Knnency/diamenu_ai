import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { auditRecipeWithAI } from '../services/geminiService';
import { AuditResult } from '../types';
import FoodLoader from '../components/FoodLoader';
import AuditReport from '../components/AuditReport';

interface AuditHistoryItem {
  id: string;
  query: string;
  result: AuditResult;
  date: string;
}

const Auditor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('auditHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('auditHistory', JSON.stringify(history));
  }, [history]);

  const handleAudit = async () => {
    if (!inputText) return;

    setIsLoading(true);
    setError(null);
    setLoadingStatus('Initializing Digital Care Team...');

    try {
      // Simulate Agent sequence for UX
      setTimeout(() => setLoadingStatus('Doctor Agent: Analyzing macros & GI...'), 1000);
      setTimeout(() => setLoadingStatus('Chef Agent: Searching local markets for swaps...'), 3500);

      // Get user profile from local storage
      const savedProfile = localStorage.getItem('userProfile');
      const userProfile = savedProfile ? JSON.parse(savedProfile) : undefined;

      const auditData = await auditRecipeWithAI(inputText, userProfile);
      
      // Ensure the "simulation" lasts at least 4.5 seconds so the user sees the messages
      setTimeout(() => {
        setResult(auditData);
        
        // Add to history
        const newItem: AuditHistoryItem = {
          id: Date.now().toString(),
          query: inputText,
          result: auditData,
          date: new Date().toLocaleString()
        };
        setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
        
        setIsLoading(false);
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setError("Failed to audit recipe. Please check your connection or API key.");
      setIsLoading(false);
    }
  };

  const handleViewHistoryItem = (item: AuditHistoryItem) => {
    setResult(item.result);
    setInputText(item.query);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <FoodLoader status={loadingStatus} />
      </div>
    );
  }

  if (result) {
    return <AuditReport result={result} onReset={() => { setResult(null); setInputText(''); }} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Recipe Auditor</h1>
        <p className="text-gray-500">
            Paste a recipe or describe your meal. Our dual-agent AI (Doctor & Chef) will check it for safety and flavor.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {/* Input Type Selection */}
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">What are you eating?</label>
            
            {/* Text Area */}
            <div>
                <textarea
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 p-4"
                    rows={4}
                    placeholder="e.g., Sinigang na Baboy with 2 cups of white rice..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
            </div>
        </div>

        {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
            </div>
        )}

        <button
            onClick={handleAudit}
            disabled={!inputText}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 ${(!inputText) ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-emerald-600 hover:shadow-xl'}`}
        >
            Start AI Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
            <div className="text-blue-600 mt-1"><Icons.Doctor /></div>
            <div className="text-sm">
                <p className="font-semibold text-blue-900">Medical Safety</p>
                <p className="text-blue-700">Strict checking against diabetic guidelines.</p>
            </div>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
            <div className="text-orange-600 mt-1"><Icons.Chef /></div>
            <div className="text-sm">
                <p className="font-semibold text-orange-900">Culinary Swaps</p>
                <p className="text-orange-700">Tasty alternatives found in local stores.</p>
            </div>
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">Recent Audits</h2>
          <div className="space-y-3">
            {history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleViewHistoryItem(item)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-primary cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex-1 truncate mr-4">
                  <p className="font-medium text-gray-800 truncate">{item.query}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getScoreColor(item.result.safetyScore)}`}>
                  <span className="font-bold text-sm">{item.result.safetyScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Auditor;