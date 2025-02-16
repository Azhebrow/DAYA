import { DayEntry, Settings, dayEntrySchema, settingsSchema } from '@shared/schema';

type TaskData = {
  id: string;
  name: string;
  emoji: string;
  type: string;
  value?: number;
  completed?: boolean;
  textValue?: string;
};

type CategoryData = {
  name: string;
  type: string;
  tasks: TaskData[];
};

const STORAGE_KEYS = {
  DAYS: 'day_success_tracker_days',
  SETTINGS: 'day_success_tracker_settings',
  TASKS: 'tasks',
  VERSION: 'day_success_tracker_version'
};

const defaultSettings: Settings = settingsSchema.parse({
  darkMode: false,
  calorieTarget: 2000,
  timeTarget: 60 * 8, // 8 hours in minutes
  startDate: '2025-02-07',
  endDate: '2025-09-09',
  colors: {
    mind: '--purple',
    time: '--green',
    sport: '--red',
    habits: '--orange',
    expenses: '--orange',
    daySuccess: '--green'
  }
});

// Default tasks structure
const DEFAULT_TASKS: CategoryData[] = [
  {
    name: 'Разум',
    type: 'mind',
    tasks: [
      { id: '1', name: 'Дыхание', emoji: '🫁', type: 'checkbox', completed: false },
      { id: '2', name: 'Чай', emoji: '🍵', type: 'checkbox', completed: false },
    ]
  },
  {
    name: 'Время',
    type: 'time',
    tasks: [
      { id: '3', name: 'Уборка', emoji: '🧹', type: 'time', value: 0 },
      { id: '4', name: 'Работа', emoji: '💼', type: 'time', value: 0 },
      { id: '5', name: 'Учёба', emoji: '📚', type: 'time', value: 0 },
      { id: '6', name: 'Проект', emoji: '🎯', type: 'time', value: 0 },
    ]
  },
  {
    name: 'Здоровье',
    type: 'health',
    tasks: [
      { id: '7', name: 'Таблетки', emoji: '💊', type: 'checkbox', completed: false },
    ]
  },
  {
    name: 'Пороки',
    type: 'habits',
    tasks: [
      { id: '8', name: 'Дерьмо', emoji: '🍔', type: 'checkbox', completed: false },
      { id: '9', name: 'Порно', emoji: '🔞', type: 'checkbox', completed: false },
    ]
  },
  {
    name: 'Траты',
    type: 'expenses',
    tasks: [
      { id: '10', name: 'Траты', emoji: '💸', type: 'expense', value: 0 },
    ]
  }
];

// Event system for synchronization
const subscribers = new Set<() => void>();

export const storage = {
  subscribe(callback: () => void) {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  },

  notifySubscribers() {
    subscribers.forEach(callback => callback());
  },

  getTasks(): CategoryData[] {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!stored) {
      this.saveTasks(DEFAULT_TASKS);
      return DEFAULT_TASKS;
    }
    return JSON.parse(stored);
  },

  saveTasks(tasks: CategoryData[]) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    this.updateVersion();
    this.notifySubscribers();
  },

  updateTask(categoryName: string, taskId: string, updates: Partial<TaskData>) {
    const tasks = this.getTasks();
    const updatedTasks = tasks.map(category => {
      if (category.name === categoryName) {
        return {
          ...category,
          tasks: category.tasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        };
      }
      return category;
    });
    this.saveTasks(updatedTasks);
  },

  getSettings(): Settings {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? settingsSchema.parse(JSON.parse(stored)) : defaultSettings;
  },

  saveSettings(settings: Settings) {
    const validatedSettings = settingsSchema.parse(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(validatedSettings));
    if (validatedSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.updateVersion();
    this.notifySubscribers();
  },

  updateVersion() {
    localStorage.setItem(STORAGE_KEYS.VERSION, Date.now().toString());
    window.dispatchEvent(new Event('storage'));
  },

  getAllDays(): DayEntry[] {
    const stored = localStorage.getItem(STORAGE_KEYS.DAYS);
    if (!stored) return [];
    const days = JSON.parse(stored);
    return Array.isArray(days) ? days.map(day => dayEntrySchema.parse(day)) : [];
  },

  getDayEntry(date: string): DayEntry | null {
    const days = this.getAllDays();
    return days.find(day => day.date === date) || null;
  },

  saveDayEntry(entry: DayEntry) {
    const days = this.getAllDays();
    const existingIndex = days.findIndex(day => day.date === entry.date);

    if (existingIndex >= 0) {
      days[existingIndex] = entry;
    } else {
      days.push(entry);
    }

    localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(days));
    this.updateVersion();
    this.notifySubscribers();
  },

  removeDayEntry(date: string) {
    const days = this.getAllDays();
    const filteredDays = days.filter(day => day.date !== date);
    localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(filteredDays));
    this.updateVersion();
    this.notifySubscribers();
  },
  exportData: (): string => {
    try {
      const data = {
        days: storage.getAllDays(),
        settings: storage.getSettings(),
        tasks: storage.getTasks()
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

      // Import tasks
      if (Array.isArray(data.tasks)) {
        storage.saveTasks(data.tasks);
      }

      // Validate and import days
      if (Array.isArray(data.days)) {
        const validatedDays = data.days.map(day => dayEntrySchema.parse(day));
        localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(validatedDays));
        storage.updateVersion();
      }

      storage.notifySubscribers();
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }
};