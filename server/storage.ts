import { db } from './db';
import { 
  tasks, categories, dayEntries,
  type Task, type Category, type DayEntry, type Settings,
  settingsSchema
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface IStorage {
  getTasks(): Task[];
  saveTasks(tasks: Task[]): void;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDayEntry(date: string): Promise<DayEntry | null>;
  saveDayEntry(entry: DayEntry): Promise<void>;
  removeDayEntry(date: string): Promise<void>;
  getSettings(): Settings;
  saveSettings(settings: Settings): void;
}

export class DatabaseStorage implements IStorage {
  getTasks(): Task[] {
    const stored = localStorage.getItem('day_success_tracker_tasks');
    if (!stored) return [];
    return JSON.parse(stored);
  }

  saveTasks(tasks: Task[]): void {
    localStorage.setItem('day_success_tracker_tasks', JSON.stringify(tasks));
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

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

        // Get task names and emojis from local storage
        const storedTasks = this.getTasks();
        const categoryTasks = storedTasks.find(c => c.name === cat.name)?.tasks || [];

        return {
          id: cat.id.toString(),
          name: cat.name,
          emoji: cat.emoji,
          type: cat.type,
          tasks: catTasks.map(t => {
            const storedTask = categoryTasks.find(st => st.id === t.id);
            return {
              id: t.id.toString(),
              name: storedTask?.name || t.name,
              emoji: storedTask?.emoji || "📝",
              type: t.type,
              value: t.value || 0,
              textValue: t.textValue || '',
              completed: t.completed,
              createdAt: t.createdAt?.toISOString() || new Date().toISOString()
            };
          })
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
}

export const storage = new DatabaseStorage();