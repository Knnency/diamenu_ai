import React, { useState } from 'react';
import { generateMealPlan, evaluateWeeklyPlan } from '../services/geminiService';
import FoodLoader from '../components/FoodLoader';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealPlan: React.FC = () => {
  const [activeDay, setActiveDay] = useState('Mon');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<{ day: string, type: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, { status: 'good' | 'warning' | 'bad', reason: string }>> | null>(null);

  // Initial empty or default plan
  const [plan, setPlan] = useState<Record<string, Record<string, string>>>({
    'Mon': { 'Breakfast': 'Oatmeal w/ Chia Seeds', 'Lunch': 'Grilled Bangus & Ensalada', 'Dinner': 'Tinola (Chicken Breast, Sayote)', 'Snack': 'Boiled Saba' },
    'Tue': { 'Breakfast': 'Taho (Less Syrup)', 'Lunch': 'Monggo w/ Malunggay', 'Dinner': 'Adobong Sitaw w/ Tofu', 'Snack': 'Apple Slices' },
    'Wed': { 'Breakfast': 'Scrambled Egg & Wheat Bread', 'Lunch': 'Sinigang na Hipon', 'Dinner': 'Cauliflower Rice Stir Fry', 'Snack': 'Greek Yogurt' },
  });

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    setEvaluations(null);
    try {
      // Get user profile from local storage
      const savedProfile = localStorage.getItem('userProfile');
      const userProfile = savedProfile ? JSON.parse(savedProfile) : undefined;
      
      const newPlan = await generateMealPlan(userProfile);
      setPlan(newPlan);
    } catch (err) {
      console.error(err);
      setError("Failed to generate meal plan. Please check your connection or API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluatePlan = async () => {
    setIsEvaluating(true);
    setError(null);
    try {
      const result = await evaluateWeeklyPlan(plan);
      setEvaluations(result);
    } catch (err) {
      console.error(err);
      setError("Failed to evaluate meal plan. Please check your connection or API key.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEditClick = (day: string, type: string, currentValue: string) => {
    setEditingMeal({ day, type });
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = () => {
    if (editingMeal) {
      setPlan(prev => ({
        ...prev,
        [editingMeal.day]: {
          ...(prev[editingMeal.day] || {}),
          [editingMeal.type]: editValue
        }
      }));
      
      // Clear evaluation for this specific meal if it exists
      if (evaluations && evaluations[editingMeal.day] && evaluations[editingMeal.day][editingMeal.type]) {
          setEvaluations(prev => {
              if (!prev) return prev;
              const newEvals = { ...prev };
              if (newEvals[editingMeal.day]) {
                  newEvals[editingMeal.day] = { ...newEvals[editingMeal.day] };
                  delete newEvals[editingMeal.day][editingMeal.type];
              }
              return newEvals;
          });
      }
      
      setEditingMeal(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMeal(null);
  };

  if (isGenerating || isEvaluating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <FoodLoader status={isGenerating ? "AI is crafting your personalized 7-day meal plan..." : "Doctor AI is evaluating your meal plan..."} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Weekly Planner</h1>
            <p className="text-gray-500">Your curated menu for stable blood sugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleEvaluatePlan}
              disabled={Object.keys(plan).length === 0}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
                Analyze Plan
            </button>
            <button 
              onClick={handleGeneratePlan}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-teal-700 transition-colors"
            >
                Generate with AI
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50">
                Export List
            </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
        </div>
      )}

      {/* Days Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {days.map(day => (
            <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeDay === day ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
            >
                {day}
            </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {mealTypes.map(type => {
            const mealName = plan[activeDay]?.[type] || "Plan this meal +";
            const isPlanned = !!plan[activeDay]?.[type];
            const isEditing = editingMeal?.day === activeDay && editingMeal?.type === type;
            const evaluation = evaluations?.[activeDay]?.[type];

            let statusColor = 'bg-green-500';
            let statusBg = '';
            let statusBorder = 'border-gray-100';
            
            if (evaluation) {
                if (evaluation.status === 'good') {
                    statusColor = 'bg-green-500';
                    statusBg = 'bg-green-50';
                    statusBorder = 'border-green-200';
                } else if (evaluation.status === 'warning') {
                    statusColor = 'bg-yellow-500';
                    statusBg = 'bg-yellow-50';
                    statusBorder = 'border-yellow-200';
                } else if (evaluation.status === 'bad') {
                    statusColor = 'bg-red-500';
                    statusBg = 'bg-red-50';
                    statusBorder = 'border-red-200';
                }
            }

            return (
                <div key={type} className={`bg-white p-6 rounded-2xl shadow-sm border ${statusBorder} ${statusBg} flex flex-col justify-between min-h-[10rem] hover:border-primary transition-colors group relative`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{type}</span>
                        {isPlanned && !isEditing && (
                            <div className="flex items-center gap-2">
                                {evaluation && <span className={`text-xs font-bold capitalize ${evaluation.status === 'good' ? 'text-green-700' : evaluation.status === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>{evaluation.status}</span>}
                                <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-center">
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea 
                                    className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    rows={2}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={handleCancelEdit} className="text-xs px-3 py-1 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                    <button onClick={handleSaveEdit} className="text-xs px-3 py-1 bg-primary text-white rounded hover:bg-teal-700">Save</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className={`text-lg font-bold ${isPlanned ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                    {mealName}
                                </h3>
                                {evaluation && (
                                    <p className={`text-sm mt-2 ${evaluation.status === 'good' ? 'text-green-700' : evaluation.status === 'warning' ? 'text-yellow-700' : 'text-red-700'}`}>
                                        {evaluation.reason}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                             <button 
                                onClick={() => handleEditClick(activeDay, type, plan[activeDay]?.[type])}
                                className="text-xs text-primary font-semibold hover:underline"
                             >
                                Edit
                             </button>
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      <div className="bg-accent/30 p-6 rounded-xl border border-accent flex items-start gap-4">
        <span className="text-2xl">💡</span>
        <div>
            <h4 className="font-bold text-gray-800">Chef's Tip for {activeDay}</h4>
            <p className="text-sm text-gray-700 mt-1">
                Preparing Monggo on Tuesdays is a Filipino tradition! Remember to skip the pork chicharon topping and use smoked fish (tinapa) flakes for flavor without the saturated fat.
            </p>
        </div>
      </div>
    </div>
  );
};

export default MealPlan;