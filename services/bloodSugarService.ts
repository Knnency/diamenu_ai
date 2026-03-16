import apiFetch from './authService';
import { BloodSugarLog } from '../types';

/**
 * Fetch all blood sugar logs for the authenticated user.
 */
export const getBloodSugarLogs = async (): Promise<BloodSugarLog[]> => {
  const res = await apiFetch('/api/bloodsugar/logs/', {
    method: 'GET',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch blood sugar logs.');
  }

  const data = await res.json();
  // Backend might return paginated results { count, next, previous, results: [] }
  // or a direct array depending on Django REST Framework configuration.
  return Array.isArray(data) ? data : (data.results || []);
};

/**
 * Save a new blood sugar log for the authenticated user.
 */
export const saveBloodSugarLog = async (logData: Omit<BloodSugarLog, 'id'>): Promise<BloodSugarLog> => {
  const res = await apiFetch('/api/bloodsugar/logs/', {
    method: 'POST',
    body: JSON.stringify({
      date: logData.date,
      time: logData.time,
      value: logData.value,
      context: logData.context,
      notes: logData.notes || '',
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to save blood sugar log.');
  }

  return await res.json();
};

/**
 * Delete a specific blood sugar log by ID.
 */
export const deleteBloodSugarLog = async (id: string | number): Promise<void> => {
  const res = await apiFetch(`/api/bloodsugar/logs/${id}/`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete blood sugar log.');
  }
};
