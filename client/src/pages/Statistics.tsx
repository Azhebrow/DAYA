import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage } from '@/lib/storage';
import { DayEntry, CategoryType, TaskType, settingsSchema, Settings as SettingsType } from '@shared/schema';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, startOfMonth, endOfMonth, addDays, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { calculateDayScore } from '@/lib/utils';
import { ActivitySquare, Flame, Clock, LineChart, DollarSign, BarChart as BarChartIcon, FileText } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const CATEGORY_COLORS: { [key: string]: string } = {
  'Разум': '#8B5CF6',    // Фиолетовый
  'Время': '#10B981',    // Зеленый
  'Спорт': '#EF4444',    // Красный
  'Привычки': '#F59E0B'  // Оранжевый
};

const CATEGORY_HEADER_COLORS: { [key: string]: { bg: string; text: string } } = {
  'Разум': { bg: '#8B5CF620', text: '#ffffff' },
  'Время': { bg: '#10B98120', text: '#ffffff' },
  'Спорт': { bg: '#EF444420', text: '#ffffff' },
  'Привычки': { bg: '#F59E0B20', text: '#ffffff' }
};

const CATEGORY_ORDER = ['Разум', 'Привычки', 'Спорт', 'Время'];

const getSuccessColor = (value: number, maxValue: number) => {
  if (maxValue === 0) return 'transparent';
  const normalizedValue = value / maxValue;
  const opacity = 0.1 + (normalizedValue * 0.4);
  return `rgba(16, 185, 129, ${opacity})`;
};

const getExpenseColor = (value: number, maxValue: number) => {
  if (maxValue === 0) return 'rgba(249, 115, 22, 0.1)';
  const normalizedValue = value / maxValue;
  const opacity = 0.1 + (normalizedValue * 0.4);
  return `rgba(249, 115, 22, ${opacity})`;
};

type TimeRangeType = '7' | '14' | '30';
type PeriodType = 'daily' | 'monthly' | 'decades';


