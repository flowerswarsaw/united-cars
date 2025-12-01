import { promises as fs } from 'fs';
import * as path from 'path';
import type { UserProfile, UserPreferences, CompanySettings } from '../types';

const DATA_DIR = path.join(process.cwd(), '.mock-data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

interface MockDataSnapshot {
  userProfiles: UserProfile[];
  userPreferences: UserPreferences[];
  companySettings: CompanySettings[];
  userSettings: any[]; // From mockDB.userSettings
  timestamp: string;
}

export class MockDataPersistence {
  private isEnabled = process.env.NODE_ENV !== 'production';

  async save(data: {
    userProfiles: UserProfile[];
    userPreferences: UserPreferences[];
    companySettings: CompanySettings[];
    userSettings: any[];
  }): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      const snapshot: MockDataSnapshot = {
        ...data,
        timestamp: new Date().toISOString()
      };

      await fs.writeFile(DATA_FILE, JSON.stringify(snapshot, null, 2));
    } catch (error) {
      console.error('Failed to save mock data:', error);
    }
  }

  async load(): Promise<MockDataSnapshot | null> {
    if (!this.isEnabled) return null;

    try {
      const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(dataStr) as MockDataSnapshot;
      return data;
    } catch (error) {
      // File doesn't exist or can't be read - will use seed data
      return null;
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fs.unlink(DATA_FILE);
    } catch (error) {
      // File might not exist
    }
  }
}

export const mockDataPersistence = new MockDataPersistence();

// Client-side localStorage adapter for mock data
export class MockDataLocalStorageAdapter {
  private prefix = 'mock_data_';

  save(key: string, data: any): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  load<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const mockDataLocalStorage = new MockDataLocalStorageAdapter();
