import { db } from './db';
import { 
  tasks, categories, dayEntries, pomodoroSessions,
  type Task, type Category, type DayEntry, type Settings, type PomodoroSession,
  settingsSchema, PomodoroPhase
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDayEntry(date: string): DayEntry | null;
  saveDayEntry(entry: DayEntry): void;
  removeDayEntry(date: string): void;
  getSettings(): Settings;
  saveSettings(settings: Settings): void;
  // New Pomodoro methods
  getPomodoroSessions(date: string): Promise<PomodoroSession[]>;
  savePomodoroSession(session: PomodoroSession): Promise<void>;
  updatePomodoroSession(id: number, session: Partial<PomodoroSession>): Promise<void>;
  deletePomodoroSession(id: number): Promise<void>;
  // Sync time data
  syncPomodoroTime(date: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
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

  async getDayEntry(date: string): DayEntry | null {
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
          type: cat.type,
          tasks: catTasks.map(t => ({
            id: t.id.toString(),
            name: t.name,
            type: t.type,
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

  // New Pomodoro methods
  async getPomodoroSessions(date: string): Promise<PomodoroSession[]> {
    const sessions = await db
      .select()
      .from(pomodoroSessions)
      .where(eq(pomodoroSessions.date, date))
      .orderBy(desc(pomodoroSessions.createdAt));

    return sessions.map(session => ({
      id: session.id,
      date: session.date,
      duration: session.duration,
      phase: session.phase as PomodoroPhase,
      taskType: session.taskType,
      createdAt: session.createdAt?.toISOString() || new Date().toISOString()
    }));
  }

  async savePomodoroSession(session: PomodoroSession): Promise<void> {
    await db.insert(pomodoroSessions).values({
      date: session.date,
      duration: session.duration,
      phase: session.phase,
      taskType: session.taskType
    });

    await this.syncPomodoroTime(session.date);
  }

  async updatePomodoroSession(id: number, session: Partial<PomodoroSession>): Promise<void> {
    await db
      .update(pomodoroSessions)
      .set({
        date: session.date,
        duration: session.duration,
        phase: session.phase,
        taskType: session.taskType
      })
      .where(eq(pomodoroSessions.id, id));

    if (session.date) {
      await this.syncPomodoroTime(session.date);
    }
  }

  async deletePomodoroSession(id: number): Promise<void> {
    const [session] = await db
      .select()
      .from(pomodoroSessions)
      .where(eq(pomodoroSessions.id, id));

    if (session) {
      await db
        .delete(pomodoroSessions)
        .where(eq(pomodoroSessions.id, id));

      await this.syncPomodoroTime(session.date);
    }
  }

  async syncPomodoroTime(date: string): Promise<void> {
    // Get all work sessions for the day
    const sessions = await db
      .select()
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.date, date),
          eq(pomodoroSessions.phase, PomodoroPhase.WORK)
        )
      );

    // Calculate total time for each task type
    const timeByTask = sessions.reduce((acc, session) => {
      acc[session.taskType] = (acc[session.taskType] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    // Get or create day entry
    let dayEntry = await this.getDayEntry(date);
    if (!dayEntry) {
      dayEntry = { date, categories: [] };
    }

    // Update time category tasks
    const timeCategory = dayEntry.categories.find(c => c.name === 'Время');
    if (timeCategory) {
      timeCategory.tasks = timeCategory.tasks.map(task => {
        let taskType = '';
        if (task.name === '💼 Работа') taskType = 'work';
        else if (task.name === '📚 Учёба') taskType = 'study';
        else if (task.name === '🎯 Проект') taskType = 'project';

        return {
          ...task,
          value: timeByTask[taskType] || 0
        };
      });

      await this.saveDayEntry(dayEntry);
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