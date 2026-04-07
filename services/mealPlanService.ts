import apiFetch from './authService';

/**
 * Fetch the user's current meal plan from the backend.
 */
export const getMealPlan = async (): Promise<Record<string, Record<string, string>>> => {
  const res = await apiFetch('/api/mealplan/', {
    method: 'GET',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch meal plan.');
  }

  const data = await res.json();
  return data.plan_data;
};

/**
 * Save or update the meal plan on the backend.
 */
export const saveMealPlan = async (
  planData: Record<string, Record<string, string>>,
  weekStart?: string
): Promise<void> => {
  const res = await apiFetch('/api/mealplan/', {
    method: 'POST',
    body: JSON.stringify({
      week_start: weekStart || new Date().toISOString().split('T')[0], // Defaults to today's date if omitted
      plan_data: planData,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save meal plan.');
  }
};
