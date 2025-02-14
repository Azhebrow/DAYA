import { z } from 'zod';
import { pgTable, text, serial, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
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

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
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
  type: text('type').notNull(),
  dayEntryId: integer('day_entry_id').notNull()
});

export const dayEntries = pgTable('day_entries', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(),
});

export const taskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Task name is required"),
  type: z.nativeEnum(TaskType),
  value: z.number().optional(),
  textValue: z.string().optional(),
  completed: z.boolean().default(false),
  createdAt: z.string()
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  type: z.nativeEnum(CategoryType),
  tasks: z.array(taskSchema).default([])
});

export const dayEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  categories: z.array(categorySchema).default([])
});

export const settingsSchema = z.object({
  darkMode: z.boolean().default(false),
  calorieTarget: z.number().default(2000),
  timeTarget: z.number().default(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").default('2025-02-07'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").default('2025-09-09'),
  viewMode: z.enum(['normal', 'weekly', 'monthly']).default('normal'),
  timeRange: z.enum(['7', '14', '30']).default('7')
});

export type Task = z.infer<typeof taskSchema>;
export type Category = z.infer<typeof categorySchema>;
export type DayEntry = z.infer<typeof dayEntrySchema>;
export type Settings = z.infer<typeof settingsSchema>;

export const insertTaskSchema = createInsertSchema(tasks);
export const insertCategorySchema = createInsertSchema(categories);
export const insertDayEntrySchema = createInsertSchema(dayEntries);

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertDayEntry = z.infer<typeof insertDayEntrySchema>;