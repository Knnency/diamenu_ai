import React, { useState, useEffect } from 'react';
import { evaluateWeeklyPlan } from '../services/geminiService';
import { getMealPlan, saveMealPlan } from '../services/mealPlanService';
import { getSavedRecipes, SavedRecipe } from '../services/authService';
import { recipeImageService } from '../services/RecipeImageService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FoodLoader from '../components/FoodLoader';
import RecipePreviewModal, { BaseRecipe } from '../components/RecipePreviewModal';
import { ViewState } from '../types';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

interface MealPlanProps {
  changeView: (view: ViewState) => void;
}

const MealPlan: React.FC<MealPlanProps> = ({ changeView }) => {
  const [activeDay, setActiveDay] = useState('Mon');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<{ day: string, type: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, { status: 'good' | 'warning' | 'bad', reason: string }>> | null>(null);

  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [previewRecipe, setPreviewRecipe] = useState<BaseRecipe | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<string | null>(null);

  // Initial empty or default plan
  const [plan, setPlan] = useState<Record<string, Record<string, string>>>({
    'Mon': { 'Breakfast': 'Oatmeal w/ Chia Seeds', 'Lunch': 'Grilled Bangus & Ensalada', 'Dinner': 'Tinola (Chicken Breast, Sayote)', 'Snack': 'Boiled Saba' },
    'Tue': { 'Breakfast': 'Taho (Less Syrup)', 'Lunch': 'Monggo w/ Malunggay', 'Dinner': 'Adobong Sitaw w/ Tofu', 'Snack': 'Apple Slices' },
    'Wed': { 'Breakfast': 'Scrambled Egg & Wheat Bread', 'Lunch': 'Sinigang na Hipon', 'Dinner': 'Cauliflower Rice Stir Fry', 'Snack': 'Greek Yogurt' },
  });

  useEffect(() => {
    const fetchPlanAndRecipes = async () => {
      setIsLoading(true);
      try {
        const savedPlan = await getMealPlan();
        setPlan(savedPlan);
      } catch (err: any) {
        if (err.message !== 'PLAN_NOT_FOUND') {
          console.error("Failed to load meal plan:", err);
          setError("Failed to load your latest meal plan.");
        }
      }
      try {
        const allSavedRecipes = await getSavedRecipes();
        setSavedRecipes(allSavedRecipes);
      } catch (err) {
        console.error("Failed to load saved recipes:", err);
      }
      setIsLoading(false);
    };
    fetchPlanAndRecipes();
  }, []);

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

  const handleSaveEdit = async () => {
    if (editingMeal) {
      const updatedPlan = {
        ...plan,
        [editingMeal.day]: {
          ...(plan[editingMeal.day] || {}),
          [editingMeal.type]: editValue
        }
      };

      try {
        await saveMealPlan(updatedPlan);
        setPlan(updatedPlan);
        
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
      } catch (err) {
        console.error("Failed to save edited meal plan:", err);
        setError("Failed to save your edit to the database.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMeal(null);
  };

  const handleDeleteMeal = async (day: string, type: string) => {
    const updatedPlan = {
      ...plan,
      [day]: { ...plan[day] }
    };
    delete updatedPlan[day][type];
    
    try {
      await saveMealPlan(updatedPlan);
      setPlan(updatedPlan);
      if (evaluations && evaluations[day] && evaluations[day][type]) {
          setEvaluations(prev => {
              if (!prev) return prev;
              const newEvals = { ...prev };
              if (newEvals[day]) {
                  newEvals[day] = { ...newEvals[day] };
                  delete newEvals[day][type];
              }
              return newEvals;
          });
      }
    } catch (err) {
      console.error("Failed to delete meal:", err);
      setError("Failed to delete meal.");
    }
  };

  const handlePreview = async (mealName: string) => {
    setIsPreviewLoading(mealName);
    const found = savedRecipes.find(r => r.title === mealName);
    let previewData: BaseRecipe;
    
    if (found) {
      let imageUrl = `https://picsum.photos/seed/recipe-${found.id}/400/300`;
      try {
        imageUrl = await recipeImageService.generateRecipeImage(found.title, found.description, found.tags);
      } catch(e) {}
      previewData = { ...found, imageUrl };
    } else {
      let imageUrl = `https://picsum.photos/seed/recipe-${mealName.replace(/\s+/g, '-')}/400/300`;
      try {
        imageUrl = await recipeImageService.generateRecipeImage(mealName, mealName, []);
      } catch(e) {}
      previewData = {
        id: mealName,
        title: mealName,
        description: 'No detailed description available. This meal might be from an AI suggestion rather than your saved recipes.',
        imageUrl,
        tags: [],
      };
    }
    
    setPreviewRecipe(previewData);
    setIsPreviewLoading(null);
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('landscape'); // Use landscape for wider tables
      
      // Header Title
      doc.setFontSize(22);
      doc.setTextColor(15, 118, 110); // primary teal color
      doc.text('DiaMenu Weekly Meal Plan', 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Build data matrix for table: Rows=Meal Types, Columns=Days
      const head = [['Meal Type', ...days]];
      const body = mealTypes.map(type => {
        // Build array: [Breakfast, Mon, Tue, Wed...]
        const rowData = [type];
        days.forEach(day => {
            const mealName = plan[day]?.[type] || '-';
            rowData.push(mealName);
        });
        return rowData;
      });

      // Generate AutoTable
      autoTable(doc, {
        head: head,
        body: body,
        startY: 38,
        theme: 'grid',
        headStyles: { 
            fillColor: [15, 118, 110], // Primary teal
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            valign: 'middle'
        },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'center' } // Meal Type column
        },
        styles: {
            fontSize: 10,
            cellPadding: 4,
            minCellHeight: 20
        }
      });

      // Save PDF
      doc.save('DiaMenu_Meal_Plan.pdf');
    } catch (e) {
        console.error("Failed to generate PDF.", e);
        setError("Failed to export PDF file.");
    } finally {
        setIsExporting(false);
    }
  };

  if (isEvaluating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <FoodLoader status="Doctor AI is evaluating your meal plan..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Weekly Planner</h1>
            <p className="text-gray-500 dark:text-gray-400">Your curated menu for stable blood sugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleEvaluatePlan}
              disabled={Object.keys(plan).length === 0}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
                Analyze Plan
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting || Object.keys(plan).length === 0}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
            >
                {isExporting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent flex-shrink-0 rounded-full animate-spin"></div>
                        Exporting...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Export PDF
                    </>
                )}
            </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
        </div>
      )}

      {/* Days Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {days.map(day => (
            <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeDay === day ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
            let statusBg = 'bg-white dark:bg-gray-800';
            let statusBorder = 'border-gray-100 dark:border-gray-700';
            
            if (evaluation) {
                if (evaluation.status === 'good') {
                    statusColor = 'bg-green-500';
                    statusBg = 'bg-green-50 dark:bg-green-900/30';
                    statusBorder = 'border-green-200 dark:border-green-800';
                } else if (evaluation.status === 'warning') {
                    statusColor = 'bg-yellow-500';
                    statusBg = 'bg-yellow-50 dark:bg-yellow-900/30';
                    statusBorder = 'border-yellow-200 dark:border-yellow-800';
                } else if (evaluation.status === 'bad') {
                    statusColor = 'bg-red-500';
                    statusBg = 'bg-red-50 dark:bg-red-900/30';
                    statusBorder = 'border-red-200 dark:border-red-800';
                }
            }

            return (
                <div key={type} className={`p-6 rounded-2xl shadow-sm border ${statusBorder} ${statusBg} flex flex-col justify-between min-h-[10rem] hover:border-primary dark:hover:border-accent transition-colors group relative`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">{type}</span>
                        {isPlanned && !isEditing && (
                            <div className="flex items-center gap-2">
                                {evaluation && <span className={`text-xs font-bold capitalize ${evaluation.status === 'good' ? 'text-green-700 dark:text-green-400' : evaluation.status === 'warning' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'}`}>{evaluation.status}</span>}
                                <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-center">
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea 
                                    className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary dark:focus:ring-accent focus:border-primary dark:focus:border-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={2}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={handleCancelEdit} className="text-xs px-3 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">Cancel</button>
                                    <button onClick={handleSaveEdit} className="text-xs px-3 py-1 bg-primary text-white rounded hover:bg-teal-700">Save</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className={`text-lg font-bold ${isPlanned ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                    {mealName}
                                </h3>
                                {evaluation && (
                                    <p className={`text-sm mt-2 ${evaluation.status === 'good' ? 'text-green-700 dark:text-green-400' : evaluation.status === 'warning' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'}`}>
                                        {evaluation.reason}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-2 gap-2">
                             {isPlanned && (
                               <>
                                 <button 
                                    onClick={() => handlePreview(mealName)}
                                    disabled={isPreviewLoading === mealName}
                                    className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50"
                                 >
                                    {isPreviewLoading === mealName ? '...' : 'Preview'}
                                 </button>
                                 <button 
                                    onClick={() => handleDeleteMeal(activeDay, type)}
                                    className="text-xs px-3 py-1 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors"
                                 >
                                    Delete
                                 </button>
                               </>
                             )}
                             <button 
                                onClick={() => changeView(ViewState.AUDITOR)}
                                className="text-xs px-3 py-1 bg-primary text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                             >
                                {isPlanned ? 'Change' : 'Plan'}
                             </button>
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      <div className="bg-accent/30 dark:bg-accent/20 p-6 rounded-xl border border-accent flex items-start gap-4">
        <span className="text-2xl">💡</span>
        <div>
            <h4 className="font-bold text-gray-800 dark:text-white">Chef's Tip for {activeDay}</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Preparing Monggo on Tuesdays is a Filipino tradition! Remember to skip the pork chicharon topping and use smoked fish (tinapa) flakes for flavor without the saturated fat.
            </p>
        </div>
      </div>
      {previewRecipe && (
        <RecipePreviewModal
          recipe={previewRecipe}
          onClose={() => setPreviewRecipe(null)}
          onImageError={() => setPreviewRecipe(prev => prev ? { ...prev, imageUrl: `https://picsum.photos/seed/fallback-${prev.id}/400/300` } : null)}
        />
      )}
    </div>
  );
};

export default MealPlan;