export default function Statistics() {
  const [timeRange, setTimeRange] = useState<TimeRangeType>(() => {
    try {
      const stored = localStorage.getItem('day_success_tracker_settings');
      if (!stored) return '7';
      const settings = settingsSchema.parse(JSON.parse(stored));
      return settings.timeRange;
    } catch (error) {
      console.error('Error parsing settings:', error);
      return '7';
    }
  });
  const [data, setData] = useState<DayEntry[]>([]);
  const [dateRangeText, setDateRangeText] = useState('');
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


  useEffect(() => {
    const endDate = startOfDay(new Date());
    let startDate = endDate;

    const daysToSubtract = parseInt(timeRange);
    startDate = subDays(endDate, daysToSubtract - 1);

    setDateRangeText(`${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')}`);

    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    const days: DayEntry[] = [];

    dateRange.forEach(date => {
      const entry = storage.getDayEntry(format(date, 'yyyy-MM-dd'));
      if (entry) {
        days.push(entry);
      }
    });

    setData(days);
  }, [timeRange]);

  const aggregateDataByPeriod = (periodType: PeriodType) => {
    if (!data.length) return [];

    if (periodType === 'daily') {
      return data.map(day => {
        let totalTime = 0;
        let calories = 0;
        let dailyExpenses = 0;

        day.categories.forEach(category => {
          category.tasks.forEach(task => {
            if (task.type === TaskType.TIME && typeof task.value === 'number') {
              totalTime += Math.round(task.value / 60); // Convert minutes to hours
            }
            if (task.type === TaskType.CALORIE && typeof task.value === 'number') {
              calories += task.value;
            }
            if (task.type === TaskType.EXPENSE && typeof task.value === 'number') {
              dailyExpenses += task.value;
            }
          });
        });

        return {
          date: format(new Date(day.date), 'dd.MM'),
          totalTime,
          calories,
          expenses: dailyExpenses
        };
      });
    }

    const periods: { [key: string]: DayEntry[] } = {};

    if (periodType === 'monthly') {
      data.forEach(day => {
        const monthKey = format(new Date(day.date), 'MMM yyyy');
        if (!periods[monthKey]) {
          periods[monthKey] = [];
        }
        periods[monthKey].push(day);
      });
    } else {
      const startDate = new Date(data[0].date);
      let currentDecadeStart = startDate;

      data.forEach(day => {
        const dayDate = new Date(day.date);
        if (dayDate >= addDays(currentDecadeStart, 10)) {
          currentDecadeStart = dayDate;
        }

        const decadeKey = `${format(currentDecadeStart, 'dd.MM')}-${format(addDays(currentDecadeStart, 9), 'dd.MM')}`;
        if (!periods[decadeKey]) {
          periods[decadeKey] = [];
        }
        periods[decadeKey].push(day);
      });
    }

    return Object.entries(periods).map(([periodKey, days]) => {
      let totalTime = 0;
      let calories = 0;
      let expenses = 0;
      let daysWithData = 0;
      let daysWithCalories = 0;

      days.forEach(day => {
        let hasDataThisDay = false;
        day.categories.forEach(category => {
          category.tasks.forEach(task => {
            if (task.type === TaskType.TIME && typeof task.value === 'number') {
              totalTime += Math.round(task.value / 60); //Convert minutes to hours
              hasDataThisDay = true;
            }
            if (task.type === TaskType.CALORIE && typeof task.value === 'number' && task.value > 0) {
              calories += task.value;
              daysWithCalories++;
            }
            if (task.type === TaskType.EXPENSE && typeof task.value === 'number') {
              expenses += task.value;
              hasDataThisDay = true;
            }
          });
        });
        if (hasDataThisDay) daysWithData++;
      });

      return {
        date: periodKey,
        totalTime: daysWithData > 0 ? Math.round(totalTime / daysWithData) : 0,
        calories: daysWithCalories > 0 ? Math.round(calories / daysWithCalories) : 0,
        expenses: daysWithData > 0 ? Math.round(expenses / daysWithData) : 0
      };
    });
  };

  const calculateTaskSuccessByPeriod = () => {
    const periodType = timeRange === 'monthly' ? 'monthly' : timeRange === 'decades' ? 'decades' : 'daily';
    const periods = aggregateDataByPeriod(periodType);

    const taskData: {
      categoryName: string;
      categoryColor: string;
      taskName: string;
      type: TaskType;
      periods: { period: string; value: number }[];
    }[] = [];

    data[0]?.categories.slice(0, 4).forEach(category => {
      category.tasks.forEach(task => {
        taskData.push({
          categoryName: category.name,
          categoryColor: CATEGORY_COLORS[category.name] || '#8884d8',
          taskName: task.name,
          type: task.type,
          periods: []
        });
      });
    });

    periods.forEach(period => {
      const daysInPeriod = data.filter(day => {
        const dayDate = new Date(day.date);
        if (periodType === 'monthly') {
          return format(dayDate, 'MMM yyyy') === period.date;
        } else if (periodType === 'decades') {
          const [startStr] = period.date.split('-');
          const periodStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), parseInt(startStr));
          return dayDate >= periodStart && dayDate < addDays(periodStart, 10);
        }
        return format(dayDate, 'dd.MM') === period.date;
      });

      taskData.forEach(taskItem => {
        let total = 0;
        let completed = 0;
        let timeSum = 0;
        let calorieSum = 0;
        let daysWithCalories = 0;

        daysInPeriod.forEach(day => {
          const category = day.categories.find(c => c.name === taskItem.categoryName);
          if (category) {
            const task = category.tasks.find(t => t.name === taskItem.taskName);
            if (task) {
              if (task.type === TaskType.CHECKBOX) {
                total++;
                if (task.completed) completed++;
              } else if (task.type === TaskType.TIME && typeof task.value === 'number') {
                timeSum += task.value;
              } else if (task.type === TaskType.CALORIE && typeof task.value === 'number') {
                if (task.value > 0) {
                  calorieSum += task.value;
                  daysWithCalories++;
                }
              }
            }
          }
        });

        let value = 0;
        if (taskItem.type === TaskType.CHECKBOX) {
          value = total > 0 ? Math.round((completed / total) * 100) : 0;
        } else if (taskItem.type === TaskType.TIME) {
          value = timeSum;
        } else if (taskItem.type === TaskType.CALORIE) {
          value = daysWithCalories > 0 ? Math.round(calorieSum / daysWithCalories) : 0;
        }

        taskItem.periods.push({
          period: period.date,
          value
        });
      });
    });

    return taskData;
  };

  const calculateTimeDistribution = () => {
    const timeByActivity: { [key: string]: number } = {};
    let totalMinutes = 0;

    data.forEach(day => {
      day.categories.forEach(category => {
        if (category.type === CategoryType.TIME) {
          category.tasks.forEach(task => {
            if (typeof task.value === 'number' && task.value > 0) {
              if (!timeByActivity[task.name]) {
                timeByActivity[task.name] = 0;
              }
              timeByActivity[task.name] += task.value;
              totalMinutes += task.value;
            }
          });
        }
      });
    });

    const distribution = Object.entries(timeByActivity)
      .map(([name, total]) => ({
        name,
        minutes: total
      }))
      .sort((a, b) => b.minutes - a.minutes);

    return { distribution, totalMinutes };
  };

  const calculateExpenseDistribution = () => {
    const expensesByCategory: { [key: string]: { amount: number; emoji: string } } = {};
    let totalExpenses = 0;

    data.forEach(day => {
      day.categories.forEach(category => {
        category.tasks.forEach(task => {
          if (task.type === TaskType.EXPENSE && typeof task.value === 'number' && task.value > 0) {
            if (!expensesByCategory[category.name]) {
              expensesByCategory[category.name] = { amount: 0, emoji: category.emoji };
            }
            expensesByCategory[category.name].amount += task.value;
            totalExpenses += task.value;
          }
        });
      });
    });

    const distribution = Object.entries(expensesByCategory)
      .map(([name, { amount, emoji }]) => ({
        name: `${emoji} ${name}`,
        amount,
        color: CATEGORY_COLORS[name] || '#6B7280'
      }))
      .sort((a, b) => b.amount - a.amount);

    return { distribution, totalExpenses };
  };

  const calculateExpensesByPeriod = () => {
    const periodType = timeRange === '30' ? 'monthly' : timeRange === '14' ? 'decades' : 'daily';

    // Соберем все задачи с типом EXPENSE из всех категорий
    const expenseData = data.reduce((acc, day) => {
      day.categories.forEach(category => {
        category.tasks.forEach(task => {
          if (task.type === TaskType.EXPENSE) {
            const formattedDate = format(new Date(day.date), 'dd.MM');

            const existingCategory = acc.find(c => c.categoryName === category.name);
            if (!existingCategory) {
              acc.push({
                categoryName: category.name,
                periods: [{
                  period: formattedDate,
                  value: task.value || 0
                }]
              });
            } else {
              const existingPeriod = existingCategory.periods.find(p => p.period === formattedDate);
              if (existingPeriod) {
                existingPeriod.value += task.value || 0;
              } else {
                existingCategory.periods.push({
                  period: formattedDate,
                  value: task.value || 0
                });
              }
            }
          }
        });
      });
      return acc;
    }, [] as { categoryName: string; periods: { period: string; value: number }[] }[]);

    // Заполним нулями пропущенные периоды и отсортируем
    const allPeriods = data.map(day => format(new Date(day.date), 'dd.MM'))
      .sort((a, b) => {
        const [dayA, monthA] = a.split('.');
        const [dayB, monthB] = b.split('.');
        const dateA = new Date(2000, parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(2000, parseInt(monthB) - 1, parseInt(dayB));
        return dateA.getTime() - dateB.getTime();
      });

    expenseData.forEach(category => {
      allPeriods.forEach(period => {
        if (!category.periods.find(p => p.period === period)) {
          category.periods.push({ period, value: 0 });
        }
      });

      // Сортируем периоды по дате
      category.periods.sort((a, b) => {
        const [dayA, monthA] = a.period.split('.');
        const [dayB, monthB] = b.period.split('.');
        const dateA = new Date(2000, parseInt(monthA) - 1, parseInt(dayA));
        const dateB = new Date(2000, parseInt(monthB) - 1, parseInt(dayB));
        return dateA.getTime() - dateB.getTime();
      });
    });

    return {
      categories: expenseData,
      periods: allPeriods
    };
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate <= 50) {
      // More vibrant Red (0%) to Yellow (50%)
      const g = Math.floor((rate / 50) * 255);
      return `rgba(255, ${g}, 0, 0.5)`;
    } else {
      // More vibrant Yellow (50%) to Green (100%)
      const r = Math.floor(((100 - rate) / 50) * 255);
      return `rgba(${r}, 255, 0, 0.5)`;
    }
  };

  const periodType = timeRange === 'monthly' ? 'monthly' : timeRange === 'decades' ? 'decades' : 'daily';
  const dailyStats = aggregateDataByPeriod(periodType);
  const timeDistribution = calculateTimeDistribution();
  const expenseDistribution = calculateExpenseDistribution();
  const taskSuccess = calculateTaskSuccessByPeriod();
  const expenseTableData = calculateExpensesByPeriod();

  const tasksByCategory = taskSuccess.reduce((acc, task) => {
    if (!acc[task.categoryName]) {
      acc[task.categoryName] = {
        // Use green only for 'Время', gray for everything else
        color: task.categoryName === 'Время' ? CATEGORY_COLORS['Время'] : '#6B7280',
        tasks: []
      };
    }
    acc[task.categoryName].tasks.push(task);
    return acc;
  }, {} as { [key: string]: { color: string; tasks: typeof taskSuccess } });

  const sortedCategories = CATEGORY_ORDER.map(categoryName => {
    const category = tasksByCategory[categoryName];
    if (!category) return null;

    const timeTasks = category.tasks.filter(t => t.type === TaskType.TIME);
    const nonTimeTasks = category.tasks.filter(t => t.type !== TaskType.TIME);

    return {
      name: categoryName,
      color: category.color,
      tasks: nonTimeTasks,
      timeTasks
    };
  }).filter(Boolean);

  const allTimeTasks = sortedCategories
    .flatMap(category => category?.timeTasks || [])
    .filter(Boolean);


  const periods = taskSuccess[0]?.periods.map(p => p.period) || [];

  const formatTimeTotal = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  };

  const calculateDayScoreFromHistory = (day: DayEntry) => {
    // Return null only if there's no entry in database
    if (!day.categories) return 0;

    let score = 0;
    let total = 0;

    day.categories.slice(0, 4).forEach(category => {
      if (!category.tasks) return;

      category.tasks.forEach(task => {
        if (task.type === TaskType.CHECKBOX) {
          total += 1;
          if (task.completed) score += 1;
        } else if (task.type === TaskType.TIME || task.type === TaskType.CALORIE) {
          total += 1;
          if (typeof task.value === 'number' && task.value > 0) score += 1;
        }
      });
    });

    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const handleTimeRangeChange = (value: TimeRangeType) => {
    setTimeRange(value);
    const updatedSettings = { ...settings, timeRange: value };
    setSettings(updatedSettings);
    localStorage.setItem('day_success_tracker_settings', JSON.stringify(updatedSettings));
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Статистика</h1>
          <p className="text-sm text-muted-foreground">{dateRangeText}</p>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 дней</SelectItem>
            <SelectItem value="14">14 дней</SelectItem>
            <SelectItem value="30">30 дней</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-category-mind" />
              Показатель успеха по {periodType === 'monthly' ? 'месяцам' : periodType === 'decades' ? 'декадам' : 'дням'}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.map(day => ({
                date: format(new Date(day.date), 'dd.MM'),
                score: calculateDayScoreFromHistory(day)
              }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6B7280"
                  fill="#6B7280"
                  name="Успех"
                  dot={{ r: 4 }}
                  label={{ position: 'top', fill: '#6B7280' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-category-sport" />
              Калории по {periodType === 'monthly' ? 'месяцам' : periodType === 'decades' ? 'декадам' : 'дням'}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="#EF4444"
                  fill="#EF4444"
                  name="Калории"
                  dot={{ r: 4 }}
                  label={{ position: 'top', fill: '#EF4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-category-time" />
              Время по {periodType === 'monthly' ? 'месяцам' : periodType === 'decades' ? 'декадам' : 'дням'}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }} />
                <Area
                  type="monotone"
                  dataKey="totalTime"
                  stroke={CATEGORY_COLORS['Время']}
                  fill={CATEGORY_COLORS['Время']}
                  name="Часы"
                  dot={{ r: 4 }}
                  label={{ position: 'top', fill: CATEGORY_COLORS['Время'] }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-category-expenses" />
            Расходы по {periodType === 'monthly' ? 'месяцам' : periodType === 'decades' ? 'декадам' : 'дням'}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                itemStyle={{ color: '#ffffff' }}
                labelStyle={{ color: '#ffffff' }} />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke={CATEGORY_COLORS['Расходы']}
                fill={CATEGORY_COLORS['Расходы']}
                name="Расходы"
                dot={{ r: 4 }}
                label={{ position: 'top', fill: CATEGORY_COLORS['Расходы'] }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Распределение времени: {formatTimeTotal(timeDistribution.totalMinutes)}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeDistribution.distribution.map(entry => ({
                    ...entry,
                    minutes: Math.round(entry.minutes / 60)
                  }))}
                  dataKey="minutes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${Math.round(entry.minutes)}ч`}
                >
                  {timeDistribution.distribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value) => `${Math.round(Number(value))}ч`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Распределение расходов: {expenseDistribution.totalExpenses}zł
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseDistribution.distribution}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${entry.amount}zł`}
                >
                  {expenseDistribution.distribution.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(value) => `${value}zł`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5 text-primary" />
            Успешность задач по {periodType === 'monthly' ? 'месяцам' : periodType === 'decades' ? 'декадам' : 'дням'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left">Период</th>
                  <th className="py-2 px-4 text-center">Успех</th>
                  {sortedCategories.map(category => (
                    <th
                      key={category.name}
                      colSpan={category.tasks.length + (category.name === 'Время' ? category.timeTasks.length : 0)}
                      className="py-2 px-4 text-center text-white"
                      style={{
                        backgroundColor: CATEGORY_HEADER_COLORS[category.name]?.bg || '#6B728020'
                      }}
                    >
                      {category.name}
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4"></th>
                  <th className="py-2 px-4"></th>
                  {sortedCategories.flatMap(category => [
                    ...category.tasks.map(task => (
                      <th
                        key={task.taskName}
                        className="py-2 px-4 text-center text-sm font-medium text-white"
                        style={{
                          backgroundColor: CATEGORY_HEADER_COLORS[category.name]?.bg || '#6B728020'
                        }}
                      >
                        {task.taskName}
                      </th>
                    )),
                    ...(category.name === 'Время' ? category.timeTasks.map(task => (
                      <th
                        key={task.taskName}
                        className="py-2 px-4 text-center text-sm font-medium text-white"
                        style={{
                          backgroundColor: CATEGORY_HEADER_COLORS[category.name]?.bg || '#6B728020'
                        }}
                      >
                        {task.taskName}
                      </th>
                    )) : [])
                  ])}
                </tr>
              </thead>
              <tbody>
                {periods.map((period, idx) => {
                  const dayData = data.find(day => format(new Date(day.date), 'dd.MM') === period);
                  const successRate = dayData ? calculateDayScoreFromHistory(dayData) : 0;

                  const maxSuccessScore = Math.max(
                    ...taskSuccess.map(item => Math.max(...item.periods.map(p => p.value)))
                  );

                  return (
                    <tr key={period} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="py-2 px-4 font-medium">{period}</td>
                      <td
                        className="py-2 px-4 text-center"
                        style={{ backgroundColor: getSuccessColor(successRate, maxSuccessScore) }}
                      >
                        {successRate}%
                      </td>
                      {sortedCategories.flatMap(category =>
                        category.tasks.map(task => {
                          const value = task.periods[idx]?.value || 0;
                          return (
                            <td
                              key={`${task.taskName}-${period}`}
                              className="py-2 px-4 text-center"
                              style={{
                                backgroundColor: task.type === TaskType.CHECKBOX                                  ? getSuccessColor(value, 100)
                                  : '#6B728020'  // Серый цвет для всех не-checkbox значений
                              }}
                            >
                              {task.type === TaskType.CHECKBOX ? `${value}%` :
                                task.type === TaskType.CALORIE ? value : formatTimeTotal(value)}
                            </td>
                          );
                        })
                      )}
                      {sortedCategories.filter(c => c.name === 'Время').flatMap(category =>
                        category.timeTasks.map(task => {
                          const value = task.periods[idx]?.value || 0;
                          return (
                            <td
                              key={`${task.taskName}-${period}`}
                              className="py-2 px-4 text-center"
                              style={{ backgroundColor: '#6B728020' }}
                            >
                              {formatTimeTotal(value)}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border font-bold">
                  <td className="py-2 px-4">Итого</td>
                  <td className="py-2 px-4 text-center">
                    {(() => {
                      const totalScore = Math.round(
                        data.reduce((total, day) => total + calculateDayScoreFromHistory(day), 0) / data.length
                      );
                      return (
                        <div
                          style={{ backgroundColor: 'transparent' }}
                          className="px-2 py-1 rounded"
                        >
                          {totalScore}%
                        </div>
                      );
                    })()}
                  </td>
                  {sortedCategories.flatMap(category =>
                    category.tasks.map(task => {
                      const values = task.periods.map(p => p.value || 0);
                      let totalValue = 0;

                      if (task.type === TaskType.CHECKBOX) {
                        totalValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
                      } else {
                        totalValue = values.reduce((a, b) => a + b, 0);
                      }

                      return (
                        <td
                          key={`total-${task.taskName}`}
                          className="py-2 px-4 text-center"
                          style={{ backgroundColor: '#6B728020' }}
                        >
                          {task.type === TaskType.CHECKBOX ? `${totalValue}%` :
                            task.type === TaskType.CALORIE ? totalValue : formatTimeTotal(totalValue)}
                        </td>
                      );
                    })
                  )}
                  {sortedCategories.filter(c => c.name === 'Время').flatMap(category =>
                    category.timeTasks.map(task => {
                      const totalValue = task.periods.reduce((sum, period) => sum + (period.value || 0), 0);
                      return (
                        <td
                          key={`total-${task.taskName}`}
                          className="py-2 px-4 text-center"
                          style={{ backgroundColor: '#6B728020' }}
                        >
                          {formatTimeTotal(totalValue)}
                        </td>
                      );
                    })
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Расходы по категориям
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left">Период</th>
                  <th className="py-2 px-4 text-center font-bold">Итого</th>
                  {expenseTableData.categories.map(category => {
                    const matchingCategory = data.find(day =>
                      day.categories.find(c => c.name === category.categoryName)
                    )?.categories.find(c => c.name === category.categoryName);

                    return (
                      <th
                        key={category.categoryName}
                        className="py-2 px-4 text-center"
                        style={{ backgroundColor: `${CATEGORY_COLORS[category.categoryName] || '#6B7280'}20` }}
                      >
                        {matchingCategory?.emoji || '📝'} {category.categoryName}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {expenseTableData.periods.map((period, idx) => {
                  const rowTotal = expenseTableData.categories.reduce((sum, category) => {
                    const periodData = category.periods.find(p => p.period === period);
                    return sum + (periodData?.value || 0);
                  }, 0);

                  const maxExpense = Math.max(
                    ...expenseTableData.categories.flatMap(category =>
                      category.periods.map(p => p.value)
                    )
                  );

                  return (
                    <tr key={period} className={idx % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="py-2 px-4 font-medium">
                        {format(new Date(data.find(d => format(new Date(d.date), 'dd.MM') === period)?.date || ''),
                          'dd.MM', { locale: ru })}
                      </td>
                      <td
                        className="py-2 px-4 text-center font-bold"
                        style={{
                          backgroundColor: getExpenseColor(rowTotal, maxExpense)
                        }}
                      >
                        {rowTotal} zł
                      </td>
                      {expenseTableData.categories.map(category => {
                        const periodData = category.periods.find(p => p.period === period);
                        const value = periodData?.value || 0;
                        return (
                          <td
                            key={`${category.categoryName}-${period}`}
                            className="py-2 px-4 text-center"
                            style={{
                              backgroundColor: getExpenseColor(value, maxExpense)
                            }}
                          >
                            {value} zł
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border font-bold">
                  <td className="py-2 px-4">Итого</td>
                  <td className="py-2 px-4 text-center">
                    {expenseTableData.periods.reduce((total, period) => {
                      const periodTotal = expenseTableData.categories.reduce((sum, category) => {
                        const periodData = category.periods.find(p => p.period === period);
                        return sum + (periodData?.value || 0);
                      }, 0);
                      return total + periodTotal;
                    }, 0)} zł
                  </td>
                  {expenseTableData.categories.map(category => {
                    const categoryTotal = category.periods.reduce((sum, period) => {
                      return sum + (period.value || 0);
                    }, 0);
                    const maxTotal = Math.max(
                      ...expenseTableData.categories.map(cat =>
                        cat.periods.reduce((sum, p) => sum + (p.value || 0), 0)
                      )
                    );
                    return (
                      <td
                        key={`total-${category.categoryName}`}
                        className="py-2 px-4 text-center"
                        style={{
                          backgroundColor: getExpenseColor(categoryTotal, maxTotal)
                        }}
                      >
                        {categoryTotal} zł
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Ежедневный отчет
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="py-2 px-4 text-left">Дата</th>
                  <th className="py-2 px-4">Отчет</th>
                  <th className="py-2 px-4 text-right">Разное (zł)</th>
                </tr>
              </thead>
              <tbody>
                {data.map(day => {
                  const reportCategory = day.categories.find(c => c.name === "Отчет");
                  const reportTask = reportCategory?.tasks.find(t => t.type === TaskType.EXPENSE_NOTE);
                  const miscExpenses = day.categories
                    .filter(c => c.type === CategoryType.EXPENSE)
                    .reduce((sum, category) => {
                      return sum + category.tasks
                        .filter(t => t.type === TaskType.EXPENSE)
                        .reduce((taskSum, task) => taskSum + (task.value || 0), 0);
                    }, 0);

                  if (!reportTask?.textValue) return null;

                  return (
                    <tr key={day.date} className="border-b border-border/10">
                      <td className="py-2 px-4 font-medium">
                        {format(new Date(day.date), 'dd.MM.yyyy')}
                      </td>
                      <td className="py-2 px-4 whitespace-pre-wrap">
                        {reportTask.textValue}
                      </td>
                      <td className="py-2 px-4 text-right fontmedium">
                        {miscExpenses} zł
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}