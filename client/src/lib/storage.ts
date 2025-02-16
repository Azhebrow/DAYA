import { DayEntry, Settings, dayEntrySchema, settingsSchema } from '@shared/schema';

const STORAGE_KEYS = {
  DAYS: 'day_success_tracker_days',
  SETTINGS: 'day_success_tracker_settings',
  VERSION: 'day_success_tracker_version'
};

const defaultSettings: Settings = {
  darkMode: false,
  calorieTarget: 2000,
  timeTarget: 60,
  startDate: '2025-02-07',
  endDate: '2025-09-09',
  showFormula: false
};

export const storage = {
  getSettings: (): Settings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? settingsSchema.parse(JSON.parse(stored)) : defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  },

  saveSettings: (settings: Settings): void => {
    try {
      const validatedSettings = settingsSchema.parse(settings);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(validatedSettings));
      if (validatedSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      storage.updateVersion();
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  getDayEntry: (date: string): DayEntry | null => {
    try {
      const days = storage.getAllDays();
      return days.find(day => day.date === date) || null;
    } catch (error) {
      console.error('Error getting day entry:', error);
      return null;
    }
  },

  getAllDays: (): DayEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DAYS);
      if (!stored) return [];
      const days = JSON.parse(stored);
      return Array.isArray(days) ? days.map(day => dayEntrySchema.parse(day)) : [];
    } catch (error) {
      console.error('Error getting all days:', error);
      localStorage.removeItem(STORAGE_KEYS.DAYS);
      return [];
    }
  },

  saveDayEntry: (entry: DayEntry): void => {
    try {
      const validatedEntry = dayEntrySchema.parse(entry);
      const days = storage.getAllDays();
      const existingIndex = days.findIndex(day => day.date === entry.date);

      if (existingIndex >= 0) {
        days[existingIndex] = validatedEntry;
      } else {
        days.push(validatedEntry);
      }

      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
      storage.updateVersion();
    } catch (error) {
      console.error('Error saving day entry:', error);
      throw error;
    }
  },

  updateVersion: (): void => {
    localStorage.setItem(STORAGE_KEYS.VERSION, Date.now().toString());
    window.dispatchEvent(new Event('storage'));
  },

  removeDayEntry: (date: string): void => {
    try {
      const days = storage.getAllDays();
      const filteredDays = days.filter(day => day.date !== date);
      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(filteredDays));
      storage.updateVersion();
    } catch (error) {
      console.error('Error removing day entry:', error);
      throw error;
    }
  },

  // New functions for export/import
  exportData: (): string => {
    try {
      const data = {
        days: storage.getAllDays(),
        settings: storage.getSettings()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  importData: (jsonData: string): void => {
    try {
      const data = JSON.parse(jsonData);

      // Validate and import settings
      if (data.settings) {
        const validatedSettings = settingsSchema.parse(data.settings);
        storage.saveSettings(validatedSettings);
      }

      // Validate and import days
      if (Array.isArray(data.days)) {
        const validatedDays = data.days.map(day => dayEntrySchema.parse(day));
        localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(validatedDays));
        storage.updateVersion();
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }
};