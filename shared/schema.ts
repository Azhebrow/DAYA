import { z } from 'zod';
import { pgTable, text, serial, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export enum CategoryType {
  TIME = 'time',
  CALORIE = 'calorie',
  CHECKBOX = 'checkbox',
  EXPENSE = 'expense',
  TASK = 'task'
}

export enum TaskType {
  TIME = 'time',
  CALORIE = 'calorie',
  CHECKBOX = 'checkbox',
  EXPENSE = 'expense',
  EXPENSE_NOTE = 'expense_note'
}

// Unified category structure
export type CategoryConfig = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  subcategories: {
    id: string;
    name: string;
    emoji: string;
  }[];
};

// Base database tables
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['time', 'calorie', 'checkbox', 'expense', 'expense_note'] }).notNull(),
  value: integer('value'),
  textValue: text('text_value'),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  categoryId: integer('category_id').notNull()
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  type: text('type', { enum: ['time', 'calorie', 'checkbox', 'expense', 'task'] }).notNull(),
  dayEntryId: integer('day_entry_id').notNull()
});

export const dayEntries = pgTable('day_entries', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  darkMode: boolean('dark_mode').default(false),
  calorieTarget: integer('calorie_target').default(2000),
  timeTarget: integer('time_target').default(60),
  startDate: text('start_date').default('2025-02-07'),
  endDate: text('end_date').default('2025-09-09'),
  viewMode: text('view_mode').default('normal'),
  timeRange: text('time_range').default('7'),
  oathText: text('oath_text'),
  categories: jsonb('categories').$type<{
    mind: CategoryConfig;
    time: CategoryConfig;
    sport: CategoryConfig;
    habits: CategoryConfig;
    expenses: CategoryConfig;
  }>()
});

// Default category configurations
const defaultCategories = {
  mind: {
    id: 'mind',
    name: 'Разум',
    emoji: '🧠',
    color: '--purple',
    subcategories: [
      { id: 'breathing', name: '🫁 Дыхание', emoji: '🫁' },
      { id: 'tea', name: '🍵 Чай', emoji: '🍵' },
      { id: 'cleaning', name: '🧹 Уборка', emoji: '🧹' }
    ]
  },
  time: {
    id: 'time',
    name: 'Время',
    emoji: '⏰',
    color: '--green',
    subcategories: [
      { id: 'work', name: '💼 Работа', emoji: '💼' },
      { id: 'study', name: '📚 Учёба', emoji: '📚' },
      { id: 'project', name: '🎯 Проект', emoji: '🎯' }
    ]
  },
  sport: {
    id: 'sport',
    name: 'Спорт',
    emoji: '🏃',
    color: '--red',
    subcategories: [
      { id: 'pills', name: '💊 Таблетки', emoji: '💊' },
      { id: 'training', name: '🏋️‍♂️ Тренировка', emoji: '🏋️‍♂️' },
      { id: 'calories', name: '🔥 Калории', emoji: '🔥' }
    ]
  },
  habits: {
    id: 'habits',
    name: 'Привычки',
    emoji: '🎯',
    color: '--orange',
    subcategories: [
      { id: 'no_junk_food', name: '🍔 Дерьмо', emoji: '🍔' },
      { id: 'no_money_waste', name: '💸 Траты', emoji: '💸' },
      { id: 'no_adult', name: '🔞 Порно', emoji: '🔞' }
    ]
  },
  expenses: {
    id: 'expenses',
    name: 'Траты',
    emoji: '💰',
    color: '--orange',
    subcategories: [
      { id: 'food', name: '🍽️ Еда', emoji: '🍽️' },
      { id: 'junk', name: '🍕 Дерьмо', emoji: '🍕' },
      { id: 'city', name: '🌆 Город', emoji: '🌆' },
      { id: 'sport', name: '⚽ Спорт', emoji: '⚽' },
      { id: 'fun', name: '🎮 Отдых', emoji: '🎮' },
      { id: 'service', name: '🔧 Сервис', emoji: '🔧' },
      { id: 'other', name: '📦 Разное', emoji: '📦' }
    ]
  }
};

// Zod schemas
export const taskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Task name is required"),
  type: z.enum(['time', 'calorie', 'checkbox', 'expense', 'expense_note']),
  value: z.number().optional(),
  textValue: z.string().optional(),
  completed: z.boolean().default(false),
  createdAt: z.string()
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  type: z.enum(['time', 'calorie', 'checkbox', 'expense', 'task']),
  tasks: z.array(taskSchema).default([])
});

export const dayEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  categories: z.array(categorySchema).default([])
});

export const settingsSchema = z.object({
  id: z.number().optional(),
  userId: z.number().optional(),
  darkMode: z.boolean().default(false),
  calorieTarget: z.number().default(2000),
  timeTarget: z.number().default(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").default('2025-02-07'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").default('2025-09-09'),
  viewMode: z.enum(['normal', 'weekly', 'monthly']).default('normal'),
  timeRange: z.enum(['7', '14', '30']).default('7'),
  oathText: z.string().optional(),
  categories: z.record(z.string(), z.object({
    id: z.string(),
    name: z.string(),
    emoji: z.string(),
    color: z.string(),
    subcategories: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string()
    }))
  })).default(defaultCategories)
});

// Schema for database operations
export const insertTaskSchema = createInsertSchema(tasks);
export const insertCategorySchema = createInsertSchema(categories);
export const insertDayEntrySchema = createInsertSchema(dayEntries);
export const insertSettingsSchema = createInsertSchema(settings);

// Type exports
export type Task = z.infer<typeof taskSchema>;
export type Category = z.infer<typeof categorySchema>;
export type DayEntry = z.infer<typeof dayEntrySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertDayEntry = z.infer<typeof insertDayEntrySchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = z.infer<typeof settingsSchema>;