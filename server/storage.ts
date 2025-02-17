import { db } from './db';
import { 
  tasks, categories, dayEntries, settings,
  type Task, type Category, type DayEntry, type Settings,
  settingsSchema, type InsertSettings
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface IStorage {
  getDayEntry(date: string): Promise<DayEntry | null>;
  saveDayEntry(entry: DayEntry): Promise<void>;
  removeDayEntry(date: string): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  clearData(): Promise<void>;
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
          type: cat.type,
          tasks: catTasks.map(t => ({
            id: t.id.toString(),
            name: t.name,
            type: t.type,
            value: t.value || 0,
            textValue: t.textValue || '',
            completed: t.completed,
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

      // Delete existing categories and tasks
      const entryCats = await db
        .select()
        .from(categories)
        .where(eq(categories.dayEntryId, dayEntryId));

      for (const cat of entryCats) {
        await db.delete(tasks).where(eq(tasks.categoryId, cat.id));
      }
      await db.delete(categories).where(eq(categories.dayEntryId, dayEntryId));
    } else {
      const [newEntry] = await db
        .insert(dayEntries)
        .values({ date: entry.date })
        .returning();
      dayEntryId = newEntry.id;
    }

    // Insert new categories and tasks
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

      for (const cat of entryCats) {
        await db.delete(tasks).where(eq(tasks.categoryId, cat.id));
      }
      await db.delete(categories).where(eq(categories.dayEntryId, entry.id));
      await db.delete(dayEntries).where(eq(dayEntries.id, entry.id));
    }
  }

  async getSettings(): Promise<Settings> {
    const [dbSettings] = await db.select().from(settings);
    if (!dbSettings) {
      // Создаем настройки по умолчанию с помощью схемы
      const defaultSettings = settingsSchema.parse({
        colors: {
          mind: '--purple',
          time: '--green',
          sport: '--blue',
          habits: '--red',
          expenses: '--orange',
          daySuccess: '--emerald'
        },
        subcategories: {
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
            { id: 'food', name: 'Еда', emoji: '🍽️' },
            { id: 'transport', name: 'Транспорт', emoji: '🚌' },
            { id: 'entertainment', name: 'Развлечения', emoji: '🎮' }
          ],
          daySuccess: [
            { id: 'achievement', name: 'Достижение', emoji: '🏆' }
          ]
        },
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        calorieTarget: 2000,
        timeTarget: 480,
        viewMode: 'normal',
        timeRange: '7',
        darkMode: true
      });
      const [newSettings] = await db.insert(settings).values(defaultSettings).returning();
      return settingsSchema.parse(newSettings);
    }
    return settingsSchema.parse(dbSettings);
  }

  async saveSettings(newSettings: Settings): Promise<void> {
    const [existingSettings] = await db.select().from(settings);
    if (existingSettings) {
      await db.update(settings)
        .set(newSettings)
        .where(eq(settings.id, existingSettings.id));
    } else {
      await db.insert(settings).values(newSettings);
    }
  }

  async clearData(): Promise<void> {
    // Delete all data in reverse order of dependencies
    await db.delete(tasks);
    await db.delete(categories);
    await db.delete(dayEntries);
    await db.delete(settings);
  }
}

export const storage = new DatabaseStorage();