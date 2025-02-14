import { db } from './db';
import { 
  tasks, categories, dayEntries, goals,
  type Task, type Category, type DayEntry, type Settings, type Goal, type InsertGoal,
  settingsSchema, CategoryType, TaskType
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface IStorage {
  getDayEntry(date: string): Promise<DayEntry | null>;
  saveDayEntry(entry: DayEntry): Promise<void>;
  removeDayEntry(date: string): Promise<void>;
  getSettings(): Settings;
  saveSettings(settings: Settings): void;
  // Goals methods
  getGoals(): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | null>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal>;
}

export class DatabaseStorage implements IStorage {
  async getDayEntry(date: string): Promise<DayEntry | null> {
    const [entry] = await db
      .select()
      .from(dayEntries)
      .where(eq(dayEntries.date, date));

    if (!entry) return null;

    const entryCats = await db
      .select()
      .from(categories)
      .where(eq(categories.dayEntryId, entry.id));

    const cats = await Promise.all(
      entryCats.map(async (cat) => {
        const catTasks = await db
          .select()
          .from(tasks)
          .where(eq(tasks.categoryId, cat.id));

        return {
          id: cat.id.toString(),
          name: cat.name,
          emoji: cat.emoji,
          type: cat.type as CategoryType,
          tasks: catTasks.map(t => ({
            id: t.id.toString(),
            name: t.name,
            type: t.type as TaskType,
            value: t.value || 0,
            textValue: t.textValue || '',
            completed: t.completed || false,
            createdAt: t.createdAt?.toISOString() || new Date().toISOString()
          }))
        };
      })
    );

    return {
      date,
      categories: cats
    };
  }

  async saveDayEntry(entry: DayEntry): Promise<void> {
    const [existingEntry] = await db
      .select()
      .from(dayEntries)
      .where(eq(dayEntries.date, entry.date));

    let dayEntryId: number;

    if (existingEntry) {
      dayEntryId = existingEntry.id;
    } else {
      const [newEntry] = await db
        .insert(dayEntries)
        .values({ date: entry.date })
        .returning();
      dayEntryId = newEntry.id;
    }

    // Handle categories
    for (const cat of entry.categories) {
      const [category] = await db
        .insert(categories)
        .values({
          name: cat.name,
          emoji: cat.emoji,
          type: cat.type,
          dayEntryId
        })
        .returning();

      // Handle tasks
      for (const task of cat.tasks) {
        await db
          .insert(tasks)
          .values({
            name: task.name,
            type: task.type,
            value: task.value || 0,
            textValue: task.textValue || '',
            completed: task.completed,
            categoryId: category.id
          });
      }
    }
  }

  async removeDayEntry(date: string): Promise<void> {
    const [entry] = await db
      .select()
      .from(dayEntries)
      .where(eq(dayEntries.date, date));

    if (entry) {
      const entryCats = await db
        .select()
        .from(categories)
        .where(eq(categories.dayEntryId, entry.id));

      // Delete tasks for each category
      for (const cat of entryCats) {
        await db
          .delete(tasks)
          .where(eq(tasks.categoryId, cat.id));
      }

      // Delete categories
      await db
        .delete(categories)
        .where(eq(categories.dayEntryId, entry.id));

      // Delete day entry
      await db
        .delete(dayEntries)
        .where(eq(dayEntries.id, entry.id));
    }
  }

  getSettings(): Settings {
    const stored = localStorage.getItem('day_success_tracker_settings');
    if (!stored) return settingsSchema.parse({});
    return settingsSchema.parse(JSON.parse(stored));
  }

  saveSettings(settings: Settings): void {
    localStorage.setItem('day_success_tracker_settings', JSON.stringify(settings));
  }

  async getGoals(): Promise<Goal[]> {
    const allGoals = await db.select().from(goals);
    return allGoals;
  }

  async getGoal(id: number): Promise<Goal | null> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || null;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals).values(goal).returning();
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal> {
    const [updatedGoal] = await db
      .update(goals)
      .set(goal)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }
}

export const storage = new DatabaseStorage();