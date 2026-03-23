import apiFetch from './authService';
import { PantryItem } from '../types';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  const res = await apiFetch('/api/pantry/items/', {
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch pantry items.');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results || []);
};

export const addPantryItem = async (item: Omit<PantryItem, 'id'>): Promise<PantryItem> => {
  const res = await apiFetch('/api/pantry/items/', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to add pantry item.');
  return await res.json();
};

export const deletePantryItem = async (id: string): Promise<void> => {
  const res = await apiFetch(`/api/pantry/items/${id}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete pantry item.');
};
