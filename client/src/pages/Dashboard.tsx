import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { storage } from '@/lib/storage';
import { DayEntry, CategoryType, TaskType, Settings as SettingsType, settingsSchema } from '@shared/schema';
import { format } from 'date-fns';
import {
  CalendarIcon, Save, RotateCcw, Brain, Clock, ActivitySquare,
  Zap, DollarSign, Activity, Calendar as CalendarIcon2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TaskCard } from '@/components/TaskCard';
import DayScore from '@/components/DayScore';
import { calculateDayScore } from '@/lib/utils';
import HistoryGrid from '@/components/HistoryGrid';
import { Progress } from "@/components/ui/progress";
import { Link } from 'wouter';
import { ExportImport } from '@/components/ExportImport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayEntry, setDayEntry] = useState<DayEntry | null>(null);
  const [historyDays, setHistoryDays] = useState<DayEntry[]>([]);
  const [groupingMode, setGroupingMode] = useState<'normal' | 'weekly' | 'monthly'>(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return 'normal';
      const settings = settingsSchema.parse(JSON.parse(stored));
      return settings.viewMode;
    } catch (error) {
      console.error('Error parsing settings:', error);
      return 'normal';
    }
  });
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsType>(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return settingsSchema.parse({});
      return settingsSchema.parse(JSON.parse(stored));
    } catch (error) {
      console.error('Error parsing settings:', error);
      return settingsSchema.parse({});
    }
  });
  const [version, setVersion] = useState<number>(Date.now());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'day_success_tracker_settings') {
        try {
          const newSettings = e.newValue ? JSON.parse(e.newValue) : {};
          setSettings(settingsSchema.parse(newSettings));
          setVersion(Date.now());
        } catch (error) {
          console.error('Error parsing settings from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const entry = storage.getDayEntry(dateStr);

    if (entry) {
      setDayEntry(entry);
      return;
    }

    // Get expense categories from settings
    const expenseCategories = settings?.subcategories?.expenses || [];

    const newEntry: DayEntry = {
      date: dateStr,
      categories: [
        {
          id: 'mind',
          name: 'Разум',
          emoji: '🧠',
          type: CategoryType.CHECKBOX,
          tasks: [
            {
              id: 'breathing',
              name: '🫁 Дыхание',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'tea',
              name: '🍵 Чай',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'cleaning',
              name: '🧹 Уборка',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'time',
          name: 'Время',
          emoji: '⏱️',
          type: CategoryType.TIME,
          tasks: [
            {
              id: 'work',
              name: '💼 Работа',
              type: TaskType.TIME,
              value: 0,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'study',
              name: '📚 Учёба',
              type: TaskType.TIME,
              value: 0,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'project',
              name: '🎯 Проект',
              type: TaskType.TIME,
              value: 0,
              completed: false,
              createdAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'sport',
          name: 'Спорт',
          emoji: '🏃‍♂️',
          type: CategoryType.CALORIE,
          tasks: [
            {
              id: 'pills',
              name: '💊 Таблетки',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'training',
              name: '🏋️‍♂️ Тренировка',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'calories',
              name: '🔥 Калории',
              type: TaskType.CALORIE,
              value: 0,
              completed: false,
              createdAt: new Date().toISOString()
            }
          ]
        },
        {
          id: 'habits',
          name: 'Привычки',
          emoji: '🚫',
          type: CategoryType.CHECKBOX,
          tasks: [
            {
              id: 'no_junk_food',
              name: '🍔 Дерьмо',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'no_money_waste',
              name: '💸 Траты',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            },
            {
              id: 'no_adult',
              name: '🔞 Порно',
              type: TaskType.CHECKBOX,
              completed: false,
              createdAt: new Date().toISOString()
            }
          ]
        },
        // Generate expense categories from settings
        ...expenseCategories.map((category, index) => ({
          id: `exp${index + 1}`,
          name: category.name, // Используем полное имя с эмодзи
          emoji: category.emoji,
          type: CategoryType.EXPENSE,
          tasks: [
            {
              id: `${category.id}_expense`,
              name: category.name, // Используем полное имя с эмодзи
              type: TaskType.EXPENSE,
              value: 0,
              completed: false,
              createdAt: new Date().toISOString()
            }
          ]
        })),

        // Add expense note category at the end
        {
          id: 'exp8',
          name: 'Отчет',
          emoji: '✏️',
          type: CategoryType.EXPENSE,
          tasks: [
            {
              id: 'description',
              name: 'Отчет',
              type: TaskType.EXPENSE_NOTE,
              textValue: '',
              value: 0,
              completed: false,
              createdAt: new Date().toISOString()
            }
          ]
        }
      ]
    };
    setDayEntry(newEntry);
  }, [selectedDate, settings, version]);

  useEffect(() => {
    const days: DayEntry[] = [];
    let currentDate = new Date(settings.startDate);
    const endDate = new Date(settings.endDate);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const entry = storage.getDayEntry(dateStr);
      const dayEntry = entry || {
        date: dateStr,
        categories: []
      };
      days.push(dayEntry);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setHistoryDays(days);
  }, [settings.startDate, settings.endDate, version]);

  const calculateDaysProgress = () => {
    const startDate = new Date(settings.startDate);
    const endDate = new Date(settings.endDate);
    const currentDate = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress = (daysPassed / totalDays) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const handleTaskUpdate = (categoryId: string, taskId: string, value: number | boolean | string) => {
    if (!dayEntry) return;
    const updated = {
      ...dayEntry,
      categories: dayEntry.categories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              tasks: category.tasks.map(task =>
                task.id === taskId
                  ? task.type === TaskType.EXPENSE_NOTE
                    ? { ...task, textValue: value as string, value: 0 }
                    : { ...task, completed: typeof value === 'boolean' ? value : task.completed, value: typeof value === 'number' ? value : task.value }
                  : task
              )
            }
          : category
      )
    };
    setDayEntry(updated);
  };

  const calculateTotalExpenses = () => {
    if (!dayEntry) return 0;
    return dayEntry.categories
      .filter(category => category.type === CategoryType.EXPENSE)
      .reduce((total, category) => {
        return total + category.tasks.reduce((categoryTotal, task) =>
          categoryTotal + (typeof task.value === 'number' ? task.value : 0), 0);
      }, 0);
  };

  const dayScore = dayEntry ? calculateDayScore(dayEntry.categories) : 0;

  const handleDayClick = (date: string) => {
    setSelectedDate(new Date(date));
  };

  const handleSave = () => {
    if (dayEntry) {
      const updatedEntry = {
        ...dayEntry,
        categories: dayEntry.categories.map(category => ({
          ...category,
          tasks: category.tasks.map(task => {
            if (task.type === TaskType.CHECKBOX) {
              return { ...task, completed: task.completed || false };
            } else if (task.type === TaskType.EXPENSE_NOTE) {
              return { ...task, value: 0, textValue: task.textValue || '' };
            } else {
              return { ...task, value: task.value || 0 };
            }
          })
        }))
      };

      storage.saveDayEntry(updatedEntry);
      setVersion(Date.now());
      toast({
        title: "Сохранено",
        description: "Данные успешно сохранены",
      });
    }
  };

  const handleReset = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    storage.removeDayEntry(dateStr);
    setVersion(Date.now());
    toast({
      title: "Сброшено",
      description: "Данные за день удалены",
    });
  };

  const handleGroupingModeChange = (value: 'normal' | 'weekly' | 'monthly') => {
    setGroupingMode(value);
    const updatedSettings = { ...settings, viewMode: value };
    setSettings(updatedSettings);
    localStorage.setItem('day_success_tracker_settings', JSON.stringify(updatedSettings));
  };

  if (!dayEntry) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800/40 py-2 sm:py-4">
          <div className="flex items-center w-full sm:w-auto justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <h2 className="text-sm sm:text-xl font-semibold">Трекер</h2>
              <DayScore score={dayScore} showAnimation={true} />
            </div>
            <div className="flex items-center sm:hidden space-x-2">
              <span className="text-xs text-gray-400">
                {format(selectedDate, 'dd.MM')}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {format(selectedDate, 'dd.MM.yyyy')}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-300 p-1"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4">
          {dayEntry.categories.slice(0, 4).map((category) => (
            <TaskCard
              key={category.id}
              category={category}
              onTaskUpdate={(taskId, value) => handleTaskUpdate(category.id, taskId, value)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Расходы <span className="text-xl font-medium ml-2">{calculateTotalExpenses()} zł</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 xl:grid-cols-8 gap-4">
          {dayEntry.categories.slice(4).map((category, index) => (
            <TaskCard
              key={category.id}
              category={category}
              onTaskUpdate={(taskId, value) => handleTaskUpdate(category.id, taskId, value)}
              isExpenseCard={true}
              expenseIndex={index}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mt-8 mb-4">
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-bold">ДНИ</h2>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <Button
                  onClick={handleSave}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/20"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Сохранить</span>
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none border-destructive text-destructive hover:bg-destructive/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="text-sm sm:text-base">Сбросить</span>
                </Button>
                <Select value={groupingMode} onValueChange={handleGroupingModeChange}>
                  <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px] text-sm sm:text-base">
                    <SelectValue placeholder="Группировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      <span className="text-sm sm:text-base">Обычная</span>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <span className="text-sm sm:text-base">По Неделям</span>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <span className="text-sm sm:text-base">По Месяцам</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs sm:text-sm text-gray-400 sm:ml-auto">
                {(() => {
                  const startDate = new Date(settings.startDate);
                  const endDate = new Date(settings.endDate);
                  const currentDate = new Date();

                  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const daysPassed = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const adjustedDaysPassed = Math.max(0, Math.min(daysPassed, totalDays));
                  const progress = Math.round((adjustedDaysPassed / totalDays) * 100);

                  return `${adjustedDaysPassed} из ${totalDays} дней (${progress}%)`;
                })()}
              </span>
            </div>
            <div className="w-full">
              <Progress
                value={calculateDaysProgress()}
                className="h-2 bg-gray-800"
              />
            </div>
          </div>
        </div>

        <HistoryGrid
          days={historyDays}
          onDayClick={handleDayClick}
          startDate={settings.startDate}
          endDate={settings.endDate}
          selectedDate={selectedDate}
          groupingMode={groupingMode}
        />
      </div>
    </div>
  );
}