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

export enum PomodoroSessionType {
  WORK = 'work',
  BREAK = 'break'
}

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
  colors: jsonb('colors').$type<{
    mind: string;
    time: string;
    sport: string;
    habits: string;
    expenses: string;
    daySuccess: string;
  }>(),
  subcategories: jsonb('subcategories').$type<{
    mind: { id: string; name: string; emoji: string; }[];
    time: { id: string; name: string; emoji: string; }[];
    sport: { id: string; name: string; emoji: string; }[];
    habits: { id: string; name: string; emoji: string; }[];
  }>()
});

const defaultSubcategories = {
  mind: [
    { id: 'breathing', name: '🫁 Дыхание', emoji: '🫁' },
    { id: 'tea', name: '🍵 Чай', emoji: '🍵' },
    { id: 'cleaning', name: '🧹 Уборка', emoji: '🧹' }
  ],
  time: [
    { id: 'work', name: '💼 Работа', emoji: '💼' },
    { id: 'study', name: '📚 Учёба', emoji: '📚' },
    { id: 'project', name: '🎯 Проект', emoji: '🎯' }
  ],
  sport: [
    { id: 'pills', name: '💊 Таблетки', emoji: '💊' },
    { id: 'training', name: '🏋️‍♂️ Тренировка', emoji: '🏋️‍♂️' },
    { id: 'calories', name: '🔥 Калории', emoji: '🔥' }
  ],
  habits: [
    { id: 'no_junk_food', name: '🍔 Дерьмо', emoji: '🍔' },
    { id: 'no_money_waste', name: '💸 Траты', emoji: '💸' },
    { id: 'no_adult', name: '🔞 Порно', emoji: '🔞' }
  ]
};

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
  colors: z.object({
    mind: z.string(),
    time: z.string(),
    sport: z.string(),
    habits: z.string(),
    expenses: z.string(),
    daySuccess: z.string()
  }).default({
    mind: '--purple',
    time: '--green',
    sport: '--red',
    habits: '--orange',
    expenses: '--orange',
    daySuccess: '--green'
  }),
  subcategories: z.object({
    mind: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string()
    })),
    time: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string()
    })),
    sport: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string()
    })),
    habits: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string()
    })),
    expenses: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string()
    }))
  }).default({
    mind: [
      { id: 'breathing', name: '🫁 Дыхание', emoji: '🫁' },
      { id: 'tea', name: '🍵 Чай', emoji: '🍵' },
      { id: 'cleaning', name: '🧹 Уборка', emoji: '🧹' }
    ],
    time: [
      { id: 'work', name: '💼 Работа', emoji: '💼' },
      { id: 'study', name: '📚 Учёба', emoji: '📚' },
      { id: 'project', name: '🎯 Проект', emoji: '🎯' }
    ],
    sport: [
      { id: 'pills', name: '💊 Таблетки', emoji: '💊' },
      { id: 'training', name: '🏋️‍♂️ Тренировка', emoji: '🏋️‍♂️' },
      { id: 'calories', name: '🔥 Калории', emoji: '🔥' }
    ],
    habits: [
      { id: 'no_junk_food', name: '🍔 Дерьмо', emoji: '🍔' },
      { id: 'no_money_waste', name: '💸 Траты', emoji: '💸' },
      { id: 'no_adult', name: '🔞 Порно', emoji: '🔞' }
    ],
    expenses: [
      { id: 'food', name: '🍽️ Еда', emoji: '🍽️' },
      { id: 'junk', name: '🍕 Дерьмо', emoji: '🍕' },
      { id: 'city', name: '🌆 Город', emoji: '🌆' },
      { id: 'sport', name: '⚽ Спорт', emoji: '⚽' },
      { id: 'fun', name: '🎮 Отдых', emoji: '🎮' },
      { id: 'service', name: '🔧 Сервис', emoji: '🔧' },
      { id: 'other', name: '📦 Разное', emoji: '📦' }
    ]
  })
});

export const insertTaskSchema = createInsertSchema(tasks);
export const insertCategorySchema = createInsertSchema(categories);
export const insertDayEntrySchema = createInsertSchema(dayEntries);
export const insertSettingsSchema = createInsertSchema(settings);

export type Task = z.infer<typeof taskSchema>;
export type Category = z.infer<typeof categorySchema>;
export type DayEntry = z.infer<typeof dayEntrySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertDayEntry = z.infer<typeof insertDayEntrySchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = z.infer<typeof settingsSchema>;