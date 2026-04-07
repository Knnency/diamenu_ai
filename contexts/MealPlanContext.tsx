import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMealPlan, saveMealPlan as saveMealPlanApi } from '../services/mealPlanService';
import { evaluateWeeklyPlan } from '../services/geminiService';

interface Evaluation {
  status: 'good' | 'warning' | 'bad';
  reason: string;
}

interface MealPlanContextType {
  plan: Record<string, Record<string, string>>;
  evaluations: Record<string, Record<string, Evaluation>> | null;
  isEvaluating: boolean;
  isLoading: boolean;
  error: string | null;
  setPlan: (plan: Record<string, Record<string, string>>) => void;
  updateMeal: (day: string, type: string, value: string) => Promise<void>;
  deleteMeal: (day: string, type: string) => Promise<void>;
  handleEvaluatePlan: () => Promise<void>;
  clearEvaluations: () => void;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

const STORAGE_KEY = 'meal_plan_evaluations_v1';

export const MealPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [plan, setPlanState] = useState<Record<string, Record<string, string>>>({});
  const [evaluations, setEvaluations] = useState<Record<string, Record<string, Evaluation>> | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      // Check for token before making the initial call
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Load cached evaluations first for instant UI feedback
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            setEvaluations(JSON.parse(cached));
          } catch (e) {
            console.error("Failed to parse cached evaluations");
          }
        }

        const savedPlan = await getMealPlan();
        setPlanState(savedPlan);
      } catch (err: any) {
        if (err.message !== 'PLAN_NOT_FOUND') {
          console.error("MealPlan initialization error:", err);
          setError("Failed to load your latest meal plan.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Persist evaluations to localStorage whenever they change
  useEffect(() => {
    if (evaluations) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
    }
  }, [evaluations]);

  const handleEvaluatePlan = useCallback(async () => {
    if (Object.keys(plan).length === 0) return;
    
    setIsEvaluating(true);
    setError(null);
    try {
      const result = await evaluateWeeklyPlan(plan);
      setEvaluations(result);
    } catch (err: any) {
      console.error("Evaluation failed:", err);
      setError(err.message || "Failed to evaluate plan. Please check your connection.");
    } finally {
      setIsEvaluating(false);
    }
  }, [plan]);

  const updateMeal = async (day: string, type: string, value: string) => {
    const updatedPlan = {
      ...plan,
      [day]: {
        ...(plan[day] || {}),
        [type]: value
      }
    };
    
    try {
      await saveMealPlanApi(updatedPlan);
      setPlanState(updatedPlan);
      
      // Invalidate the evaluation for this specific meal if it exists
      if (evaluations && evaluations[day] && evaluations[day][type]) {
        setEvaluations(prev => {
          if (!prev) return null;
          const newEvals = { ...prev };
          if (newEvals[day]) {
            newEvals[day] = { ...newEvals[day] };
            delete newEvals[day][type];
          }
          return newEvals;
        });
      }
    } catch (err) {
      console.error("Failed to update meal:", err);
      throw err;
    }
  };

  const deleteMeal = async (day: string, type: string) => {
    const updatedPlan = {
      ...plan,
      [day]: { ...(plan[day] || {}) }
    };
    delete updatedPlan[day][type];
    
    try {
      await saveMealPlanApi(updatedPlan);
      setPlanState(updatedPlan);
      
      // Invalidate the evaluation
      if (evaluations && evaluations[day] && evaluations[day][type]) {
        setEvaluations(prev => {
          if (!prev) return null;
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
      throw err;
    }
  };

  const clearEvaluations = () => {
    setEvaluations(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <MealPlanContext.Provider value={{
      plan,
      evaluations,
      isEvaluating,
      isLoading,
      error,
      setPlan: setPlanState,
      updateMeal,
      deleteMeal,
      handleEvaluatePlan,
      clearEvaluations
    }}>
      {children}
    </MealPlanContext.Provider>
  );
};

export const useMealPlan = () => {
  const context = useContext(MealPlanContext);
  if (context === undefined) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
};
