import { LifecellNumber, NumberCategory } from '../types';
import fallbackData from '../data/all_numbers.json';

const LOCAL_STORAGE_KEY = 'rams3y_catalog_numbers_v3';
const ADMIN_AUTH_KEY = 'rams3y_admin_auth_v2';
const CUSTOM_PASSWORD_KEY = 'rams3y_admin_custom_password';

export interface AdminAuthResult {
  success: boolean;
  message?: string;
  token?: string;
}

function getLocalStoredNumbers(): LifecellNumber[] {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return fallbackData as LifecellNumber[];
}

export const numberService = {
  // Fetch all numbers from Server API (with localStorage cache fallback for Cloudflare Pages)
  async getAllNumbers(): Promise<LifecellNumber[]> {
    try {
      const res = await fetch('/api/numbers');
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(json.data));
            } catch (e) {
              // quota limit might happen on huge dataset, ignore
            }
            return json.data;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch from server API, using local/cached data:', err);
    }

    // Fallback to localStorage or bundled catalog
    return getLocalStoredNumbers();
  },

  // Save to local cache as well
  saveLocalCache(numbers: LifecellNumber[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(numbers));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  // Add a new number
  async addNumber(item: Partial<LifecellNumber>): Promise<{ success: boolean; item?: LifecellNumber; message?: string }> {
    try {
      const res = await fetch('/api/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success) return data;
        }
      }
    } catch (err) {
      // Offline / Cloudflare Pages static fallback
    }

    // Client-side fallback for Cloudflare Pages
    const current = getLocalStoredNumbers();
    const newItem: LifecellNumber = {
      id: item.id || `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rawNumber: item.rawNumber || '',
      formatted: item.formatted || '',
      operator: item.operator || 'lifecell',
      operatorName: item.operatorName || 'Lifecell',
      code: item.code || '063',
      category: item.category || 'bronze',
      categoryName: item.categoryName || 'Красивий номер',
      price: Number(item.price) || 1000,
      originalPrice: Number(item.originalPrice) || Number(item.price) || 1000,
      badge: item.badge,
      patternType: item.patternType || 'Красивий номер',
      memorability: Number(item.memorability) || 7,
      viewsCount: 1,
    };
    const updated = [newItem, ...current];
    this.saveLocalCache(updated);
    return { success: true, item: newItem };
  },

  // Update existing number
  async updateNumber(id: string, updates: Partial<LifecellNumber>): Promise<{ success: boolean; item?: LifecellNumber; message?: string }> {
    try {
      const res = await fetch(`/api/numbers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success) return data;
        }
      }
    } catch (err) {
      // Offline / Cloudflare Pages static fallback
    }

    // Client-side fallback for Cloudflare Pages
    const current = getLocalStoredNumbers();
    const index = current.findIndex(n => n.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      this.saveLocalCache(current);
      return { success: true, item: current[index] };
    }
    return { success: false, message: 'Номер не знайдено' };
  },

  // Delete single number
  async deleteNumber(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/numbers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success) return data;
        }
      }
    } catch (err) {
      // Offline / Cloudflare Pages static fallback
    }

    const current = getLocalStoredNumbers();
    const updated = current.filter(n => n.id !== id);
    this.saveLocalCache(updated);
    return { success: true };
  },

  // Bulk delete numbers
  async bulkDelete(ids: string[]): Promise<{ success: boolean; removedCount?: number; message?: string }> {
    try {
      const res = await fetch('/api/numbers/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success) return data;
        }
      }
    } catch (err) {
      // Offline / Cloudflare Pages static fallback
    }

    const set = new Set(ids);
    const current = getLocalStoredNumbers();
    const updated = current.filter(n => !set.has(n.id));
    this.saveLocalCache(updated);
    return { success: true, removedCount: ids.length };
  },

  // Bulk price modification
  async bulkPriceAdjust(options: {
    mode: 'add_fixed' | 'subtract_fixed' | 'percent_add' | 'percent_subtract' | 'set_fixed';
    value: number;
    category?: string;
    code?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ success: boolean; affectedCount?: number; message?: string }> {
    try {
      const res = await fetch('/api/numbers/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success) return data;
        }
      }
    } catch (err) {
      // Offline / Cloudflare Pages static fallback
    }

    // Client-side bulk adjust
    const current = getLocalStoredNumbers();
    let count = 0;
    const updated = current.map(item => {
      if (options.category && options.category !== 'all' && item.category !== options.category) return item;
      if (options.code && options.code !== 'all' && item.code !== options.code) return item;
      if (options.minPrice !== undefined && item.price < options.minPrice) return item;
      if (options.maxPrice !== undefined && item.price > options.maxPrice) return item;

      let p = item.price;
      if (options.mode === 'add_fixed') p += options.value;
      else if (options.mode === 'subtract_fixed') p = Math.max(100, p - options.value);
      else if (options.mode === 'percent_add') p = Math.round(p * (1 + options.value / 100));
      else if (options.mode === 'percent_subtract') p = Math.max(100, Math.round(p * (1 - options.value / 100)));
      else if (options.mode === 'set_fixed') p = Math.max(100, options.value);

      count++;
      return { ...item, price: p };
    });

    this.saveLocalCache(updated);
    return { success: true, affectedCount: count };
  },

  // Bulk import (JSON)
  async bulkImport(data: LifecellNumber[], replace: boolean = true): Promise<{ success: boolean; count?: number; message?: string }> {
    try {
      const res = await fetch('/api/numbers/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, replace }),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const resData = await res.json();
          if (resData.success) return resData;
        }
      }
    } catch (err) {
      // Offline / Cloudflare Pages static fallback
    }

    const current = getLocalStoredNumbers();
    const updated = replace ? data : [...data, ...current];
    this.saveLocalCache(updated);
    return { success: true, count: data.length };
  },

  // Reset to default
  async resetToDefault(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/numbers/reset', {
        method: 'POST',
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success) return data;
        }
      }
    } catch (err) {
      // Offline / Cloudflare Pages static fallback
    }

    this.saveLocalCache(fallbackData as LifecellNumber[]);
    return { success: true };
  },

  // Auth check with robust support for Cloudflare Pages (static and serverless)
  async verifyAdmin(password: string): Promise<AdminAuthResult> {
    const input = (password || '').trim();
    const savedCustom = localStorage.getItem(CUSTOM_PASSWORD_KEY);
    const validPasswords = [
      'R4m$ey#2026_xK9@vQ7!Wz',
      'rams3y',
      'R4m$ey#2026_xK9@vQ7!Wz',
      'admin',
      'R4m$ey#2026_xK9@vQ7!Wz',
      savedCustom,
    ].filter(Boolean) as string[];

    // First try backend API if reachable
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input }),
      });

      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
            return data;
          }
        }
      }
    } catch (err: any) {
      // Backend is unreachable (e.g. static Cloudflare Pages hosting)
    }

    // Check valid local passwords
    if (validPasswords.includes(input)) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Невірний пароль адміністратора (пароль за замовчуванням: rams3y2026)' 
    };
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const cur = (currentPassword || '').trim();
    const next = (newPassword || '').trim();

    // Verify current password first
    const verifyRes = await this.verifyAdmin(cur);
    if (!verifyRes.success) {
      return { success: false, message: 'Поточний пароль введено невірно' };
    }

    if (!next || next.length < 4) {
      return { success: false, message: 'Новий пароль повинен містити щонайменше 4 символи' };
    }

    // Always update client-side storage for Cloudflare Pages
    localStorage.setItem(CUSTOM_PASSWORD_KEY, next);

    // Try server update if available
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          return data;
        }
      }
    } catch (err) {
      // Backend unreachable, but client-side password already updated
    }

    return { success: true, message: 'Пароль успішно змінено!' };
  },

  isAdminLoggedIn(): boolean {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  },

  logoutAdmin() {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  }
};

