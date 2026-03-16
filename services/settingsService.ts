import { getUserSettings, updateUserSettings } from './authService';

// Cache utility for storing user settings
export class SettingsCache {
  private static instance: SettingsCache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SettingsCache {
    if (!SettingsCache.instance) {
      SettingsCache.instance = new SettingsCache();
    }
    return SettingsCache.instance;
  }

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Optimized settings service with caching
export const settingsService = {
  async getSettings(userId: string) {
    const cache = SettingsCache.getInstance();
    const cacheKey = `settings_${userId}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch from API
    const settings = await getUserSettings();
    cache.set(cacheKey, settings);
    
    return settings;
  },

  async updateSettings(userId: string, settings: any) {
    const cache = SettingsCache.getInstance();
    const cacheKey = `settings_${userId}`;
    
    // Update cache immediately (optimistic update)
    cache.set(cacheKey, settings);
    
    // Update API in background
    try {
      const updated = await updateUserSettings(settings);
      // Update cache with server response
      cache.set(cacheKey, updated);
      return updated;
    } catch (error) {
      // Revert cache on error
      cache.delete(cacheKey);
      throw error;
    }
  },

  clearCache(userId: string): void {
    const cache = SettingsCache.getInstance();
    cache.delete(`settings_${userId}`);
  }
};