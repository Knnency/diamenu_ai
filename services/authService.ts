const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// --- Token helpers ---
export const getAccessToken = (): string | null => localStorage.getItem('access_token');
export const getRefreshToken = (): string | null => localStorage.getItem('refresh_token');
export const getStoredUser = () => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
};
const storeTokens = (access: string, refresh: string, user: object) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  localStorage.setItem('user', JSON.stringify(user));
};
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// --- Base fetch with auth ---
const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res;
};

// Safely parse JSON — avoids crash when server returns an HTML error page
const safeJson = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}): The backend returned an unexpected response. Make sure the Django server is running.`);
  }
  return res.json();
};


// --- Auth API calls ---
export const loginWithEmail = async (email: string, password: string) => {
  const res = await apiFetch('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Login failed. Check your email and password.');
  storeTokens(data.access, data.refresh, data.user);
  return data.user;
};

export const registerWithEmail = async (name: string, email: string, password: string) => {
  const res = await apiFetch('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    const msg = data.email?.[0] || data.password?.[0] || data.detail || 'Registration failed.';
    throw new Error(msg);
  }
  return data;
};

export const sendRegistrationOTP = async (email: string) => {
  const res = await apiFetch('/api/auth/send-registration-otp/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to send verification code.');
  }
  return data;
};

export const verifyRegistrationOTP = async (email: string, otp: string) => {
  const res = await apiFetch('/api/auth/verify-registration-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(data.detail || 'Invalid verification code.');
  }
  // Store the authentication tokens and return user data
  storeTokens(data.access, data.refresh, data.user);
  return data.user;
};

export const loginWithGoogle = async (credential: string) => {
  const res = await apiFetch('/api/auth/google/', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Google login failed.');
  storeTokens(data.access, data.refresh, data.user);
  return data.user;
};

export const requestPasswordReset = async (email: string) => {
  const res = await apiFetch('/api/auth/password-reset/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || 'Failed to send reset email.');
  }
  return true;
};

export const verifyPasswordResetOTP = async (email: string, otp: string): Promise<string> => {
  const res = await apiFetch('/api/auth/password-reset/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Invalid or expired OTP.');
  return data.reset_token as string;
};

export const confirmPasswordReset = async (reset_token: string, new_password: string) => {
  const res = await apiFetch('/api/auth/password-reset/confirm/', {
    method: 'POST',
    body: JSON.stringify({ reset_token, new_password }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Failed to reset password.');
  return data;
};

// --- Recipe Saving API calls ---
export interface RecipeIdea {
  id: string;
  title: string;
  tags: string[];
  description: string;
  ingredients?: string[];
  preparation?: string[];
  instructions?: string[];
}

export interface SavedRecipe extends RecipeIdea {
  servings: string;
  country: string;
  dietary_options: string[];
  allergies: string[];
  ingredients_to_avoid: string[];
  created_at: string;
  updated_at: string;
}

export const saveRecipe = async (recipe: RecipeIdea, settings: {
  servings: string;
  country: string;
  dietaryOptions: string[];
  allergies: string[];
  ingredientsToAvoid: string[];
}): Promise<SavedRecipe> => {
  const res = await apiFetch('/api/auth/saved-recipes/', {
    method: 'POST',
    body: JSON.stringify({
      title: recipe.title,
      description: recipe.description,
      tags: recipe.tags,
      ingredients: recipe.ingredients || [],
      preparation: recipe.preparation || [],
      instructions: recipe.instructions || [],
      servings: settings.servings,
      country: settings.country,
      dietary_options: settings.dietaryOptions,
      allergies: settings.allergies,
      ingredients_to_avoid: settings.ingredientsToAvoid,
    }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Failed to save recipe.');
  return data;
};

export const getSavedRecipes = async (): Promise<SavedRecipe[]> => {
  const res = await apiFetch('/api/auth/saved-recipes/', {
    method: 'GET',
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch saved recipes.');
  return data.results || data;
};

export const deleteSavedRecipe = async (recipeId: number): Promise<void> => {
  const res = await apiFetch(`/api/auth/saved-recipes/${recipeId}/`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data.detail || 'Failed to delete saved recipe.');
  }
};

// --- User Profile Settings API calls ---
export interface UserSettings {
  age: number | null;
  diabetes_type: string;
  dietary_preferences: string[];
  allergens: string[];
  diagnosis: string;
  hba1c: string;
  fbs: string;
  total_cholesterol: string;
  medications: string;
  restrictions: string;
}

export const getUserSettings = async (): Promise<UserSettings> => {
  const res = await apiFetch('/api/auth/profile/', {
    method: 'GET',
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch user settings.');
  return data.profile;
};

export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  const res = await apiFetch('/api/auth/profile/', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data.detail || 'Failed to update user settings.');
  return data.profile || data;
};

export default apiFetch;
